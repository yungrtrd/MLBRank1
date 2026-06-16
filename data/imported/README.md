Place imported data artifacts here.

Supported workflow:

1. Export a batting-season CSV from Stathead.
2. Run:
   `npm run import:stathead-batting -- /absolute/path/to/your-export.csv`
3. The importer writes `stathead-batting-seasons.json` into this folder.
4. The app automatically uses imported player/season rows ahead of the small demo dataset.

Supported split workflow:

1. Export a split CSV from Stathead for one specific situation.
2. Run, for example:
   `npm run import:stathead-splits -- /absolute/path/to/your-split-export.csv --inning-min 7 --max-run-margin 2 --label "After the 7th inning, within 2 runs"`
3. The importer writes or appends to `stathead-batting-situations.json`.
4. The app automatically uses imported split rows ahead of the demo split sample.
