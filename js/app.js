// UI wiring: DOM state, event listeners, CSV handling, and the
// preview/generate actions. Depends on everything else (country-codes.js,
// csv.js, layout.js, fonts.js, pdf.js), all loaded before this file.

const UI_TEXT = {
  en: { language:"Language", appTitle:"Saru's Sticker Generator", subtitle:"Upload a CSV of Coffee Lots. Choose your Sticker type and sticker away!", chooseCsv:"Click to choose a CSV file", orDrag:"or drag it here", csvOnly:".csv only", editLots:"Edit / Add Lots Manually", output:"Output", a4Sheet:"A4 Sheet", thermalLabel:"Thermal Label", font:"Font", manualFontSize:"Manual font size", titleSize:"Title size (pt)", bodySize:"Body size (pt)", labelSize:"Label size", customSize:"Custom size", stickerWidth:"Sticker width (mm)", stickerHeight:"Sticker height (mm)", gapX:"Gap X (mm)", gapY:"Gap Y (mm)", copiesPerLot:"Copies per lot", reuseSheet:"Reuse a partially-used sheet (mark which stickers are already gone)", chooseStickers:"Choose Available Stickers", generatePdf:"Generate PDF", previewPdf:"Preview PDF", editLotsHelp:"Add, edit, or remove lots by hand - changes apply immediately.", addLot:"+ Add lot", done:"Done", pickerHelp:"Click a sticker to mark it already used (skipped) or still available.", markAllUsed:"Mark all used", markAllAvailable:"Mark all available", recognizedColumns:"Recognized columns", columnHelp:"Case-insensitive, any order; missing/blank fields are skipped per sticker.",
    code:"Code", name:"Name", country:"Country", region:"Region", variety:"Variety", processing:"Processing", producer:"Producer", altitude:"Altitude", lot:"Lot", quantity:"Quantity", remove:"Remove", decrease:"Decrease quantity", increase:"Increase quantity", recognizedField:"Recognized field", csvColumn:"CSV column", ignoredColumns:"Ignored columns (no match): ", parsing:"Parsing", csvParseError:"CSV parse error: ", csvNoHeader:"CSV has no header row.", csvNoRows:"CSV has no data rows.", readError:"Failed to read file: ", addLotToGenerate:"Add at least one lot (via CSV or Edit Lots) to generate stickers.", setQuantity:"Set a quantity greater than 0 for at least one lot.", sizeTooLarge:"Sticker size (with gaps) is too large to fit on an A4 page — reduce the width/height or gaps.", previewGenerated:"Preview generated.", previewError:"Error generating preview: ", pdfSaved:"PDF saved.", pdfSavedOverflow:"PDF saved — but {n} lot(s) had text cut off, see warning above.", pdfError:"Error generating PDF: ",
  },
  ja: { language:"言語", appTitle:"Saru's Sticker Generator", subtitle:"コーヒーロットのCSVをアップロードし、ステッカーの種類を選んで作成しましょう。", chooseCsv:"クリックしてCSVファイルを選択", orDrag:"またはここにドラッグ", csvOnly:"CSVファイルのみ", editLots:"ロットを手動で編集・追加", output:"出力形式", a4Sheet:"A4シート", thermalLabel:"感熱ラベル", font:"フォント", manualFontSize:"フォントサイズを手動で指定", titleSize:"タイトルサイズ (pt)", bodySize:"本文サイズ (pt)", labelSize:"ラベルサイズ", customSize:"カスタムサイズ", stickerWidth:"ステッカー幅 (mm)", stickerHeight:"ステッカー高さ (mm)", gapX:"横の間隔 (mm)", gapY:"縦の間隔 (mm)", copiesPerLot:"ロットごとの印刷枚数", reuseSheet:"使用済みの位置を指定して、使いかけのシートを再利用", chooseStickers:"使用可能なステッカーを選択", generatePdf:"PDFを作成", previewPdf:"PDFをプレビュー", editLotsHelp:"ロットを手動で追加・編集・削除できます。変更はすぐに反映されます。", addLot:"+ ロットを追加", done:"完了", pickerHelp:"ステッカーをクリックして、使用済み（スキップ）または使用可能に切り替えます。", markAllUsed:"すべて使用済みにする", markAllAvailable:"すべて使用可能にする", recognizedColumns:"認識された列", columnHelp:"大文字・小文字や列の順番は問いません。空欄の項目はステッカーごとに省略されます。", code:"コード", name:"名前", country:"国", region:"地域", variety:"品種", processing:"精製方法", producer:"生産者", altitude:"標高", lot:"ロット", quantity:"枚数", remove:"削除", decrease:"枚数を減らす", increase:"枚数を増やす", recognizedField:"認識した項目", csvColumn:"CSV列", ignoredColumns:"一致しないため無視した列：", parsing:"読み込み中：", csvParseError:"CSV解析エラー：", csvNoHeader:"CSVにヘッダー行がありません。", csvNoRows:"CSVにデータ行がありません。", readError:"ファイルを読み込めませんでした：", addLotToGenerate:"ステッカーを作成するには、CSVを読み込むかロットを追加してください。", setQuantity:"いずれかのロットの枚数を1以上にしてください。", sizeTooLarge:"ステッカーが大きすぎてA4に収まりません。幅・高さまたは間隔を小さくしてください。", previewGenerated:"プレビューを作成しました。", previewError:"プレビュー作成エラー：", pdfSaved:"PDFを保存しました。", pdfSavedOverflow:"PDFを保存しました。ただし{n}件のロットで文字が切れています。上の警告をご確認ください。", pdfError:"PDF作成エラー："
  }
};
Object.assign(UI_TEXT.en, { editLotsTitle:"Edit Lots", loaded:"Loaded", lotsSuffix:" lot(s) → ", labelsTotal:" label(s) total.", stickersSuffix:" sticker(s) across ", pagesSuffix:" page(s)", gridSuffix:" grid, ", perPageSuffix:" per page", usedOnSheetSuffix:" already used on sheet 1", lotFallback:"(unlabeled row)" });
Object.assign(UI_TEXT.ja, { editLotsTitle:"ロットを編集", loaded:"読み込み完了：", lotsSuffix:"件のロット → ", labelsTotal:"枚のラベル", stickersSuffix:"枚のステッカー、全", pagesSuffix:"ページ", gridSuffix:"グリッド、", perPageSuffix:"枚/ページ", usedOnSheetSuffix:"枚使用済み（1枚目）", lotFallback:"（名前なし）" });
let uiLanguage = localStorage.getItem("stickerUiLanguage") === "ja" ? "ja" : "en";
function tr(key) { return (UI_TEXT[uiLanguage] && UI_TEXT[uiLanguage][key]) || UI_TEXT.en[key] || key; }
function applyLanguage() {
  document.documentElement.lang = uiLanguage;
  document.title = tr("appTitle");
  document.getElementById("languageToggle").setAttribute("aria-label", tr("language"));
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = tr(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = tr(el.dataset.i18nTitle); });
  document.getElementById("languageToggle").setAttribute("aria-checked", String(uiLanguage === "ja"));
  renderQuantityTable();
  if (parsedRows) renderLotModalTable();
  if (parsedRows) runFitCheck();
}
document.getElementById("languageToggle").addEventListener("click", () => {
  uiLanguage = uiLanguage === "en" ? "ja" : "en";
  localStorage.setItem("stickerUiLanguage", uiLanguage);
  applyLanguage();
});

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
let cellPickerRatio = 1; // current sticker width/height, so picker cells look like the real stickers

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
      const label = r.code || r.name || tr("lotFallback");
      return `<li><strong>${escapeHtml(label)}</strong> — cut off at: "${escapeHtml(r.cutText)}"</li>`;
    })
    .join("");
  warningsEl.innerHTML =
    `<strong>${uiLanguage === "ja" ? `${overflowing.length}件のロットが設定したフォントサイズに収まりません。一部の文字が切れる可能性があります：` : `${overflowing.length} lot(s) won't fully fit at this font/size — some text may be cut off:`}</strong>` +
    `<ul>${items}</ul>` +
    (uiLanguage === "ja" ? "フォントサイズを小さくするか、作成前にプレビューをご確認ください。" : "Try a smaller font size, or use Preview to check before generating.");
  warningsEl.className = "warn";
}

