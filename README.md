# Baseball Compare Lab

A greenfield Next.js app for deep, shareable MLB player comparisons using public advanced stats.

## What is included

- Interactive compare workspace for 2-6 players
- Year-by-year and career comparison modes
- Situational split filters for inning and score-margin comparisons
- Role-aware hitter and pitcher metric catalog
- Shareable query-string URL state
- API routes for search, metrics, player summaries, and comparisons
- Public-data ingest scaffold and PostgreSQL schema starter
- Stathead batting-season CSV import workflow that overrides the demo sample
- Stathead split CSV import workflow for situational comparisons

## Project structure

- `app/` App Router pages and API routes
- `components/` UI primitives for compare workflows
- `lib/` shared types, sample data, metric catalog, repository helpers, and compare engine
- `db/schema.sql` starter PostgreSQL schema
- `scripts/ingest-public-data.ts` daily ingest scaffold
- `tests/compare.test.ts` comparison engine tests

## Next steps

1. Install dependencies in an environment with Node.js 20+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Replace sample data in `lib/data/` with a real ingest pipeline backed by PostgreSQL.

## Import Stathead batting seasons

1. Export a batting-season CSV from Stathead.
2. Run:
   `npm run import:stathead-batting -- /absolute/path/to/your-export.csv`
3. The importer writes:
   `data/imported/stathead-batting-seasons.json`
4. Restart or refresh the app. Imported batting-season rows are preferred over the built-in demo sample.

## Import Stathead situational splits

Export one split query per situation, then import it with explicit situation flags so the app knows how to match it.

Example:

`npm run import:stathead-splits -- /absolute/path/to/your-split-export.csv --inning-min 7 --max-run-margin 2 --label "After the 7th inning, within 2 runs"`

You can also use:

- `--inning-max 9`
- `--max-run-margin 1`
- omit `--label` and the importer will generate one from the flags

Imported split rows are stored in:

`data/imported/stathead-batting-situations.json`

Each new import appends/merges into that file, so you can build up multiple saved situations over time.

## Current hybrid data model

- Demo data still ships for instant local startup.
- Imported Stathead batting-season CSV data is loaded automatically when present.
- Imported Stathead split CSV data is loaded automatically when present.
- PostgreSQL schema remains available in `db/schema.sql` for a later full database-backed migration.
