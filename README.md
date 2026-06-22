# Sports Ranking Hub

A Next.js sports ranking site for building personal MLB and NFL player rankings through head-to-head choices.

The app currently has two visible sections on the home page:

- `MLB Ranking`: rank baseball players by category.
- `NFL Ranking`: rank football players by all players or by individual fantasy positions.

The fantasy football dashboard still exists at `/fantasy-football`, but it is intentionally hidden from the home page for now.

## Project Location

```bash
/Users/julianbox/Documents/New project
```

## Tech Stack

- Next.js `15.5.19`
- React `19.0.0`
- TypeScript
- Plain CSS in `app/globals.css`
- Static generated data files in `lib/data`

There is no database or backend server. All ranking data is bundled into the site as TypeScript data files.

## Main Commands

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

Use `npm run dev` for local development. By default it runs at:

```bash
http://localhost:3000
```

Use `npm run build` before publishing. It compiles the full production version and checks the Next.js app.

## App Routes

### `/`

File: `app/page.tsx`

This is the home page. It shows the main navigation cards:

- `MLB Ranking` links to `/baseball`
- `NFL Ranking` links to `/football-sorter`

The fantasy football card was removed from the home page, but the route still exists.

### `/baseball`

File: `app/baseball/page.tsx`

Renders the MLB ranking sorter from:

```ts
components/PlayerSorter.tsx
```

### `/football-sorter`

File: `app/football-sorter/page.tsx`

Renders the NFL ranking sorter from:

```ts
components/FootballPlayerSorter.tsx
```

### `/fantasy-football`

File: `app/fantasy-football/page.tsx`

Renders the fantasy football dashboard from:

```ts
components/FantasyFootballDashboard.tsx
```

This page is still available directly, but it is not linked from the home page.

## Styling

All global styles live in:

```ts
app/globals.css
```

The app uses shared layout classes for both sports:

- `home-shell`
- `section-grid`
- `section-card`
- `site-shell`
- `sorter-setup`
- `sorter-board`
- `sorter-choice`
- `sorter-results`
- `table-scroll`

The visual design is intentionally simple: cards on the home page, tabs for ranking categories, matchup buttons for choosing players, and a live leaderboard table.

## MLB Ranking System

Main component:

```ts
components/PlayerSorter.tsx
```

Data file:

```ts
lib/data/sorter-players.ts
```

### MLB Data Source

The MLB data was generated from Sports Reference exports supplied during development.

Rules used for the player pool:

- Position players: only players with `50+` games.
- Pitchers: players with `25+` appearances or `50+` innings pitched.

Each player includes:

- name
- team
- position
- image URL
- slash line
- WAR
- innings pitched, when applicable

### MLB Categories

The MLB sorter supports:

- All players
- All position players
- All pitchers
- Catchers
- First base
- Second base
- Third base
- Shortstop
- Left field
- Center field
- Right field
- Designated hitters
- Starting pitchers
- Closers

### MLB All Players Rule

For the `All players` tab:

- The player pool is the top `200` players by WAR.
- The final ranking is capped at the top `100`.

This is handled in `components/PlayerSorter.tsx` with:

```ts
const allPlayersPoolSize = 200;
const allPlayersRankingSize = 100;
```

### MLB Ranking Display

The matchup cards show:

- player image
- player name
- team and position
- slash line

The ranking table shows:

- rank
- player
- slash line
- position
- WAR
- innings pitched when pitchers are part of the selected pool

For position-player-only lists, innings pitched is hidden.

## NFL Ranking System

Main component:

```ts
components/FootballPlayerSorter.tsx
```

Data files:

```ts
lib/data/fantasy-draft.ts
lib/data/fantasy-football.ts
lib/data/fantasy-movement.ts
```

### NFL Data Sources

The NFL sorter is built from the fantasy football data files already in the project.

Important data files:

- `fantasy-draft.ts`: draft score, fantasy points, consistency, targets, games, and ranking model values.
- `fantasy-football.ts`: full-season and weekly passing, rushing, and receiving stats.
- `fantasy-movement.ts`: player movement and coach movement for changed teams.

### NFL Depth Chart Pool

The NFL sorter uses a depth-chart-sized player pool:

- `32` quarterbacks
- `64` running backs
- `64` wide receivers
- `32` tight ends
- `192` total players in the `All players` tab

Depth-chart slots by team:

- `1 QB`
- `2 RB`
- `2 WR`
- `1 TE`

The code first applies player movement, then groups players by current team and position. Within each team and position, it chooses the best fantasy options using draft score, fantasy points, targets, and games.

If a position is short after the team-based selection, the app fills the remaining spots with the next best available players at that position.

### NFL Changed Teams

Changed-team players come from:

```ts
lib/data/fantasy-movement.ts
```

The sorter matches names even when formatting differs, such as:

- `A. J. Brown` and `A.J. Brown`
- `D. J. Moore` and `D.J. Moore`
- suffixes like `II`, `III`, and `Jr.`

When a player changed teams, the UI shows the move like:

```txt
PHI to NE
```

