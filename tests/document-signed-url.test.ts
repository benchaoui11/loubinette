import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  type ApplicationDocumentRecord,
  resolveSignedDocumentUrl,
  SIGNED_URL_TTL_SECONDS,
  type SignedDocumentDependencies,
} from "@/lib/documents/secure-document-access";

const VALID_DOCUMENT_ID = "11111111-1111-4111-8111-111111111111";
const OWNER_EMAIL = "owner@example.com";
const SAFE_SIGNED_URL = "https://example.supabase.co/storage/v1/object/sign/documents/redacted?token=safe";

function deps(overrides: Partial<SignedDocumentDependencies> = {}): SignedDocumentDependencies {
  return {
    ownerAdminEmail: OWNER_EMAIL,
    getSessionUser: async () => ({ id: "admin-user", email: OWNER_EMAIL }),
    findApplicationById: async () => ({
      id: VALID_DOCUMENT_ID,
      file_selfie: "private/selfie.jpg",
      file_license_front: "private/front.jpg",
      file_license_back: "private/back.jpg",
      file_signature: "private/signature.png",
    }),
    createSignedUrl: async () => SAFE_SIGNED_URL,
    ...overrides,
  };
}

describe("secure document signed URL access", () => {
  it("rejects unauthenticated access", async () => {
    const result = await resolveSignedDocumentUrl(
      { documentId: VALID_DOCUMENT_ID, documentType: "file_selfie" },
      deps({ getSessionUser: async () => null }),
    );

    expect(result.status).toBe(401);
    expect(result.body.error).toBe("Authentication required.");
  });

  it("rejects authenticated users who are not the owner admin email", async () => {
    const result = await resolveSignedDocumentUrl(
      { documentId: VALID_DOCUMENT_ID, documentType: "file_selfie" },
      deps({ getSessionUser: async () => ({ id: "other-user", email: "other@example.com" }) }),
    );

    expect(result.status).toBe(403);
    expect(result.body.error).toBe("Not authorized to view documents.");
  });

  it("rejects invalid document IDs before database lookup", async () => {
    let lookedUpApplication = false;
    const result = await resolveSignedDocumentUrl(
      { documentId: "not-a-valid-id", documentType: "file_selfie" },
      deps({
        findApplicationById: async () => {
          lookedUpApplication = true;
          return null;
        },
      }),
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Invalid document request.");
    expect(lookedUpApplication).toBe(false);
  });

  it("rejects document fields outside the allowlist", async () => {
    const result = await resolveSignedDocumentUrl(
      { documentId: VALID_DOCUMENT_ID, documentType: "passport_scan" },
      deps(),
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Invalid document type.");
  });

  it("returns a safe missing application error", async () => {
    const result = await resolveSignedDocumentUrl(
      { documentId: VALID_DOCUMENT_ID, documentType: "file_license_front" },
      deps({ findApplicationById: async () => null }),
    );

    expect(result.status).toBe(404);
    expect(result.body.error).toBe("Application not found.");
  });

  it("generates a 60-second signed URL for an allowed document", async () => {
    let signedPath = "";
    let signedTtl = 0;
    const result = await resolveSignedDocumentUrl(
      { documentId: VALID_DOCUMENT_ID, documentType: "file_license_back" },
      deps({
        createSignedUrl: async (storagePath, expiresIn) => {
          signedPath = storagePath;
          signedTtl = expiresIn;
          return SAFE_SIGNED_URL;
        },
      }),
    );

    expect(result.status).toBe(200);
    expect(result.body.signedUrl).toBe(SAFE_SIGNED_URL);
    expect(result.body.expiresIn).toBe(SIGNED_URL_TTL_SECONDS);
    expect(signedPath).toBe("private/back.jpg");
    expect(signedTtl).toBe(60);
  });

  it("does not include storage paths in safe error responses", async () => {
    const app: ApplicationDocumentRecord = {
      id: VALID_DOCUMENT_ID,
      file_selfie: "private/selfie.jpg",
      file_license_front: null,
      file_license_back: null,
      file_signature: null,
    };

    const result = await resolveSignedDocumentUrl(
      { documentId: VALID_DOCUMENT_ID, documentType: "file_license_front" },
      deps({ findApplicationById: async () => app }),
    );

    expect(JSON.stringify(result.body)).not.toContain("private/");
    expect(result.status).toBe(404);
  });
});

describe("service-role secret exposure guard", () => {
  it("does not reference the service-role secret in client-side source or built client assets", () => {
    const roots = [
      path.join(process.cwd(), "src/components"),
      path.join(process.cwd(), "src/app/(dashboard)"),
      path.join(process.cwd(), "src/app/(auth)"),
      path.join(process.cwd(), ".next/static"),
    ];
    const files = roots.flatMap((root) => collectFiles(root));
    const actualSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;

    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents, file).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      if (actualSecret) {
        expect(contents, file).not.toContain(actualSecret);
      }
    }
  });
});

function collectFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const stat = fs.statSync(root);
  if (stat.isFile()) return [root];

  return fs.readdirSync(root).flatMap((entry) => {
    const fullPath = path.join(root, entry);
    const entryStat = fs.statSync(fullPath);
    if (entryStat.isDirectory()) return collectFiles(fullPath);
    return entryStat.isFile() ? [fullPath] : [];
  });
}
