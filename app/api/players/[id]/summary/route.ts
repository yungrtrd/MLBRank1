import { NextRequest, NextResponse } from "next/server";

import { getPlayerSummary } from "@/lib/repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const summary = getPlayerSummary(id);

  if (!summary) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json(summary, {
    headers: {
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
