// Document assembly: builds the two output types (A4 sheet grid, thermal
// label pages) and their fit-check equivalents. Depends on layout.js,
// fonts.js and csv.js, all loaded before this file.

const { jsPDF } = window.jspdf;

// Cheap check (no pages created) of whether every lot's content fits in a
// single sticker cell at the given font/size settings.
async function checkFit(rows, options) {
  const { fontFamily, titleSize, bodySize, stickerWidthMm, stickerHeightMm } = options;
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const resolvedFamily = await ensureFont(doc, fontFamily);
  const stickerW = stickerWidthMm * PT_PER_MM;
  const stickerH = stickerHeightMm * PT_PER_MM;

  return rows.map((row) => {
    const code = cleanField(row.code);
    const name = cleanField(row.name);
    const lines = buildLines(row, titleSize, bodySize);
    const { overflow, cutText } = layoutSticker(doc, stickerW, stickerH, lines, resolvedFamily, titleSize);
    return { code, name, overflow, cutText };
  });
}

// Label-mode equivalent of checkFit. With the manual override off, font
// size is auto-fit per lot rather than coming from the title/body size
// fields, so this only reports overflow for lots where even the minimum
// auto-fit size doesn't fit; with it on, it checks the manual size exactly
// like sheet mode does.
async function checkFitLabel(rows, options) {
  const { fontFamily, stickerWidthMm, stickerHeightMm } = options;
  const stickerW = stickerWidthMm * PT_PER_MM;
  const stickerH = stickerHeightMm * PT_PER_MM;
  const doc = new jsPDF({ unit: "pt", format: [stickerW, stickerH], orientation: "portrait" });
  const resolvedFamily = await ensureFont(doc, fontFamily);

  return rows.map((row) => {
    const code = cleanField(row.code);
    const name = cleanField(row.name);
    const { overflow, cutText } = labelLayoutFor(doc, stickerW, stickerH, row, resolvedFamily, options);
    return { code, name, overflow, cutText };
  });
}

async function savePdf(doc) {
  if ("showSaveFilePicker" in window) {
    let handle;
    try {
      handle = await window.showSaveFilePicker({
        suggestedName: "stickers.pdf",
        types: [{ description: "PDF file", accept: { "application/pdf": [".pdf"] } }],
      });
    } catch (err) {
      if (err.name === "AbortError") return; // user cancelled the dialog
      throw err;
    }
    const writable = await handle.createWritable();
    await writable.write(doc.output("blob"));
    await writable.close();
  } else {
    // Fallback for browsers without the File System Access API (e.g. Firefox, Safari)
    doc.save("stickers.pdf");
  }
}

// Given how many stickers need printing, how many fit per page, and how
// many of the first page's cells are already used (skipped, for reusing a
// partially-used physical sheet), returns how many pages the sequence will
// span. Used by runFitCheck to predict the page count before building the
// actual PDF; buildDoc's own loop below must stay consistent with this.
function computeSheetPages(totalStickers, perPage, usedOnFirstPage) {
  if (totalStickers <= 0) return 0;
  const availableOnFirstPage = Math.max(0, perPage - usedOnFirstPage);
  if (totalStickers <= availableOnFirstPage) return 1;
  return 1 + Math.ceil((totalStickers - availableOnFirstPage) / perPage);
}

