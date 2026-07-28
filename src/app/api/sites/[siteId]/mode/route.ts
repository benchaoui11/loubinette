import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  FIRSTIDP_SITE_SETTINGS_ROW_ID,
  isFirstIdpMode,
  resolveFirstIdpModeRead,
  resolveFirstIdpModeSwitch,
  type FirstIdpMode,
  type FirstIdpModeDependencies,
  type FirstIdpModeRecord,
} from "@/lib/sites/firstidp-mode-switching";
import { createSupabaseAdminClient, createSupabaseAuthServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/validation/env";

type RouteContext = {
  params: Promise<{ siteId: string }>;
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

async function readBody(request: NextRequest) {
  try {
    return (await request.json()) as { mode?: unknown };
  } catch {
    return {};
  }
}

async function createDependencies(): Promise<FirstIdpModeDependencies> {
  const env = getServerEnv();
  const authClient = await createSupabaseAuthServerClient();
  const adminClient = createSupabaseAdminClient();

  return {
    ownerAdminEmail: env.OWNER_ADMIN_EMAIL,
    async getSessionUser() {
      if (!authClient) return null;

      const {
        data: { user },
        error,
      } = await authClient.auth.getUser();

      if (error || !user) return null;
      return { id: user.id, email: user.email ?? null };
    },
    async readCurrentMode() {
      if (!adminClient) {
        throw new Error("Supabase admin client is not configured.");
      }

      const { data, error } = await adminClient
        .from("site_settings")
        .select("mode, updated_at, updated_by")
        .eq("id", FIRSTIDP_SITE_SETTINGS_ROW_ID)
        .maybeSingle();

      if (error) {
        throw new Error("FirstIDP mode lookup failed.");
      }

      return normalizeModeRecord(data);
    },
    async updateMode(mode: FirstIdpMode, updatedBy: string) {
      if (!adminClient) {
        throw new Error("Supabase admin client is not configured.");
      }

      const { data, error } = await adminClient
        .from("site_settings")
        .update({
          mode,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        })
        .eq("id", FIRSTIDP_SITE_SETTINGS_ROW_ID)
        .select("mode, updated_at, updated_by")
        .maybeSingle();

      if (error) {
        throw new Error("FirstIDP mode update failed.");
      }

      return normalizeModeRecord(data);
    },
  };
}

function normalizeModeRecord(data: unknown): FirstIdpModeRecord | null {
  if (!data || typeof data !== "object") return null;
  const record = data as { mode?: unknown; updated_at?: unknown; updated_by?: unknown };
  if (!isFirstIdpMode(record.mode)) return null;

  return {
    mode: record.mode,
    updated_at: typeof record.updated_at === "string" ? record.updated_at : null,
    updated_by: typeof record.updated_by === "string" ? record.updated_by : null,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { siteId } = await context.params;

  const result = await (async () => resolveFirstIdpModeRead({ siteId }, await createDependencies()))().catch((error: unknown) => {
    console.error("[firstidp/mode:get]", error instanceof Error ? error.message : "Unexpected error");
    return {
      status: 503,
      body: { error: "FirstIDP page mode is temporarily unavailable." },
    };
  });

  return NextResponse.json(result.body, {
    status: result.status,
    headers: NO_STORE_HEADERS,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const [{ siteId }, body] = await Promise.all([context.params, readBody(request)]);

  const result = await (async () => resolveFirstIdpModeSwitch({ siteId, mode: body.mode }, await createDependencies()))().catch((error: unknown) => {
    console.error("[firstidp/mode:post]", error instanceof Error ? error.message : "Unexpected error");
    return {
      status: 503,
      body: { error: "FirstIDP page mode is temporarily unavailable." },
    };
  });

  return NextResponse.json(result.body, {
    status: result.status,
    headers: NO_STORE_HEADERS,
  });
}
