import { writeFile } from "node:fs/promises";

const teamIdByMlbId = {
  108: "angels",
  109: "diamondbacks",
  110: "orioles",
  111: "red-sox",
  112: "cubs",
  113: "reds",
  114: "guardians",
  115: "rockies",
  116: "tigers",
  117: "astros",
  118: "royals",
  119: "dodgers",
  120: "nationals",
  121: "mets",
  133: "athletics",
  134: "pirates",
  135: "padres",
  136: "mariners",
  137: "giants",
  138: "cardinals",
  139: "rays",
  140: "rangers",
  141: "blue-jays",
  142: "twins",
  143: "phillies",
  144: "braves",
  145: "white-sox",
  146: "marlins",
  147: "yankees",
  158: "brewers"
};

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${url}`);
  }

  return response.json();
}

function sortRoster(left, right) {
  if (left.position === "P" && right.position !== "P") {
    return -1;
  }

  if (left.position !== "P" && right.position === "P") {
    return 1;
  }

  return left.name.localeCompare(right.name);
}

const teamsResponse = await getJson("https://statsapi.mlb.com/api/v1/teams?sportId=1");
const teams = teamsResponse.teams
  .map((team) => ({
    mlbTeamId: team.id,
    teamId: teamIdByMlbId[team.id],
    name: team.name,
    abbreviation: team.abbreviation
  }))
  .filter((team) => team.teamId);

const rosters = await Promise.all(
  teams.map(async (team) => {
    const rosterResponse = await getJson(
      `https://statsapi.mlb.com/api/v1/teams/${team.mlbTeamId}/roster?rosterType=active`
    );

    return {
      ...team,
      players: rosterResponse.roster
        .map((player) => ({
          id: player.person.id,
          name: player.person.fullName,
          jerseyNumber: player.jerseyNumber ?? "",
          position: player.position.abbreviation,
          positionName: player.position.name,
          status: player.status.description
        }))
        .sort(sortRoster)
    };
  })
);

const file = `export type RosterPlayer = {
  id: number;
  name: string;
  jerseyNumber: string;
  position: string;
  positionName: string;
  status: string;
};

export type TeamRoster = {
  teamId: string;
  mlbTeamId: number;
  name: string;
  abbreviation: string;
  players: RosterPlayer[];
};

export const rosterLastUpdated = ${JSON.stringify(new Date().toISOString())};

export const teamRosters: TeamRoster[] = ${JSON.stringify(rosters, null, 2)};
`;

await writeFile("lib/data/mlb-rosters.ts", file);
console.log(`Wrote ${rosters.length} team rosters to lib/data/mlb-rosters.ts`);