// Builds the full PDF and returns it along with a report of any lots whose
// content didn't fully fit in their sticker cell. Each lot contributes
// `quantities[i]` copies (not a full page each) to one continuous sequence
// of stickers, which fills the grid left-to-right/top-to-bottom and only
// starts a new page once the current one's cells are full - so a handful
// of 2-3-copy lots can share a single sheet instead of each claiming a
// whole page of 21.
//
// skipCells (optional): a boolean array, one per grid cell, marking cells
// on the FIRST page only that are already used on the physical sheet (e.g.
// stickers already peeled from a previous print run) and so should stay
// blank instead of receiving the next sticker in the sequence. Every page
// after the first always uses every cell, since those are fresh sheets.
async function buildDoc(rows, quantities, options, skipCells) {
  const { fontFamily, titleSize, bodySize, stickerWidthMm, stickerHeightMm, gapXMm, gapYMm } = options;
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const resolvedFamily = await ensureFont(doc, fontFamily);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const stickerW = stickerWidthMm * PT_PER_MM;
  const stickerH = stickerHeightMm * PT_PER_MM;
  const gapX = gapXMm * PT_PER_MM;
  const gapY = gapYMm * PT_PER_MM;
  const { cols, rows: gridRows, marginX, marginY } = computeGrid(stickerW, stickerH, gapX, gapY, pageW, pageH);
  if (cols < 1 || gridRows < 1) {
    throw new Error(`Sticker size ${stickerWidthMm}×${stickerHeightMm}mm (with gaps) is too large to fit on an A4 page.`);
  }
  const perPage = cols * gridRows;
  const skip = skipCells && skipCells.length === perPage ? skipCells : new Array(perPage).fill(false);
  const overflowReport = [];

  // Lay out each lot's content once, then repeat the result `quantities[i]`
  // times in the sequence below - laying out the same text twice would be
  // wasted work and (for autoFitLayout-style callers) could in principle
  // pick a different size each time.
  const sequence = [];
  rows.forEach((row, idx) => {
    const code = cleanField(row.code);
    const name = cleanField(row.name);
    const lines = buildLines(row, titleSize, bodySize);
    const { placed, overflow, cutText } = layoutSticker(doc, stickerW, stickerH, lines, resolvedFamily, titleSize);
    if (overflow) overflowReport.push({ code, name, cutText, overflow: true });

    const qty = Math.max(0, Math.round(quantities[idx] ?? 0));
    for (let i = 0; i < qty; i++) sequence.push(placed);
  });

  if (sequence.length === 0) {
    throw new Error("Set a quantity greater than 0 for at least one lot.");
  }

  let seqIndex = 0;
  let pageIndex = 0;
  while (seqIndex < sequence.length) {
    if (pageIndex > 0) doc.addPage();
    const isFirstPage = pageIndex === 0;
    for (let cell = 0; cell < perPage && seqIndex < sequence.length; cell++) {
      if (isFirstPage && skip[cell]) continue; // already used on the physical sheet - leave blank
      const col = cell % cols;
      const r = Math.floor(cell / cols);
      const x = marginX + col * (stickerW + gapX);
      const yTop = marginY + r * (stickerH + gapY);
      drawSticker(doc, x, yTop, sequence[seqIndex], resolvedFamily);
      seqIndex++;
    }
    pageIndex++;
  }

  return { doc, overflowReport, cols, rows: gridRows, perPage, totalStickers: sequence.length, totalPages: doc.internal.getNumberOfPages() };
}

// Builds a document for a thermal label printer: one page per physical
// label (no grid - the page itself is sized exactly to the sticker), with
// each row's lot repeated `quantities[i]` times. Reuses the same
// buildLines/layoutSticker/drawSticker content layer as buildDoc, so the
// two output modes only differ in how pages/positions are assembled - and
// in that each lot's text size is either auto-fit (labelLayoutFor's
// default) or comes from the Title/Body size fields when "Manual font
// size" is on.
async function buildLabelDoc(rows, quantities, options) {
  const { fontFamily, stickerWidthMm, stickerHeightMm } = options;
  const stickerW = stickerWidthMm * PT_PER_MM;
  const stickerH = stickerHeightMm * PT_PER_MM;
  const pageFormat = [stickerW, stickerH];
  const doc = new jsPDF({ unit: "pt", format: pageFormat, orientation: "portrait" });
  const resolvedFamily = await ensureFont(doc, fontFamily);
  const overflowReport = [];
  let firstPage = true;

  rows.forEach((row, idx) => {
    const qty = Math.max(0, Math.round(quantities[idx] ?? 0));
    if (qty <= 0) return;
    const code = cleanField(row.code);
    const name = cleanField(row.name);
    const { placed, overflow, cutText } = labelLayoutFor(doc, stickerW, stickerH, row, resolvedFamily, options);
    if (overflow) overflowReport.push({ code, name, cutText, overflow: true });

    for (let i = 0; i < qty; i++) {
      if (!firstPage) doc.addPage(pageFormat, "portrait");
      firstPage = false;
      drawSticker(doc, 0, 0, placed, resolvedFamily);
    }
  });

  if (firstPage) {
    throw new Error("Set a quantity greater than 0 for at least one lot.");
  }

  return { doc, overflowReport };
}
