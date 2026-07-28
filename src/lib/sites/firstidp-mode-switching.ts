export const FIRSTIDP_SWITCHABLE_SITE_ID = "firstidp";
export const FIRSTIDP_SITE_SETTINGS_ROW_ID = 1;

export const FIRSTIDP_MODES = ["offer", "white"] as const;

export type FirstIdpMode = (typeof FIRSTIDP_MODES)[number];

export type FirstIdpModeRecord = {
  mode: FirstIdpMode;
  updated_at: string | null;
  updated_by: string | null;
};

export type FirstIdpModeResult = {
  status: number;
  body: {
    error?: string;
    mode?: FirstIdpMode;
    updatedAt?: string | null;
    updatedBy?: string | null;
    changed?: boolean;
  };
};

export type FirstIdpModeDependencies = {
  ownerAdminEmail?: string;
  getSessionUser: () => Promise<{ id: string; email: string | null } | null>;
  readCurrentMode: () => Promise<FirstIdpModeRecord | null>;
  updateMode: (mode: FirstIdpMode, updatedBy: string) => Promise<FirstIdpModeRecord | null>;
};

type AuthResult =
  | { ok: true; userEmail: string }
  | { ok: false; result: FirstIdpModeResult };

export function isFirstIdpMode(value: unknown): value is FirstIdpMode {
  return typeof value === "string" && FIRSTIDP_MODES.includes(value as FirstIdpMode);
}

function safe(status: number, error: string): FirstIdpModeResult {
  return { status, body: { error } };
}

function success(record: FirstIdpModeRecord, changed = false): FirstIdpModeResult {
  return {
    status: 200,
    body: {
      mode: record.mode,
      updatedAt: record.updated_at,
      updatedBy: record.updated_by,
      changed,
    },
  };
}

async function authorize(siteId: string, deps: FirstIdpModeDependencies): Promise<AuthResult> {
  if (!deps.ownerAdminEmail) {
    return { ok: false, result: safe(503, "Page switching is not configured.") };
  }

  const user = await deps.getSessionUser();
  if (!user) {
    return { ok: false, result: safe(401, "Authentication required.") };
  }

  const userEmail = user.email?.toLowerCase();
  if (!userEmail || userEmail !== deps.ownerAdminEmail.toLowerCase()) {
    return { ok: false, result: safe(403, "Not authorized to switch pages.") };
  }

  if (siteId !== FIRSTIDP_SWITCHABLE_SITE_ID) {
    return { ok: false, result: safe(400, "Page switching is available for FirstIDP only.") };
  }

  return { ok: true, userEmail };
}

export async function resolveFirstIdpModeRead(
  input: { siteId: string },
  deps: FirstIdpModeDependencies,
): Promise<FirstIdpModeResult> {
  const auth = await authorize(input.siteId, deps);
  if (!auth.ok) return auth.result;

  const record = await deps.readCurrentMode();
  if (!record) {
    return safe(404, "FirstIDP page mode was not found.");
  }

  return success(record);
}

export async function resolveFirstIdpModeSwitch(
  input: { siteId: string; mode: unknown },
  deps: FirstIdpModeDependencies,
): Promise<FirstIdpModeResult> {
  const auth = await authorize(input.siteId, deps);
  if (!auth.ok) return auth.result;

  if (!isFirstIdpMode(input.mode)) {
    return safe(400, "Invalid mode. Use offer or white.");
  }

  const current = await deps.readCurrentMode();
  if (!current) {
    return safe(404, "FirstIDP page mode was not found.");
  }

  if (current.mode === input.mode) {
    return success(current, false);
  }

  const updated = await deps.updateMode(input.mode, auth.userEmail);
  if (!updated) {
    return safe(502, "Could not update FirstIDP page mode.");
  }

  return success(updated, true);
}
