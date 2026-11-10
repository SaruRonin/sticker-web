// Document assembly: builds the two output types (A4 sheet grid, thermal
// label pages) and their fit-check equivalents. Depends on layout.js,
// fonts.js and csv.js, all loaded before this file.

const { jsPDF } = window.jspdf;

// Cheap check (no pages created) of whether every lot's content fits in a
// single sticker cell at the given font/size settings.
async function checkFit(rows, columns, options) {
  const { fontFamily, titleSize, bodySize, stickerWidthMm, stickerHeightMm } = options;
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const resolvedFamily = await ensureFont(doc, fontFamily);
  const stickerW = stickerWidthMm * PT_PER_MM;
  const stickerH = stickerHeightMm * PT_PER_MM;

  return rows.map((row) => {
    const code = columns.code ? cleanField(row[columns.code]) : "";
    const name = columns.name ? cleanField(row[columns.name]) : "";
    const lines = buildLines(row, columns, titleSize, bodySize);
    const { overflow, cutText } = layoutSticker(doc, stickerW, stickerH, lines, resolvedFamily, titleSize);
    return { code, name, overflow, cutText };
  });
}

// Label-mode equivalent of checkFit. With the manual override off, font
// size is auto-fit per lot rather than coming from the title/body size
// fields, so this only reports overflow for lots where even the minimum
// auto-fit size doesn't fit; with it on, it checks the manual size exactly
// like sheet mode does.
async function checkFitLabel(rows, columns, options) {
  const { fontFamily, stickerWidthMm, stickerHeightMm } = options;
  const stickerW = stickerWidthMm * PT_PER_MM;
  const stickerH = stickerHeightMm * PT_PER_MM;
  const doc = new jsPDF({ unit: "pt", format: [stickerW, stickerH], orientation: "portrait" });
  const resolvedFamily = await ensureFont(doc, fontFamily);

  return rows.map((row) => {
    const code = columns.code ? cleanField(row[columns.code]) : "";
    const name = columns.name ? cleanField(row[columns.name]) : "";
    const { overflow, cutText } = labelLayoutFor(doc, stickerW, stickerH, row, columns, resolvedFamily, options);
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

// Builds the full PDF and returns it along with a report of any lots whose
// content didn't fully fit in their sticker cell.
async function buildDoc(rows, columns, options) {
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
  const overflowReport = [];

  rows.forEach((row, idx) => {
    if (idx > 0) doc.addPage();
    const code = columns.code ? cleanField(row[columns.code]) : "";
    const name = columns.name ? cleanField(row[columns.name]) : "";
    const lines = buildLines(row, columns, titleSize, bodySize);
    const { placed, overflow, cutText } = layoutSticker(doc, stickerW, stickerH, lines, resolvedFamily, titleSize);

    for (let i = 0; i < perPage; i++) {
      const col = i % cols;
      const r = Math.floor(i / cols);
      const x = marginX + col * (stickerW + gapX);
      const yTop = marginY + r * (stickerH + gapY);
      drawSticker(doc, x, yTop, placed, resolvedFamily);
    }

    if (overflow) overflowReport.push({ code, name, cutText, overflow: true });
  });

  return { doc, overflowReport, cols, rows: gridRows };
}

// Builds a document for a thermal label printer: one page per physical
// label (no grid - the page itself is sized exactly to the sticker), with
// each row's lot repeated `quantities[i]` times. Reuses the same
// buildLines/layoutSticker/drawSticker content layer as buildDoc, so the
// two output modes only differ in how pages/positions are assembled - and
// in that each lot's text size is either auto-fit (labelLayoutFor's
// default) or comes from the Title/Body size fields when "Manual font
// size" is on.
async function buildLabelDoc(rows, columns, quantities, options) {
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
    const code = columns.code ? cleanField(row[columns.code]) : "";
    const name = columns.name ? cleanField(row[columns.name]) : "";
    const { placed, overflow, cutText } = labelLayoutFor(doc, stickerW, stickerH, row, columns, resolvedFamily, options);
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