### NFL Categories

The NFL sorter supports:

- All players
- Quarterbacks
- Running backs
- Wide receivers
- Tight ends

### NFL Stat Lines

NFL matchup cards and ranking rows show position-specific stats.

Quarterbacks show:

- fantasy PPG
- passing yards
- passing touchdowns

Running backs show:

- fantasy PPG
- yards per carry
- total touchdowns
- total yards

Wide receivers show:

- fantasy PPG
- receiving yards per game
- receptions
- receiving touchdowns

Tight ends show the same format as receivers:

- fantasy PPG
- receiving yards per game
- receptions
- receiving touchdowns

## How The Sorting Algorithm Works

Both the MLB and NFL sorters use the same general ranking approach.

Instead of comparing every player to every other player, the app builds a ranking through head-to-head insertion.

At a high level:

1. The selected player pool is shuffled in a repeatable way.
2. The first player starts the ranking.
3. The next player becomes the candidate.
4. The candidate is compared against a player already in the ranking.
5. The app uses the user choice to narrow where the candidate belongs.
6. Once the correct spot is found, the candidate is inserted into the ranking.
7. The process repeats until every required player has been placed.

This is similar to a binary insertion sort. It reduces the number of choices compared with asking every possible matchup.

### Undo And Reset

Both sorters include:

- `Undo`: returns to the previous choice state.
- `Reset this ranking`: starts the selected category over.

The undo history is stored in React state while the page is open.

## Saving Final Rankings

Both the MLB and NFL sorters include a `Save final list` button.

The button is disabled until the selected ranking is complete. Once the ranking is complete, clicking it downloads a CSV file.

### MLB CSV Columns

- Rank
- Player
- Team
- Position
- Slash line
- WAR
- IP

### NFL CSV Columns

- Rank
- Player
- Team
- Position
- Stats

The save feature is client-side only. It creates the CSV in the browser and downloads it. No server or database is involved.

## Fantasy Football Dashboard

Main component:

```ts
components/FantasyFootballDashboard.tsx
```

The fantasy football dashboard includes tools for:

- draft model rows
- 2026 projections
- season totals
- weekly leaders
- player and coach movement
- position filtering
- projection detail popups

This section was useful while building the NFL ranking system, but it is currently hidden from the home page.

Direct URL:

```txt
/fantasy-football
```

## Important Files

### App Shell

```txt
app/layout.tsx
app/page.tsx
app/globals.css
```

### Pages

```txt
app/baseball/page.tsx
app/football-sorter/page.tsx
app/fantasy-football/page.tsx
```

### Main Components

```txt
components/PlayerSorter.tsx
components/FootballPlayerSorter.tsx
components/FantasyFootballDashboard.tsx
```

### Data

```txt
lib/data/sorter-players.ts
lib/data/fantasy-draft.ts
lib/data/fantasy-football.ts
lib/data/fantasy-movement.ts
lib/data/fantasy-projections.ts
```

## Common Edits

### Rename Home Page Links

Edit:

```txt
app/page.tsx
```

The home page cards are normal Next.js `Link` components.

### Show Or Hide The Fantasy Football Link

Edit:

```txt
app/page.tsx
```

To show fantasy football again, add a `Link` to:

```txt
/fantasy-football
```

The page and component still exist.

### Change MLB Categories

Edit:

```txt
components/PlayerSorter.tsx
```

Look for the `categories` array.

### Change NFL Categories

Edit:

```txt
components/FootballPlayerSorter.tsx
```

Look for the `categories` array.

### Change NFL Depth Chart Counts

Edit:

```txt
components/FootballPlayerSorter.tsx
```

Look for:

```ts
const depthChartSlotsByPosition = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1
};

const depthChartPoolTargets = {
  QB: 32,
  RB: 64,
  WR: 64,
  TE: 32
};
```

### Change MLB All Players Pool Size

Edit:

```txt
components/PlayerSorter.tsx
```

Look for:

```ts
const allPlayersPoolSize = 200;
const allPlayersRankingSize = 100;
```

## Publishing

The Git remote is:

```txt
https://github.com/yungrtrd/MLBRank1.git
```

The usual publish flow is:

```bash
npm run build
git status
git add app components lib README.md package.json package-lock.json
git commit -m "Describe the change"
git push origin main
```

During the last publish attempt, the local commit succeeded but pushing required GitHub authentication. If push fails with a username/authentication error, sign into GitHub through GitHub Desktop or configure Git credentials, then run:

```bash
git push origin main
```

## Notes About `.next`

The `.next` directory is generated by Next.js. It should not be edited manually or committed.

If local development gets stuck because of a bad Next cache, stop the dev server, remove or rename `.next`, and run:

```bash
npm run dev
```

## Current Status

The visible site currently has:

- home page with `MLB Ranking` and `NFL Ranking`
- MLB ranking sorter with CSV save
- NFL ranking sorter with CSV save
- fantasy football dashboard still available directly but hidden from home

Before handing off changes, the project has been checked with:

```bash
npm run typecheck
npm run build
```
