// Sticker geometry: page/grid math and per-sticker text placement. Depends
// on buildLines (js/csv.js), loaded before this file.

const PT_PER_CM = 28.3465;
const PT_PER_MM = PT_PER_CM / 10;
const PAD = 0.25 * PT_PER_CM;
// Slightly more breathing room on the top/left than the default PAD gives;
// right/bottom stay at PAD so the fit-check math (which assumes symmetric
// right/bottom limits) doesn't need to change.
const PAD_TOP = PAD + 1.5 * PT_PER_MM;
const PAD_LEFT = PAD + 3 * PT_PER_MM;
const LINE_GAP = 1.15;
const TITLE_BODY_GAP = 0.15 * PT_PER_CM; // extra space between title and property lines

const A4_W_PT = 210 * PT_PER_MM;
const A4_H_PT = 297 * PT_PER_MM;

// Named sticker sizes, grouped by output mode (which "Label sheet" <option>s
// with a matching data-mode they appear under - see setOutputMode). Each is
// the default/locked preset for its size; "Custom size" unlocks the fields
// to override it. Add more label-mode presets here (plus a matching <option
// data-mode="label"> in the HTML) as new sticker printer label sizes come up.
const LABEL_PRESETS = {
  // Sheet mode: 70 x 42.3mm, no gap, 3x7 (21/page) on an A4 sheet.
  "lu-a4-21": { widthMm: 70, heightMm: 42.3, gapXMm: 0, gapYMm: 0 },
  // Label mode: nominal 3x3in MUNBYN direct thermal label, one per page.
  "munbyn-3x3": { widthMm: 76.2, heightMm: 76.2, gapXMm: 0, gapYMm: 0 },
};

// Given a sticker size and gap (all in pt) plus a page size, figures out how
// many columns/rows fit on the page. The grid is anchored flush to the
// top-left corner (marginX = marginY = 0) rather than centered, matching
// physical die-cut label sheets that print with zero margin starting right
// at the edge of the page; any leftover space (if the sticker size/count
// doesn't divide the page evenly) is simply left unused at the bottom/right.
function computeGrid(stickerW, stickerH, gapX, gapY, pageW, pageH) {
  const cols = Math.max(0, Math.floor((pageW + gapX + 1e-6) / (stickerW + gapX)));
  const rows = Math.max(0, Math.floor((pageH + gapY + 1e-6) / (stickerH + gapY)));
  return { cols, rows, marginX: 0, marginY: 0 };
}

function gridFromOptions(options) {
  const stickerW = options.stickerWidthMm * PT_PER_MM;
  const stickerH = options.stickerHeightMm * PT_PER_MM;
  const gapX = options.gapXMm * PT_PER_MM;
  const gapY = options.gapYMm * PT_PER_MM;
  return computeGrid(stickerW, stickerH, gapX, gapY, A4_W_PT, A4_H_PT);
}

// Lays out a sticker's lines within (0,0)-(stickerW,stickerH) without
// drawing anything, so it can be reused both for actually rendering a
// sticker and for checking ahead of time whether everything will fit.
// Returns the positioned lines plus whether any content had to be cut.
// Rough descender allowance: text is positioned by baseline (y), but glyphs
// like "g"/"y"/"p" extend below it. Without this, a line could be accepted
// right at the bottom pad and then visually print past the sticker's edge.
const DESCENDER_RATIO = 0.25;

