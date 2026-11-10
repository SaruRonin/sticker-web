// CSV column matching and per-lot text content. Depends on COUNTRY_CODES
// (js/country-codes.js), loaded before this file.

const FIELD_ALIASES = {
  code: ["code", "id", "lot", "lot code", "lot id", "sku"],
  name: ["name", "lot name", "title"],
  Country: ["country", "origin"],
  Region: ["region"],
  Variety: ["variety", "varieties"],
  Processing: ["processing", "process"],
  Producer: ["producer", "farmer", "grower", "farm name", "farm"],
  Altitude: ["altitude", "elevation"],
};

function matchColumns(fieldnames) {
  const lowerMap = {};
  fieldnames.forEach(fn => { lowerMap[fn.trim().toLowerCase()] = fn; });
  const resolved = {};
  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (alias in lowerMap) { resolved[key] = lowerMap[alias]; break; }
    }
  }
  return resolved;
}

// Treats a value as "blank" if it has no letters or digits at all, e.g. "-",
// "--", "—", "n/a"-style punctuation-only placeholders some CSVs use for
// empty cells.
function hasContent(value) {
  return /[\p{L}\p{N}]/u.test(value);
}

function cleanField(raw) {
  const value = (raw || "").trim();
  return hasContent(value) ? value : "";
}

function resolveCountry(value) {
  const code = value.trim().toUpperCase();
  return COUNTRY_CODES[code] || value;
}

// Fallback: derive the country from the letters before the first dash in
// the lot Code (e.g. "BI" in "BI-2026-201"), used only when there's no
// explicit, non-blank Country value for that row.
function countryFromCode(code) {
  const prefix = code.split("-")[0].trim().toUpperCase();
  return COUNTRY_CODES[prefix] || "";
}

function buildLines(row, columns, titleSize, bodySize) {
  const lines = [];
  const code = columns.code ? cleanField(row[columns.code]) : "";
  const name = columns.name ? cleanField(row[columns.name]) : "";
  if (code) lines.push({ text: code, bold: true, size: titleSize });
  if (name) lines.push({ text: name, bold: true, size: titleSize });

  for (const label of ["Country", "Region", "Variety", "Processing", "Producer", "Altitude"]) {
    let value = columns[label] ? cleanField(row[columns[label]]) : "";
    if (label === "Country") {
      value = value ? resolveCountry(value) : countryFromCode(code);
    }
    if (!value) continue;
    lines.push({ text: `${label}: ${value}`, bold: false, size: bodySize });
  }
  return lines;
}
