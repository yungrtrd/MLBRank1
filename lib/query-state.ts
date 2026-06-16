import { CompareRequest } from "@/lib/types";

export type ComparePageState = {
  playerIds: string[];
  mode: "season" | "career";
  role: "hitter" | "pitcher";
  metrics: string[];
  startYear?: number;
  endYear?: number;
  inningMin?: number;
  inningMax?: number;
  maxRunMargin?: number;
  sortBy?: string;
  sortDirection: "asc" | "desc";
};

export function parseCompareState(searchParams: Record<string, string | string[] | undefined>): ComparePageState {
  const playerIds = String(searchParams.players ?? "shohei-ohtani,aaron-judge")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 6);
  const mode = searchParams.mode === "career" ? "career" : "season";
  const role = searchParams.role === "pitcher" ? "pitcher" : "hitter";
  const metrics = String(
    searchParams.metrics ??
      (role === "pitcher" ? "war,era,fip,era_plus,ip,so,whip" : "war,wrc_plus,ops_plus,hr,avg,obp,slg")
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const startYear = Number(searchParams.startYear);
  const endYear = Number(searchParams.endYear);
  const inningMin = Number(searchParams.inningMin);
  const inningMax = Number(searchParams.inningMax);
  const maxRunMargin = Number(searchParams.maxRunMargin);
  const sortBy = typeof searchParams.sortBy === "string" ? searchParams.sortBy : undefined;
  const sortDirection = searchParams.sortDirection === "asc" ? "asc" : "desc";

  return {
    playerIds,
    mode,
    role,
    metrics,
    startYear: Number.isFinite(startYear) && startYear > 0 ? startYear : undefined,
    endYear: Number.isFinite(endYear) && endYear > 0 ? endYear : undefined,
    inningMin: Number.isFinite(inningMin) && inningMin > 0 ? inningMin : undefined,
    inningMax: Number.isFinite(inningMax) && inningMax > 0 ? inningMax : undefined,
    maxRunMargin: Number.isFinite(maxRunMargin) && maxRunMargin > 0 ? maxRunMargin : undefined,
    sortBy,
    sortDirection
  };
}

export function buildCompareHref(state: ComparePageState) {
  const params = new URLSearchParams();
  params.set("players", state.playerIds.join(","));
  params.set("mode", state.mode);
  params.set("role", state.role);
  params.set("metrics", state.metrics.join(","));
  if (state.startYear) {
    params.set("startYear", String(state.startYear));
  }
  if (state.endYear) {
    params.set("endYear", String(state.endYear));
  }
  if (state.inningMin) {
    params.set("inningMin", String(state.inningMin));
  }
  if (state.inningMax) {
    params.set("inningMax", String(state.inningMax));
  }
  if (state.maxRunMargin) {
    params.set("maxRunMargin", String(state.maxRunMargin));
  }
  if (state.sortBy) {
    params.set("sortBy", state.sortBy);
  }
  params.set("sortDirection", state.sortDirection);
  return `/compare?${params.toString()}`;
}

export function toCompareRequest(state: ComparePageState): CompareRequest {
  return {
    playerIds: state.playerIds,
    mode: state.mode,
    role: state.role,
    metrics: state.metrics,
    startYear: state.startYear,
    endYear: state.endYear,
    situation:
      state.inningMin || state.inningMax || state.maxRunMargin
        ? {
            inningMin: state.inningMin,
            inningMax: state.inningMax,
            maxRunMargin: state.maxRunMargin
          }
        : undefined
  };
}
