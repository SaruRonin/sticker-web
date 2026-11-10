// UI wiring: DOM state, event listeners, CSV handling, and the
// preview/generate actions. Depends on everything else (country-codes.js,
// csv.js, layout.js, fonts.js, pdf.js), all loaded before this file.

const dropEl = document.getElementById("drop");
const fileInput = document.getElementById("fileInput");
const generateBtn = document.getElementById("generateBtn");
const previewBtn = document.getElementById("previewBtn");
const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const warningsEl = document.getElementById("warnings");
const previewContainer = document.getElementById("previewContainer");
const previewFrame = document.getElementById("previewFrame");

let parsedRows = null; // array of canonical lot objects (see emptyLot/toCanonicalRow), from CSV or the Edit Lots modal
let quantities = []; // copies to print for each row, parallel to parsedRows (both output modes)
let outputModeValue = "sheet"; // set by the Output toggle buttons, see setOutputMode

// Sheet mode only: lets a partially-used physical sheet be reused by
// marking which of its grid cells are already gone, so the first page's
// sequence skips those positions instead of printing over blank stickers
// that aren't actually there. usedCells[i] true = already used/skip.
let usedCells = [];
let cellPickerCols = 0;
let cellPickerRows = 0;

function currentMode() {
  return outputModeValue;
}

