import { NextResponse } from "next/server";

import { metricCatalog } from "@/lib/metrics";

export function GET() {
  return NextResponse.json(
    {
      metrics: metricCatalog
    },
    {
      headers: {
        "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800"
      }
    }
  );
}
