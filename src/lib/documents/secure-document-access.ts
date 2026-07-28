export const DOCUMENT_BUCKET = "documents";
export const SIGNED_URL_TTL_SECONDS = 60;

export const ALLOWED_DOCUMENT_FIELDS = [
  "file_selfie",
  "file_license_front",
  "file_license_back",
  "file_signature",
] as const;

export type DocumentField = (typeof ALLOWED_DOCUMENT_FIELDS)[number];

export type ApplicationDocumentRecord = {
  id: string;
} & Record<DocumentField, string | null>;

export type SignedDocumentResult = {
  status: number;
  body: {
    error?: string;
    signedUrl?: string;
    expiresIn?: number;
  };
};

export type SignedDocumentDependencies = {
  ownerAdminEmail?: string;
  getSessionUser: () => Promise<{ id: string; email: string | null } | null>;
  findApplicationById: (applicationId: string) => Promise<ApplicationDocumentRecord | null>;
  createSignedUrl: (storagePath: string, expiresIn: number) => Promise<string | null>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAllowedDocumentField(value: unknown): value is DocumentField {
  return typeof value === "string" && ALLOWED_DOCUMENT_FIELDS.includes(value as DocumentField);
}

export function isValidApplicationDocumentId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function safe(status: number, error: string): SignedDocumentResult {
  return { status, body: { error } };
}

export async function resolveSignedDocumentUrl(
  input: { documentId: unknown; documentType: unknown },
  deps: SignedDocumentDependencies,
): Promise<SignedDocumentResult> {
  if (!deps.ownerAdminEmail) {
    return safe(503, "Document access is not configured.");
  }

  const user = await deps.getSessionUser();
  if (!user) {
    return safe(401, "Authentication required.");
  }

  const userEmail = user.email?.toLowerCase();
  if (!userEmail || userEmail !== deps.ownerAdminEmail.toLowerCase()) {
    return safe(403, "Not authorized to view documents.");
  }

  if (!isValidApplicationDocumentId(input.documentId)) {
    return safe(400, "Invalid document request.");
  }

  if (!isAllowedDocumentField(input.documentType)) {
    return safe(400, "Invalid document type.");
  }

  const application = await deps.findApplicationById(input.documentId);
  if (!application) {
    return safe(404, "Application not found.");
  }

  const storagePath = application[input.documentType];
  if (!storagePath) {
    return safe(404, "Document not found.");
  }

  const signedUrl = await deps.createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (!signedUrl) {
    return safe(502, "Could not create document link.");
  }

  return {
    status: 200,
    body: {
      signedUrl,
      expiresIn: SIGNED_URL_TTL_SECONDS,
    },
  };
}