function setStatus(msg, kind) {
  statusEl.textContent = msg;
  statusEl.className = kind || "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// escapeHtml doesn't escape '"', since that's only unsafe inside an
// attribute value (text-node serialization has no reason to escape it).
// Use this instead when interpolating into value="...".
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

function getOptions() {
  return {
    fontFamily: document.getElementById("fontFamily").value,
    titleSize: parseFloat(document.getElementById("titleSize").value) || 12,
    bodySize: parseFloat(document.getElementById("bodySize").value) || 9,
    stickerWidthMm: parseFloat(document.getElementById("stickerWidth").value) || 70,
    stickerHeightMm: parseFloat(document.getElementById("stickerHeight").value) || 42.3,
    gapXMm: parseFloat(document.getElementById("gapX").value) || 0,
    gapYMm: parseFloat(document.getElementById("gapY").value) || 0,
    manualFontSize: document.getElementById("manualFontSize").checked,
  };
}

function renderFitWarnings(report) {
  const overflowing = report.filter((r) => r.overflow);
  if (!overflowing.length) {
    warningsEl.innerHTML = "";
    warningsEl.className = "";
    return;
  }
  const items = overflowing
    .map((r) => {
      const label = r.code || r.name || "(unlabeled row)";
      return `<li><strong>${escapeHtml(label)}</strong> — cut off at: "${escapeHtml(r.cutText)}"</li>`;
    })
    .join("");
  warningsEl.innerHTML =
    `<strong>${overflowing.length} lot(s) won't fully fit</strong> at this font/size — some text will be cut off:` +
    `<ul>${items}</ul>` +
    `Try a smaller font size, or use Preview to check before generating.`;
  warningsEl.className = "warn";
}

async function runFitCheck() {
  if (!parsedRows) return;
  const options = getOptions();

  if (parsedRows.length === 0) {
    generateBtn.disabled = true;
    previewBtn.disabled = true;
    setStatus("Add at least one lot (via CSV or Edit Lots) to generate stickers.", "error");
    warningsEl.innerHTML = "";
    warningsEl.className = "";
    return;
  }

  if (currentMode() === "label") {
    const totalLabels = quantities.reduce((sum, q) => sum + (q || 0), 0);
    generateBtn.disabled = totalLabels <= 0;
    previewBtn.disabled = totalLabels <= 0;
    setStatus(
      totalLabels > 0
        ? `Loaded ${parsedRows.length} lot(s) → ${totalLabels} label(s) total.`
        : "Set a quantity greater than 0 for at least one lot.",
      totalLabels > 0 ? "ok" : "error"
    );
    renderFitWarnings(await checkFitLabel(parsedRows, options));
    return;
  }

  const grid = gridFromOptions(options);
  if (grid.cols < 1 || grid.rows < 1) {
    setStatus("Sticker size (with gaps) is too large to fit on an A4 page — reduce the width/height or gaps.", "error");
    generateBtn.disabled = true;
    previewBtn.disabled = true;
    warningsEl.innerHTML = "";
    warningsEl.className = "";
    return;
  }
  syncCellPicker();
  const perPage = grid.cols * grid.rows;
  const totalStickers = quantities.reduce((sum, q) => sum + (q || 0), 0);
  const usedOnFirstPage = reuseEnabled() ? usedCells.filter(Boolean).length : 0;
  const totalPages = computeSheetPages(totalStickers, perPage, usedOnFirstPage);
  generateBtn.disabled = totalStickers <= 0;
  previewBtn.disabled = totalStickers <= 0;
  setStatus(
    totalStickers > 0
      ? `Loaded ${parsedRows.length} lot(s) → ${totalStickers} sticker(s) across ` +
        `${totalPages} page(s) (${grid.cols}×${grid.rows} grid, ${perPage} per page` +
        (usedOnFirstPage > 0 ? `, ${usedOnFirstPage} already used on sheet 1` : "") + ")."
      : "Set a quantity greater than 0 for at least one lot.",
    totalStickers > 0 ? "ok" : "error"
  );
  renderFitWarnings(await checkFit(parsedRows, options));
}

["fontFamily", "titleSize", "bodySize", "stickerWidth", "stickerHeight", "gapX", "gapY"].forEach((id) => {
  document.getElementById(id).addEventListener("input", runFitCheck);
});

// Applying a named preset fills in and locks the size/gap fields so they
// can't drift from the standard; "Custom size" unlocks them for editing.
function applyLabelPreset(presetId) {
  const widthEl = document.getElementById("stickerWidth");
  const heightEl = document.getElementById("stickerHeight");
  const gapXEl = document.getElementById("gapX");
  const gapYEl = document.getElementById("gapY");
  const preset = LABEL_PRESETS[presetId];

  [widthEl, heightEl, gapXEl, gapYEl].forEach((el) => { el.disabled = !!preset; });
  if (preset) {
    widthEl.value = preset.widthMm;
    heightEl.value = preset.heightMm;
    gapXEl.value = preset.gapXMm;
    gapYEl.value = preset.gapYMm;
  }
  runFitCheck();
}

document.getElementById("labelPreset").addEventListener("change", (e) => applyLabelPreset(e.target.value));

// Renders the per-lot quantity inputs - used by both output modes now:
// label mode prints exactly that many labels per lot, and sheet mode packs
// that many copies of each lot into the shared grid instead of always
// giving every lot a full page. The container div itself is never
// replaced, just its contents, so the single delegated "input" listener
// registered below keeps working across re-renders.
function renderQuantityTable() {
  const section = document.getElementById("quantitySection");
  const container = document.getElementById("quantityTable");
  if (!parsedRows || parsedRows.length === 0) {
    section.style.display = "none";
    container.innerHTML = "";
    return;
  }
  section.style.display = "";
  let html = "<table><tr><th>Lot</th><th>Quantity</th></tr>";
  parsedRows.forEach((row, idx) => {
    const code = cleanField(row.code);
    const name = cleanField(row.name);
    const label = escapeHtml(code || name || `Row ${idx + 1}`);
    html += `<tr><td>${label}</td><td>
      <div class="qtyStepper">
        <button type="button" class="qtyBtn" data-action="dec" data-idx="${idx}" aria-label="Decrease quantity">-</button>
        <input type="number" class="qtyInput" data-idx="${idx}" min="0" step="1" value="${quantities[idx] ?? 1}">
        <button type="button" class="qtyBtn" data-action="inc" data-idx="${idx}" aria-label="Increase quantity">+</button>
      </div>
    </td></tr>`;
  });
  html += "</table>";
  container.innerHTML = html;
}

document.getElementById("quantityTable").addEventListener("click", (e) => {
  const btn = e.target.closest(".qtyBtn");
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx, 10);
  const delta = btn.dataset.action === "inc" ? 1 : -1;
  quantities[idx] = Math.max(0, (quantities[idx] ?? 1) + delta);
  const input = document.querySelector(`#quantityTable .qtyInput[data-idx="${idx}"]`);
  if (input) input.value = quantities[idx];
  runFitCheck();
});

document.getElementById("quantityTable").addEventListener("input", (e) => {
  if (!e.target.classList.contains("qtyInput")) return;
  const idx = parseInt(e.target.dataset.idx, 10);
  quantities[idx] = Math.max(0, parseInt(e.target.value, 10) || 0);
  runFitCheck();
});

// Sticker Saver: the "reuse a partially-used sheet" cell picker (sheet
// mode only). Keeps usedCells sized to the current grid, resetting it
// (not preserving stale picks) whenever the grid's cols/rows actually
// change - a saved pattern from a 3x7 grid wouldn't make sense mapped onto
// a 2x4 one.
function reuseEnabled() {
  return document.getElementById("reusePartialSheet").checked;
}

function renderCellPickerGrid() {
  const grid = document.getElementById("cellPickerGrid");
  grid.style.gridTemplateColumns = `repeat(${cellPickerCols}, 1fr)`;
  let html = "";
  usedCells.forEach((used, i) => {
    html += `<div class="pickerCell${used ? " used" : ""}" data-idx="${i}">${i + 1}</div>`;
  });
  grid.innerHTML = html;
}

