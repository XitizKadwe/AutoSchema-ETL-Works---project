const IDENTIFIER_COLUMN = /(^|_)(id|code|phone|mobile|zip|postal|pincode|pin|account|number)($|_)/i;
const MIN_NUMERIC_VALUES = 2;
const MIN_NUMERIC_RATIO = 0.8;

export function parseNumeric(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const normalized = String(value)
    .trim()
    .replace(/[₹$€£,]/g, "")
    .replace(/^\((.*)\)$/, "-$1");
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function getNumericColumns(rows, columns) {
  return columns.filter((column) => {
    if (IDENTIFIER_COLUMN.test(column)) return false;
    let populatedCount = 0;
    let numericCount = 0;
    for (const row of rows) {
      const value = row.data?.[column];
      if (value === null || value === undefined || String(value).trim() === "") continue;
      populatedCount += 1;
      if (parseNumeric(value) !== null) numericCount += 1;
    }
    return (
      numericCount >= MIN_NUMERIC_VALUES &&
      numericCount / populatedCount >= MIN_NUMERIC_RATIO
    );
  });
}

export function filterRows(rows, columns, filters, numericColumns) {
  const search = (filters._search || "").trim().toLowerCase();
  return rows.filter((row) => {
    if (
      search &&
      ![row.reason, ...Object.values(row.data || {}), ...(row.issues || [])]
        .join(" ")
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }

    return columns.every((column) => {
      const value = row.data?.[column];
      const filter = filters[column] || {};
      if (numericColumns.includes(column)) {
        if (filter.min !== undefined && filter.min !== "") {
          const number = parseNumeric(value);
          if (number === null || number < Number(filter.min)) return false;
        }
        if (filter.max !== undefined && filter.max !== "") {
          const number = parseNumeric(value);
          if (number === null || number > Number(filter.max)) return false;
        }
        return true;
      }

      if (filter.value === "__EMPTY__") return value === null || value === undefined || value === "";
      if (filter.value !== undefined && filter.value !== "" && value !== filter.value) return false;
      if (
        filter.text &&
        !String(value ?? "").toLowerCase().includes(filter.text.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  });
}

export function getNumericSummary(rows, column) {
  let count = 0;
  let sum = 0;
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const row of rows) {
    const value = parseNumeric(row.data?.[column]);
    if (value === null) continue;
    count += 1;
    sum += value;
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  if (!count) return null;
  return {
    count,
    sum,
    minimum,
    maximum,
    average: sum / count,
  };
}
