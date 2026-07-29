import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { searchApplications } from "@/lib/database/global-search";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized to search." }, { status: 403, headers: NO_STORE_HEADERS });
  }

  const query = request.nextUrl.searchParams.get("q");
  const siteId = request.nextUrl.searchParams.get("site");
  const { results, error } = await searchApplications(query, siteId);

  return NextResponse.json({ results, error }, { status: error ? 207 : 200, headers: NO_STORE_HEADERS });
}
