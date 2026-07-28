import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  resolveFirstIdpModeSwitch,
  type FirstIdpMode,
  type FirstIdpModeDependencies,
  type FirstIdpModeRecord,
} from "@/lib/sites/firstidp-mode-switching";
import { FIRSTIDP_SITE_UUID } from "@/lib/sites/site-config";

const OWNER_EMAIL = "owner@example.com";

function deps(overrides: Partial<FirstIdpModeDependencies> = {}): FirstIdpModeDependencies {
  return {
    ownerAdminEmail: OWNER_EMAIL,
    getSessionUser: async () => ({ id: "owner-user", email: OWNER_EMAIL }),
    readCurrentMode: async (siteId) => ({ site_id: siteId, mode: "offer", updated_at: null, updated_by: null }),
    updateMode: async (siteId, mode, updatedBy) => ({ site_id: siteId, mode, updated_at: "2026-07-28T09:00:00.000Z", updated_by: updatedBy }),
    ...overrides,
  };
}

describe("FirstIDP mode switching security", () => {
  it("rejects unauthenticated requests", async () => {
    const result = await resolveFirstIdpModeSwitch(
      { siteId: FIRSTIDP_SITE_UUID, mode: "white" },
      deps({ getSessionUser: async () => null }),
    );

    expect(result.status).toBe(401);
    expect(result.body.error).toBe("Authentication required.");
  });

  it("rejects authenticated users who are not the owner admin email", async () => {
    const result = await resolveFirstIdpModeSwitch(
      { siteId: FIRSTIDP_SITE_UUID, mode: "white" },
      deps({ getSessionUser: async () => ({ id: "other-user", email: "other@example.com" }) }),
    );

    expect(result.status).toBe(403);
    expect(result.body.error).toBe("Not authorized to switch pages.");
  });

  it("rejects invalid modes before updating", async () => {
    let updated = false;
    const result = await resolveFirstIdpModeSwitch(
      { siteId: FIRSTIDP_SITE_UUID, mode: "maintenance" },
      deps({
        updateMode: async () => {
          updated = true;
          return null;
        },
      }),
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Invalid mode. Use offer or white.");
    expect(updated).toBe(false);
  });

  it("rejects WorldIDP switching", async () => {
    let read = false;
    let updated = false;
    const result = await resolveFirstIdpModeSwitch(
      { siteId: "f1f5c0de-0002-4b44-8a1d-000000000002", mode: "white" },
      deps({
        readCurrentMode: async () => {
          read = true;
          return null;
        },
        updateMode: async () => {
          updated = true;
          return null;
        },
      }),
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Page switching is available for FirstIDP only.");
    expect(read).toBe(false);
    expect(updated).toBe(false);
  });

  it("updates FirstIDP from offer to white", async () => {
    let updatedMode: FirstIdpMode | null = null;
    let updatedBy = "";
    const result = await resolveFirstIdpModeSwitch(
      { siteId: FIRSTIDP_SITE_UUID, mode: "white" },
      deps({
        updateMode: async (siteId, mode, userEmail): Promise<FirstIdpModeRecord> => {
          updatedMode = mode;
          updatedBy = userEmail;
          return { site_id: siteId, mode, updated_at: "2026-07-28T09:00:00.000Z", updated_by: userEmail };
        },
      }),
    );

    expect(result.status).toBe(200);
    expect(result.body.mode).toBe("white");
    expect(result.body.changed).toBe(true);
    expect(updatedMode).toBe("white");
    expect(updatedBy).toBe(OWNER_EMAIL);
  });

  it("creates the FirstIDP site settings row when it does not exist", async () => {
    let upsertedSiteId = "";
    const result = await resolveFirstIdpModeSwitch(
      { siteId: FIRSTIDP_SITE_UUID, mode: "white" },
      deps({
        readCurrentMode: async () => null,
        updateMode: async (siteId, mode, userEmail): Promise<FirstIdpModeRecord> => {
          upsertedSiteId = siteId;
          return { site_id: siteId, mode, updated_at: "2026-07-28T09:00:00.000Z", updated_by: userEmail };
        },
      }),
    );

    expect(result.status).toBe(200);
    expect(result.body.mode).toBe("white");
    expect(result.body.changed).toBe(true);
    expect(upsertedSiteId).toBe(FIRSTIDP_SITE_UUID);
  });
});

describe("FirstIDP switching secret exposure guard", () => {
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
