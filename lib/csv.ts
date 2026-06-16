export type CsvRow = Record<string, string>;

export function parseCsv(content: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      current = "";
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return rows;
}

export function normalizeHeader(header: string) {
  return header.trim().toLowerCase();
}

export function toRows(content: string): CsvRow[] {
  const parsed = parseCsv(content);
  const headers = parsed[0]?.map(normalizeHeader) ?? [];

  return parsed.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]))
  );
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function firstValue(row: CsvRow, candidates: string[]) {
  for (const candidate of candidates) {
    const value = row[normalizeHeader(candidate)];
    if (value) {
      return value;
    }
  }
  return "";
}

export function toNumber(value: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}