async function runFitCheck() {
  if (!parsedRows) return;
  const options = getOptions();

  if (parsedRows.length === 0) {
    generateBtn.disabled = true;
    previewBtn.disabled = true;
    setStatus(tr("addLotToGenerate"), "error");
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
        ? `${tr("loaded")} ${parsedRows.length}${tr("lotsSuffix")}${totalLabels}${tr("labelsTotal")}`
        : tr("setQuantity"),
      totalLabels > 0 ? "ok" : "error"
    );
    renderFitWarnings(await checkFitLabel(parsedRows, options));
    return;
  }

  const grid = gridFromOptions(options);
  if (grid.cols < 1 || grid.rows < 1) {
    setStatus(tr("sizeTooLarge"), "error");
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
      ? `${tr("loaded")} ${parsedRows.length}${tr("lotsSuffix")}${totalStickers}${tr("stickersSuffix")}` +
        `${totalPages}${tr("pagesSuffix")} (${grid.cols}×${grid.rows}${tr("gridSuffix")}${perPage}${tr("perPageSuffix")}` +
        (usedOnFirstPage > 0 ? `, ${usedOnFirstPage}${tr("usedOnSheetSuffix")}` : "") + ")."
      : tr("setQuantity"),
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
  let html = `<table><tr><th>${tr("lot")}</th><th>${tr("quantity")}</th></tr>`;
  parsedRows.forEach((row, idx) => {
    const code = cleanField(row.code);
    const name = cleanField(row.name);
    const label = escapeHtml(code || name || `Row ${idx + 1}`);
    html += `<tr><td>${label}</td><td>
      <div class="qtyStepper">
        <button type="button" class="qtyBtn" data-action="dec" data-idx="${idx}" aria-label="${tr("decrease")}">-</button>
        <input type="number" class="qtyInput" data-idx="${idx}" min="0" step="1" value="${quantities[idx] ?? 1}">
        <button type="button" class="qtyBtn" data-action="inc" data-idx="${idx}" aria-label="${tr("increase")}">+</button>
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
// mode only), shown in its own popup so the grid of stickers - which can
// get large for small sticker sizes - doesn't crowd the main page. Keeps
// usedCells sized to the current grid, resetting it (not preserving stale
// picks) whenever the grid's cols/rows actually change - a saved pattern
// from a 3x7 grid wouldn't make sense mapped onto a 2x4 one.
function reuseEnabled() {
  return document.getElementById("reusePartialSheet").checked;
}

function renderCellPickerGrid() {
  const grid = document.getElementById("cellPickerGrid");
  grid.style.gridTemplateColumns = `repeat(${cellPickerCols}, 1fr)`;
  grid.style.setProperty("--sticker-ratio", cellPickerRatio);
  let html = "";
  usedCells.forEach((used, i) => {
    html += `<div class="pickerCell${used ? " used" : ""}" data-idx="${i}">${i + 1}</div>`;
  });
  grid.innerHTML = html;
}

function syncCellPicker() {
  if (!reuseEnabled()) return;
  const options = getOptions();
  const grid = gridFromOptions(options);
  if (grid.cols < 1 || grid.rows < 1) return;
  cellPickerRatio = options.stickerWidthMm / options.stickerHeightMm;
  if (grid.cols !== cellPickerCols || grid.rows !== cellPickerRows) {
    cellPickerCols = grid.cols;
    cellPickerRows = grid.rows;
    usedCells = new Array(grid.cols * grid.rows).fill(false);
  }
}

const cellPickerModalOverlay = document.getElementById("cellPickerModalOverlay");

function openCellPickerModal() {
  syncCellPicker();
  renderCellPickerGrid();
  cellPickerModalOverlay.style.display = "flex";
}

function closeCellPickerModal() {
  cellPickerModalOverlay.style.display = "none";
  runFitCheck();
}

document.getElementById("reusePartialSheet").addEventListener("change", (e) => {
  document.getElementById("cellPickerToggleWrap").style.display = e.target.checked ? "" : "none";
  if (e.target.checked) openCellPickerModal();
  runFitCheck();
});

document.getElementById("openCellPickerBtn").addEventListener("click", openCellPickerModal);
document.getElementById("closeCellPickerModalBtn").addEventListener("click", closeCellPickerModal);
cellPickerModalOverlay.addEventListener("click", (e) => {
  if (e.target === cellPickerModalOverlay) closeCellPickerModal(); // clicked the backdrop, not the box
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
  ["code", "code"], ["name", "name"], ["Country", "country"], ["Region", "region"],
  ["Variety", "variety"], ["Processing", "processing"], ["Producer", "producer"], ["Altitude", "altitude"],
];
const lotModalOverlay = document.getElementById("lotModalOverlay");
const lotModalTable = document.getElementById("lotModalTable");

function renderLotModalTable() {
  let html = "<tr>" + LOT_FIELD_LABELS.map(([, label]) => `<th>${tr(label)}</th>`).join("") + `<th>${tr("remove")}</th></tr>`;
  parsedRows.forEach((row, idx) => {
    html += "<tr>" + LOT_FIELD_LABELS.map(([field]) =>
      `<td><input type="text" class="lotField" data-idx="${idx}" data-field="${field}" value="${escapeAttr(row[field] || "")}"></td>`
    ).join("");
    html += `<td><button type="button" class="removeLotBtn" data-idx="${idx}">${tr("remove")}</button></td></tr>`;
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
applyLanguage();

function handleFile(file) {
  if (!file) return;
  setStatus(tr("parsing") + file.name + "...");
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
        setStatus(tr("csvParseError") + fatalErrors[0].message, "error");
        return;
      }
      const fieldnames = results.meta.fields || [];
      if (!fieldnames.length) {
        setStatus(tr("csvNoHeader"), "error");
        return;
      }
      const columns = matchColumns(fieldnames);
      const rows = results.data;
      if (!rows.length) {
        setStatus(tr("csvNoRows"), "error");
        return;
      }

      parsedRows = rows.map((row) => toCanonicalRow(row, columns));
      quantities = rows.map(() => 1);
      renderQuantityTable();
      runFitCheck();

      const recognized = Object.keys(columns);
      const unrecognized = fieldnames.filter(f => !Object.values(columns).includes(f));
      let html = `<table><tr><th>${tr("recognizedField")}</th><th>${tr("csvColumn")}</th></tr>`;
      const fieldKeys = { code:"code", name:"name", Country:"country", Region:"region", Variety:"variety", Processing:"processing", Producer:"producer", Altitude:"altitude" };
      recognized.forEach(k => { html += `<tr><td>${tr(fieldKeys[k] || k)}</td><td>${columns[k]}</td></tr>`; });
      html += "</table>";
      if (unrecognized.length) {
        html += `<p style="font-size:0.85rem;color:#fcd34d;margin-top:0.5rem;">${tr("ignoredColumns")}${unrecognized.join(", ")}</p>`;
      }
      previewEl.innerHTML = html;
    },
    error: (err) => {
      setStatus(tr("readError") + err.message, "error");
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
    setStatus(tr("previewGenerated"), "ok");
  } catch (err) {
    setStatus(tr("previewError") + err.message, "error");
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
        ? tr("pdfSavedOverflow").replace("{n}", overflowReport.length)
        : tr("pdfSaved"),
      overflowReport.length ? "error" : "ok"
    );
  } catch (err) {
    setStatus(tr("pdfError") + err.message, "error");
  }
});
