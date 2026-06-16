import { NextRequest, NextResponse } from "next/server";

import { buildComparison, toCsv } from "@/lib/compare";
import { compareRequestSchema } from "@/lib/validation";

function requestFromSearchParams(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const inningMin = params.get("inningMin");
  const inningMax = params.get("inningMax");
  const maxRunMargin = params.get("maxRunMargin");
  return {
    playerIds: (params.get("players") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    mode: params.get("mode") ?? "season",
    metrics: (params.get("metrics") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    startYear: params.get("startYear") ? Number(params.get("startYear")) : undefined,
    endYear: params.get("endYear") ? Number(params.get("endYear")) : undefined,
    role: params.get("role") ?? undefined,
    situation:
      inningMin || inningMax || maxRunMargin
        ? {
            inningMin: inningMin ? Number(inningMin) : undefined,
            inningMax: inningMax ? Number(inningMax) : undefined,
            maxRunMargin: maxRunMargin ? Number(maxRunMargin) : undefined
          }
        : undefined
  };
}

export async function GET(request: NextRequest) {
  const parsed = compareRequestSchema.safeParse(requestFromSearchParams(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid compare query", issues: parsed.error.flatten() }, { status: 400 });
  }

  const response = buildComparison(parsed.data);
  if (request.nextUrl.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(response), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="comparison.csv"',
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    });
  }

  return NextResponse.json(response, {
    headers: {
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = compareRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid compare payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(buildComparison(parsed.data));
}
