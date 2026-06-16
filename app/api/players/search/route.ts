import { NextRequest, NextResponse } from "next/server";

import { searchPlayers } from "@/lib/repository";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const role = request.nextUrl.searchParams.get("role");

  return NextResponse.json(
    {
      players: searchPlayers(query, role === "pitcher" || role === "hitter" ? role : undefined)
    },
    {
      headers: {
        "cache-control": "public, s-maxage=1800, stale-while-revalidate=86400"
      }
    }
  );
}
