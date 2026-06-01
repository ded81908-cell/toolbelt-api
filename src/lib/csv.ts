/**
 * Tiny, dependency-free CSV <-> JSON conversion that handles the common cases:
 * quoted fields, embedded commas, embedded quotes ("" escaping) and newlines.
 * Good enough for an API utility endpoint without pulling in a heavy parser.
 */

export function csvToJson(csv: string, delimiter = ","): Record<string, string>[] {
  const rows = parseCsv(csv, delimiter);
  if (rows.length === 0) return [];
  const headers = rows[0];
  const out: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip fully empty trailing rows.
    if (row.length === 1 && row[0] === "") continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] ?? "";
    });
    out.push(obj);
  }
  return out;
}

export function jsonToCsv(data: unknown, delimiter = ","): string {
  if (!Array.isArray(data)) {
    throw new Error("jsonToCsv expects an array of objects");
  }
  if (data.length === 0) return "";
  const headerSet = new Set<string>();
  for (const item of data) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      for (const key of Object.keys(item)) headerSet.add(key);
    } else {
      throw new Error("jsonToCsv expects an array of plain objects");
    }
  }
  const headers = [...headerSet];
  const lines = [headers.map((h) => escapeField(h, delimiter)).join(delimiter)];
  for (const item of data as Record<string, unknown>[]) {
    const line = headers
      .map((h) => escapeField(formatValue(item[h]), delimiter))
      .join(delimiter);
    lines.push(line);
  }
  return lines.join("\n");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeField(field: string, delimiter: string): string {
  if (field.includes('"') || field.includes(delimiter) || /[\n\r]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function parseCsv(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  // Flush the final field/row if there is trailing content.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
