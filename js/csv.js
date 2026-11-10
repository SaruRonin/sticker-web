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

// Canonical per-lot fields, in sticker order. "code"/"name" render as the
// bold title lines; the rest render as "Label: value" body lines. Every
// row the app works with - from CSV or typed in manually - has exactly
// these keys (emptyLot), so nothing downstream needs a CSV-column mapping.
const TITLE_FIELDS = ["code", "name"];
const PROPERTY_FIELDS = ["Country", "Region", "Variety", "Processing", "Producer", "Altitude"];
const ALL_FIELDS = [...TITLE_FIELDS, ...PROPERTY_FIELDS];

function emptyLot() {
  const lot = {};
  ALL_FIELDS.forEach((field) => { lot[field] = ""; });
  return lot;
}

// Converts one raw CSV row into a canonical lot object using the column
// mapping matchColumns resolved, cleaning each value as it's pulled out.
function toCanonicalRow(row, columns) {
  const lot = emptyLot();
  ALL_FIELDS.forEach((field) => {
    const sourceKey = columns[field];
    lot[field] = sourceKey ? cleanField(row[sourceKey]) : "";
  });
  return lot;
}

// Drops a trailing unit/qualifier in parentheses, e.g. "Altitude (masl)" ->
// "altitude", "Altitude (m)" -> "altitude", so headers that include units
// still match the plain alias.
function stripParenthetical(header) {
  return header.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function matchColumns(fieldnames) {
  const lowerMap = {};
  const strippedMap = {};
  fieldnames.forEach(fn => {
    const lower = fn.trim().toLowerCase();
    lowerMap[lower] = fn;
    const stripped = stripParenthetical(lower);
    if (stripped !== lower) strippedMap[stripped] = fn;
  });
  const resolved = {};
  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (alias in lowerMap) { resolved[key] = lowerMap[alias]; break; }
      if (alias in strippedMap) { resolved[key] = strippedMap[alias]; break; }
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

// row is a canonical lot object (see emptyLot/toCanonicalRow) - every field
// is read straight off it, no CSV column mapping needed.
function buildLines(row, titleSize, bodySize) {
  const lines = [];
  const code = cleanField(row.code);
  const name = cleanField(row.name);
  if (code) lines.push({ text: code, bold: true, size: titleSize });
  if (name) lines.push({ text: name, bold: true, size: titleSize });

  for (const label of PROPERTY_FIELDS) {
    let value = cleanField(row[label]);
    if (label === "Country") {
      value = value ? resolveCountry(value) : countryFromCode(code);
    }
    if (!value) continue;
    lines.push({ text: `${label}: ${value}`, bold: false, size: bodySize });
  }
  return lines;
}
