import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_DOCUMENT_FIELDS,
  type ApplicationDocumentRecord,
  DOCUMENT_BUCKET,
  resolveSignedDocumentUrl,
} from "@/lib/documents/secure-document-access";
import { createSupabaseAdminClient, createSupabaseAuthServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/validation/env";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

async function readBody(request: NextRequest) {
  try {
    return (await request.json()) as { documentType?: unknown };
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const [{ documentId }, body] = await Promise.all([context.params, readBody(request)]);
  const env = getServerEnv();
  const authClient = await createSupabaseAuthServerClient();
  const adminClient = createSupabaseAdminClient();

  const result = await resolveSignedDocumentUrl(
    { documentId, documentType: body.documentType },
    {
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
      async findApplicationById(applicationId) {
        if (!adminClient) {
          throw new Error("Supabase admin client is not configured.");
        }

        const { data, error } = await adminClient
          .from("applications")
          .select(["id", ...ALLOWED_DOCUMENT_FIELDS].join(", "))
          .eq("id", applicationId)
          .maybeSingle();

        if (error) {
          throw new Error("Application lookup failed.");
        }

        return data as ApplicationDocumentRecord | null;
      },
      async createSignedUrl(storagePath, expiresIn) {
        if (!adminClient) {
          throw new Error("Supabase admin client is not configured.");
        }

        const { data, error } = await adminClient.storage
          .from(DOCUMENT_BUCKET)
          .createSignedUrl(storagePath, expiresIn);

        if (error) {
          throw new Error("Signed URL generation failed.");
        }

        return data.signedUrl ?? null;
      },
    },
  ).catch((error: unknown) => {
    console.error("[documents/signed-url]", error instanceof Error ? error.message : "Unexpected error");
    return {
      status: 503,
      body: { error: "Document access is temporarily unavailable." },
    };
  });

  return NextResponse.json(result.body, {
    status: result.status,
    headers: NO_STORE_HEADERS,
  });
}