function syncCellPicker() {
  if (!reuseEnabled()) return;
  const grid = gridFromOptions(getOptions());
  if (grid.cols < 1 || grid.rows < 1) return;
  if (grid.cols !== cellPickerCols || grid.rows !== cellPickerRows) {
    cellPickerCols = grid.cols;
    cellPickerRows = grid.rows;
    usedCells = new Array(grid.cols * grid.rows).fill(false);
  }
  renderCellPickerGrid();
}

document.getElementById("reusePartialSheet").addEventListener("change", (e) => {
  document.getElementById("cellPickerWrap").style.display = e.target.checked ? "" : "none";
  if (e.target.checked) syncCellPicker();
  runFitCheck();
});

document.getElementById("cellPickerGrid").addEventListener("click", (e) => {
  const cell = e.target.closest(".pickerCell");
  if (!cell) return;
  const idx = parseInt(cell.dataset.idx, 10);
  usedCells[idx] = !usedCells[idx];
  cell.classList.toggle("used", usedCells[idx]);
  runFitCheck();
});

document.getElementById("markAllUsedBtn").addEventListener("click", () => {
  usedCells = usedCells.map(() => true);
  renderCellPickerGrid();
  runFitCheck();
});

document.getElementById("markAllAvailableBtn").addEventListener("click", () => {
  usedCells = usedCells.map(() => false);
  renderCellPickerGrid();
  runFitCheck();
});

// The Edit Lots modal: lets lots be typed in by hand (with no CSV at all)
// or added/edited/removed on top of whatever a CSV loaded. Every lot,
// whatever its origin, is the same canonical shape (see emptyLot in
// csv.js), so the modal and the rest of the app share one data model.
const LOT_FIELD_LABELS = [
  ["code", "Code"], ["name", "Name"], ["Country", "Country"], ["Region", "Region"],
  ["Variety", "Variety"], ["Processing", "Processing"], ["Producer", "Producer"], ["Altitude", "Altitude"],
];
const lotModalOverlay = document.getElementById("lotModalOverlay");
const lotModalTable = document.getElementById("lotModalTable");

function renderLotModalTable() {
  let html = "<tr>" + LOT_FIELD_LABELS.map(([, label]) => `<th>${label}</th>`).join("") + "<th></th></tr>";
  parsedRows.forEach((row, idx) => {
    html += "<tr>" + LOT_FIELD_LABELS.map(([field]) =>
      `<td><input type="text" class="lotField" data-idx="${idx}" data-field="${field}" value="${escapeAttr(row[field] || "")}"></td>`
    ).join("");
    html += `<td><button type="button" class="removeLotBtn" data-idx="${idx}">Remove</button></td></tr>`;
  });
  lotModalTable.innerHTML = html;
}

function openLotModal() {
  if (!parsedRows) {
    parsedRows = [];
    quantities = [];
  }
  renderLotModalTable();
  lotModalOverlay.style.display = "flex";
}

function closeLotModal() {
  lotModalOverlay.style.display = "none";
}

document.getElementById("editLotsBtn").addEventListener("click", openLotModal);
document.getElementById("closeLotModalBtn").addEventListener("click", closeLotModal);
lotModalOverlay.addEventListener("click", (e) => {
  if (e.target === lotModalOverlay) closeLotModal(); // clicked the backdrop, not the box
});

document.getElementById("addLotBtn").addEventListener("click", () => {
  parsedRows.push(emptyLot());
  quantities.push(1);
  renderLotModalTable();
  renderQuantityTable();
  runFitCheck();
});

lotModalTable.addEventListener("input", (e) => {
  if (!e.target.classList.contains("lotField")) return;
  const idx = parseInt(e.target.dataset.idx, 10);
  parsedRows[idx][e.target.dataset.field] = e.target.value;
  renderQuantityTable(); // code/name changes affect the quantity table's row labels
  runFitCheck();
});

lotModalTable.addEventListener("click", (e) => {
  const btn = e.target.closest(".removeLotBtn");
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx, 10);
  parsedRows.splice(idx, 1);
  quantities.splice(idx, 1);
  renderLotModalTable();
  renderQuantityTable();
  runFitCheck();
});

// Shows/hides the sheet-only fields (gap X/Y) and quantity table, filters
// the "Label size" dropdown to presets tagged for this mode, and switches
// to that mode's default preset.
function selectDefaultPresetForMode(mode) {
  const sel = document.getElementById("labelPreset");
  Array.from(sel.options).forEach((opt) => {
    opt.hidden = !!opt.dataset.mode && opt.dataset.mode !== mode;
  });
  const firstMatch = Array.from(sel.options).find((opt) => opt.dataset.mode === mode);
  sel.value = (firstMatch || sel.options[0]).value;
}