// opts: { center, titleBodyGap, padLeft, padTop, padRight, padBottom, noWrap }
// all optional - omitted ones default to the sheet-mode look (left/top
// anchored, fixed padding, wrapping allowed) so existing callers are
// unaffected. Label mode passes center:true plus its own padding/gap to get
// a centered block. Auto-fit also passes noWrap:true, so a line that would
// need to wrap counts as overflow and the binary search picks a smaller
// size instead - otherwise the "best fit" size could still wrap a line.
// Manual font size leaves wrapping on, same as sheet mode: the size is
// fixed by the user, so a long line just wraps rather than being flagged.
function layoutSticker(doc, stickerW, stickerH, lines, fontFamily, titleSize, opts = {}) {
  const center = !!opts.center;
  const noWrap = !!opts.noWrap;
  const titleBodyGap = opts.titleBodyGap ?? TITLE_BODY_GAP;
  const padLeft = opts.padLeft ?? PAD_LEFT;
  const padTop = opts.padTop ?? PAD_TOP;
  const padRight = opts.padRight ?? PAD;
  const padBottom = opts.padBottom ?? PAD;

  const maxWidth = stickerW - padLeft - padRight;
  let cursorY = padTop + titleSize * 0.8;
  const bottomLimit = stickerH - padBottom;
  const placed = [];
  let overflow = false;
  let cutText = null;
  let prevBold = null;

  for (const { text, bold, size } of lines) {
    if (prevBold === true && bold === false) cursorY += titleBodyGap;
    prevBold = bold;
    doc.setFont(fontFamily, bold ? "bold" : "normal");
    doc.setFontSize(size);
    const wrapped = doc.splitTextToSize(text, maxWidth);
    if (noWrap && wrapped.length > 1) {
      overflow = true;
      if (cutText === null) cutText = text;
      break;
    }
    for (const wline of wrapped) {
      if (cursorY + size * DESCENDER_RATIO > bottomLimit) {
        overflow = true;
        if (cutText === null) cutText = text;
        break;
      }
      const dx = center ? (stickerW - doc.getTextWidth(wline)) / 2 : padLeft;
      placed.push({ text: wline, size, bold, y: cursorY, dx });
      cursorY += size * LINE_GAP;
    }
    if (overflow) break;
  }

  // Shift the whole block down so it's vertically centered in the sticker,
  // instead of anchored to the top padding.
  if (center && placed.length && !overflow) {
    const first = placed[0];
    const last = placed[placed.length - 1];
    const topEdge = first.y - first.size * 0.8;
    const bottomEdge = last.y + last.size * DESCENDER_RATIO;
    const verticalOffset = (stickerH - (bottomEdge - topEdge)) / 2 - topEdge;
    placed.forEach((p) => { p.y += verticalOffset; });
  }

  return { placed, overflow, cutText };
}

function drawSticker(doc, x, yTop, placed, fontFamily) {
  for (const p of placed) {
    doc.setFont(fontFamily, p.bold ? "bold" : "normal");
    doc.setFontSize(p.size);
    doc.text(p.text, x + p.dx, yTop + p.y);
  }
}

// Label mode's default (when "Manual font size" is off): each lot's text is
// sized as large as will fit that specific label (binary search on title
// size, with body size and the title/body gap scaled to match), then
// centered. Different lots can end up with different sizes; that's the
// point - a short code fills the label just as a long one does.
const AUTO_FIT_MIN_TITLE = 6;
const AUTO_FIT_MAX_TITLE = 60;
const AUTO_FIT_BODY_RATIO = 9 / 12; // same title:body proportion as the sheet-mode defaults
const AUTO_FIT_SEARCH_STEPS = 18;
// Symmetric margin for label mode - unlike the sheet preset's PAD_LEFT/PAD_TOP,
// this hasn't been calibrated against a real printed MUNBYN label yet.
const AUTO_FIT_PAD = PAD;

function autoFitLayout(doc, stickerW, stickerH, row, columns, fontFamily) {
  const padOpts = { center: true, noWrap: true, padLeft: AUTO_FIT_PAD, padTop: AUTO_FIT_PAD, padRight: AUTO_FIT_PAD, padBottom: AUTO_FIT_PAD };
  function attempt(titleSize) {
    const bodySize = titleSize * AUTO_FIT_BODY_RATIO;
    const lines = buildLines(row, columns, titleSize, bodySize);
    const result = layoutSticker(doc, stickerW, stickerH, lines, fontFamily, titleSize, {
      ...padOpts,
      titleBodyGap: titleSize * 0.3,
    });
    return { ...result, titleSize, bodySize };
  }

  let best = attempt(AUTO_FIT_MIN_TITLE); // fallback if even the minimum size overflows
  let lo = AUTO_FIT_MIN_TITLE, hi = AUTO_FIT_MAX_TITLE;
  for (let i = 0; i < AUTO_FIT_SEARCH_STEPS; i++) {
    const mid = (lo + hi) / 2;
    const candidate = attempt(mid);
    if (!candidate.overflow) {
      best = candidate;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return best;
}

// Label mode's layout, honoring the "Manual font size" override: when it's
// on, use the same Title/Body size fields as sheet mode (still centered,
// same margins as auto-fit) instead of searching for a best-fit size.
function labelLayoutFor(doc, stickerW, stickerH, row, columns, fontFamily, options) {
  if (!options.manualFontSize) {
    return autoFitLayout(doc, stickerW, stickerH, row, columns, fontFamily);
  }
  const { titleSize, bodySize } = options;
  const lines = buildLines(row, columns, titleSize, bodySize);
  const result = layoutSticker(doc, stickerW, stickerH, lines, fontFamily, titleSize, {
    center: true,
    titleBodyGap: titleSize * 0.3,
    padLeft: AUTO_FIT_PAD,
    padTop: AUTO_FIT_PAD,
    padRight: AUTO_FIT_PAD,
    padBottom: AUTO_FIT_PAD,
  });
  return { ...result, titleSize, bodySize };
}
