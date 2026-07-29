import "server-only";

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseAuthServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/validation/env";
import type { ApplicationStatus } from "@/types/firstidp";

type RouteContext = {
  params: Promise<{ applicationId: string }>;
};

type StatusBody = {
  status?: unknown;
  reference?: unknown;
  siteId?: unknown;
};

type ApplicationStatusRecord = {
  id: string;
  ref: string | null;
  site_id: string | null;
  status: ApplicationStatus | null;
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const ALLOWED_STATUS_VALUES = [
  "submitted",
  "under_review",
  "delivered",
  "cancelled",
  "rejected",
] as const;

const DASHBOARD_PATHS_TO_REVALIDATE = [
  "/command-center",
  "/applications",
  "/analytics",
  "/documents",
  "/visitors",
  "/live-activity",
];

function isAllowedStatus(value: unknown): value is (typeof ALLOWED_STATUS_VALUES)[number] {
  return typeof value === "string" && ALLOWED_STATUS_VALUES.includes(value as (typeof ALLOWED_STATUS_VALUES)[number]);
}

async function readBody(request: NextRequest): Promise<StatusBody> {
  try {
    return (await request.json()) as StatusBody;
  } catch {
    return {};
  }
}

async function getSessionUser() {
  const authClient = await createSupabaseAuthServerClient();
  if (!authClient) return null;

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return null;
  return { id: user.id, email: user.email ?? null };
}

async function authorizeOwnerAdmin() {
  const env = getServerEnv();
  if (!env.OWNER_ADMIN_EMAIL) {
    return { ok: false as const, status: 503, error: "Application status updates are not configured." };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false as const, status: 401, error: "Authentication required." };
  }

  const userEmail = user.email?.toLowerCase();
  if (!userEmail || userEmail !== env.OWNER_ADMIN_EMAIL.toLowerCase()) {
    return { ok: false as const, status: 403, error: "Not authorized to update application status." };
  }

  return { ok: true as const, userEmail };
}

function revalidateDashboardViews() {
  for (const path of DASHBOARD_PATHS_TO_REVALIDATE) {
    revalidatePath(path);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const [{ applicationId }, body] = await Promise.all([context.params, readBody(request)]);
  const auth = await authorizeOwnerAdmin();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE_HEADERS });
  }

  if (!isAllowedStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Application status updates are temporarily unavailable." }, { status: 503, headers: NO_STORE_HEADERS });
  }

  const { data: existingApplication, error: readError } = await adminClient
    .from("applications")
    .select("id, ref, site_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (readError) {
    console.error("[applications/status:read]", readError.message);
    return NextResponse.json({ error: "Application status could not be loaded." }, { status: 502, headers: NO_STORE_HEADERS });
  }

  const existing = existingApplication as ApplicationStatusRecord | null;
  if (!existing) {
    return NextResponse.json({ error: "Application not found." }, { status: 404, headers: NO_STORE_HEADERS });
  }

  if (typeof body.reference === "string" && existing.ref && body.reference !== existing.ref) {
    return NextResponse.json({ error: "Application reference did not match the selected row." }, { status: 409, headers: NO_STORE_HEADERS });
  }

  if (typeof body.siteId === "string" && existing.site_id && body.siteId !== existing.site_id) {
    return NextResponse.json({ error: "Application website attribution did not match the selected row." }, { status: 409, headers: NO_STORE_HEADERS });
  }

  if (existing.status === body.status) {
    return NextResponse.json({ status: existing.status, changed: false }, { status: 200, headers: NO_STORE_HEADERS });
  }

  const { data: updatedApplication, error: updateError } = await adminClient
    .from("applications")
    .update({ status: body.status })
    .eq("id", applicationId)
    .select("id, ref, site_id, status")
    .maybeSingle();

  if (updateError) {
    console.error("[applications/status:update]", updateError.message);
    return NextResponse.json({ error: "Application status could not be updated." }, { status: 502, headers: NO_STORE_HEADERS });
  }

  const updated = updatedApplication as ApplicationStatusRecord | null;
  if (!updated) {
    return NextResponse.json({ error: "Application status update did not return a row." }, { status: 502, headers: NO_STORE_HEADERS });
  }

  revalidateDashboardViews();

  return NextResponse.json({ status: updated.status, changed: true }, { status: 200, headers: NO_STORE_HEADERS });
}