// Title/Body size are always relevant for sheet mode, but for label mode
// they only apply when "Manual font size" is checked (otherwise autoFitLayout
// picks the size per lot, so showing fields that don't do anything would be
// confusing).
function updateFontFieldsVisibility() {
  const show = currentMode() === "sheet" || document.getElementById("manualFontSize").checked;
  document.getElementById("titleSizeWrap").style.display = show ? "" : "none";
  document.getElementById("bodySizeWrap").style.display = show ? "" : "none";
}

function setOutputMode(mode) {
  outputModeValue = mode;
  document.querySelectorAll(".modeBtn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  selectDefaultPresetForMode(mode);
  document.querySelectorAll(".sheet-only").forEach((el) => {
    el.style.display = mode === "label" ? "none" : "";
  });
  document.querySelectorAll(".label-only").forEach((el) => {
    el.style.display = mode === "label" ? "" : "none";
  });
  updateFontFieldsVisibility();
  applyLabelPreset(document.getElementById("labelPreset").value); // also runs the fit check
  renderQuantityTable();
}

document.querySelectorAll(".modeBtn").forEach((btn) => {
  btn.addEventListener("click", () => setOutputMode(btn.dataset.mode));
});
document.getElementById("manualFontSize").addEventListener("change", () => {
  updateFontFieldsVisibility();
  runFitCheck();
});
setOutputMode(outputModeValue);

function handleFile(file) {
  if (!file) return;
  setStatus("Parsing " + file.name + "...");
  generateBtn.disabled = true;
  previewBtn.disabled = true;
  previewEl.innerHTML = "";
  warningsEl.innerHTML = "";
  warningsEl.className = "";
  previewContainer.style.display = "none";

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const fatalErrors = (results.errors || []).filter(
        (e) => e.code !== "UndetectableDelimiter"
      );
      if (fatalErrors.length) {
        setStatus("CSV parse error: " + fatalErrors[0].message, "error");
        return;
      }
      const fieldnames = results.meta.fields || [];
      if (!fieldnames.length) {
        setStatus("CSV has no header row.", "error");
        return;
      }
      const columns = matchColumns(fieldnames);
      const rows = results.data;
      if (!rows.length) {
        setStatus("CSV has no data rows.", "error");
        return;
      }

      parsedRows = rows.map((row) => toCanonicalRow(row, columns));
      quantities = rows.map(() => 1);
      renderQuantityTable();
      runFitCheck();

      const recognized = Object.keys(columns);
      const unrecognized = fieldnames.filter(f => !Object.values(columns).includes(f));
      let html = "<table><tr><th>Recognized field</th><th>CSV column</th></tr>";
      recognized.forEach(k => { html += `<tr><td>${k}</td><td>${columns[k]}</td></tr>`; });
      html += "</table>";
      if (unrecognized.length) {
        html += `<p style="font-size:0.85rem;color:#fcd34d;margin-top:0.5rem;">Ignored columns (no match): ${unrecognized.join(", ")}</p>`;
      }
      previewEl.innerHTML = html;
    },
    error: (err) => {
      setStatus("Failed to read file: " + err.message, "error");
    },
  });
}

dropEl.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

["dragenter", "dragover"].forEach(evt =>
  dropEl.addEventListener(evt, (e) => { e.preventDefault(); dropEl.classList.add("dragover"); })
);
["dragleave", "drop"].forEach(evt =>
  dropEl.addEventListener(evt, (e) => { e.preventDefault(); dropEl.classList.remove("dragover"); })
);
dropEl.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

async function buildCurrentDoc() {
  const options = getOptions();
  if (currentMode() === "label") {
    return buildLabelDoc(parsedRows, quantities, options);
  }
  const skipCells = reuseEnabled() ? usedCells : undefined;
  return buildDoc(parsedRows, quantities, options, skipCells);
}

previewBtn.addEventListener("click", async () => {
  if (!parsedRows) return;
  try {
    const { doc, overflowReport } = await buildCurrentDoc();
    renderFitWarnings(overflowReport);
    previewFrame.src = doc.output("bloburl");
    previewContainer.style.display = "block";
    previewContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("Preview generated.", "ok");
  } catch (err) {
    setStatus("Error generating preview: " + err.message, "error");
  }
});

generateBtn.addEventListener("click", async () => {
  if (!parsedRows) return;
  try {
    const { doc, overflowReport } = await buildCurrentDoc();
    renderFitWarnings(overflowReport);
    await savePdf(doc);
    setStatus(
      overflowReport.length
        ? `PDF saved — but ${overflowReport.length} lot(s) had text cut off, see warning above.`
        : "PDF saved.",
      overflowReport.length ? "error" : "ok"
    );
  } catch (err) {
    setStatus("Error generating PDF: " + err.message, "error");
  }
});
