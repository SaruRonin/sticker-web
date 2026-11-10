// Standard custom font: only a Bold weight is available, so it's used for
// both title and body text. Loaded lazily (once) as base64 and registered
// into each new jsPDF document, since jsPDF's VFS/font registry is per-doc.
const CUSTOM_FONT_FILE = "fonts/RestoraNeue-Bold.ttf";
const CUSTOM_FONT_FAMILY = "RestoraNeue";
let customFontBase64 = null;
let customFontLoadPromise = null;

function loadCustomFont() {
  if (!customFontLoadPromise) {
    customFontLoadPromise = fetch(CUSTOM_FONT_FILE)
      .then((resp) => {
        if (!resp.ok) throw new Error(`Failed to load ${CUSTOM_FONT_FILE} (${resp.status})`);
        return resp.arrayBuffer();
      })
      .then((buf) => {
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        customFontBase64 = btoa(binary);
        return customFontBase64;
      });
  }
  return customFontLoadPromise;
}

// Registers the custom font on one jsPDF document instance (must be
// repeated per-document). Returns the font family name actually usable
// for doc.setFont(...) - falls back to Times New Roman if loading failed.
async function ensureFont(doc, fontFamily) {
  if (fontFamily !== "restora") return fontFamily;
  try {
    await loadCustomFont();
  } catch (err) {
    console.warn(err);
    return "times";
  }
  doc.addFileToVFS(CUSTOM_FONT_FILE, customFontBase64);
  doc.addFont(CUSTOM_FONT_FILE, CUSTOM_FONT_FAMILY, "normal");
  doc.addFont(CUSTOM_FONT_FILE, CUSTOM_FONT_FAMILY, "bold");
  return CUSTOM_FONT_FAMILY;
}
