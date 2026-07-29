import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { filterRowsForSite, rowMatchesAttribution } from "@/lib/sites/site-attribution";
import { SITE_CONFIGS } from "@/lib/sites/site-config";

const SEARCH_LIMIT = 12;
const APPLICATION_SELECT = "id, site_id, ref, first_name, last_name, email, created_at";

type ReadResult = {
  data: unknown[] | null;
  error: { message?: string } | null;
};

export type GlobalSearchResult = {
  id: string;
  reference: string;
  customerName: string;
  websiteName: string;
  submittedAt: string | null;
};

function normalizeQuery(value: string | null | undefined) {
  return value?.trim().slice(0, 120) ?? "";
}

function normalizeRow(row: Record<string, unknown>) {
  return {
    id: typeof row.id === "string" ? row.id : String(row.id ?? ""),
    site_id: typeof row.site_id === "string" ? row.site_id : row.site_id == null ? null : String(row.site_id),
    ref: typeof row.ref === "string" ? row.ref : null,
    first_name: typeof row.first_name === "string" ? row.first_name : null,
    last_name: typeof row.last_name === "string" ? row.last_name : null,
    email: typeof row.email === "string" ? row.email : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function siteNameForRow(row: Record<string, unknown>) {
  const site = SITE_CONFIGS
    .filter((entry) => entry.status !== "planned")
    .find((entry) => rowMatchesAttribution(row, entry.attribution));

  return site?.site_name ?? "Unknown website";
}

function resultFromRow(row: ReturnType<typeof normalizeRow>): GlobalSearchResult {
  return {
    id: row.id || row.ref || `${row.email}-${row.created_at}`,
    reference: row.ref || "No reference",
    customerName: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "Unknown customer",
    websiteName: siteNameForRow(row as unknown as Record<string, unknown>),
    submittedAt: row.created_at,
  };
}

function isSafeSearchText(query: string) {
  return query.replace(/[%_,.*()[\]{}]/g, " ").trim();
}

function matchingSites(query: string) {
  const lower = query.toLowerCase();
  return SITE_CONFIGS.filter((site) =>
    site.site_name.toLowerCase().includes(lower) ||
    site.domain.toLowerCase().includes(lower) ||
    site.site_id.toLowerCase().includes(lower)
  );
}

export async function searchApplications(queryValue: string | null | undefined, siteId?: string | null): Promise<{ results: GlobalSearchResult[]; error?: string }> {
  const query = normalizeQuery(queryValue);
  if (query.length < 2) return { results: [] };

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { results: [], error: "Supabase server credentials are not configured." };

  const safeText = isSafeSearchText(query);
  const siteMatches = matchingSites(query).filter((site) => site.status !== "planned");
  const reads: Promise<ReadResult>[] = [];

  reads.push(supabase.from("applications").select(APPLICATION_SELECT).eq("ref", query).limit(SEARCH_LIMIT) as unknown as Promise<ReadResult>);

  if (safeText) {
    const pattern = `%${safeText}%`;
    reads.push(supabase.from("applications").select(APPLICATION_SELECT).ilike("ref", pattern).limit(SEARCH_LIMIT) as unknown as Promise<ReadResult>);
    reads.push(supabase.from("applications").select(APPLICATION_SELECT).ilike("email", pattern).limit(SEARCH_LIMIT) as unknown as Promise<ReadResult>);
    reads.push(supabase.from("applications").select(APPLICATION_SELECT).ilike("first_name", pattern).limit(SEARCH_LIMIT) as unknown as Promise<ReadResult>);
    reads.push(supabase.from("applications").select(APPLICATION_SELECT).ilike("last_name", pattern).limit(SEARCH_LIMIT) as unknown as Promise<ReadResult>);
  }

  for (const site of siteMatches) {
    if (site.attribution?.field === "site_id") {
      reads.push(
        supabase
          .from("applications")
          .select(APPLICATION_SELECT)
          .eq("site_id", site.attribution.value)
          .order("created_at", { ascending: false })
          .limit(SEARCH_LIMIT) as unknown as Promise<ReadResult>,
      );
    }
  }

  const responses = await Promise.all(reads);
  const errors = responses.map((response) => response.error?.message).filter(Boolean);
  const rows = responses.flatMap((response) => response.data ?? []);
  const seen = new Set<string>();
  const normalized = rows
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map(normalizeRow)
    .filter((row) => {
      const key = row.id || row.ref || `${row.email}-${row.created_at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const filteredBySite = filterRowsForSite(normalized as unknown as Record<string, unknown>[], siteId) as unknown as typeof normalized;
  return {
    results: filteredBySite.slice(0, SEARCH_LIMIT).map(resultFromRow),
    error: errors[0],
  };
}
