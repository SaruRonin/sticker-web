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
UI_TEXT.ko = { ...UI_TEXT.en,
  language:"언어", subtitle:"커피 로트 CSV를 업로드하고 스티커 종류를 선택해 스티커를 만들어 보세요.", chooseCsv:"클릭하여 CSV 파일 선택", orDrag:"또는 여기에 끌어다 놓기", csvOnly:"CSV 파일만 가능", editLots:"로트 직접 편집 / 추가", output:"출력", a4Sheet:"A4 시트", thermalLabel:"감열 라벨", font:"글꼴", manualFontSize:"글꼴 크기 직접 설정", titleSize:"제목 크기 (pt)", bodySize:"본문 크기 (pt)", labelSize:"라벨 크기", customSize:"사용자 지정 크기", stickerWidth:"스티커 너비 (mm)", stickerHeight:"스티커 높이 (mm)", gapX:"가로 간격 (mm)", gapY:"세로 간격 (mm)", copiesPerLot:"로트별 인쇄 수량", reuseSheet:"사용한 스티커 위치를 표시해 남은 시트 재사용", chooseStickers:"사용 가능한 스티커 선택", generatePdf:"PDF 만들기", previewPdf:"PDF 미리보기", editLotsTitle:"로트 편집", editLotsHelp:"로트를 직접 추가, 편집 또는 삭제할 수 있습니다. 변경 사항은 즉시 적용됩니다.", addLot:"+ 로트 추가", done:"완료", pickerHelp:"스티커를 클릭해 사용됨(건너뜀) 또는 사용 가능으로 표시하세요.", markAllUsed:"모두 사용됨으로 표시", markAllAvailable:"모두 사용 가능으로 표시", recognizedColumns:"인식된 열", columnHelp:"대소문자와 열 순서는 상관없습니다. 비어 있는 항목은 스티커에서 생략됩니다.", code:"코드", name:"이름", country:"국가", region:"지역", variety:"품종", processing:"가공 방식", producer:"생산자", altitude:"고도", lot:"로트", quantity:"수량", remove:"삭제", decrease:"수량 줄이기", increase:"수량 늘리기", recognizedField:"인식된 항목", csvColumn:"CSV 열", ignoredColumns:"일치하지 않아 무시된 열: ", parsing:"파일 분석 중: ", csvParseError:"CSV 분석 오류: ", csvNoHeader:"CSV에 헤더 행이 없습니다.", csvNoRows:"CSV에 데이터 행이 없습니다.", readError:"파일을 읽지 못했습니다: ", addLotToGenerate:"스티커를 만들려면 CSV를 불러오거나 로트를 하나 이상 추가하세요.", setQuantity:"하나 이상의 로트 수량을 1 이상으로 설정하세요.", sizeTooLarge:"스티커가 너무 커서 A4에 들어가지 않습니다. 너비, 높이 또는 간격을 줄이세요.", previewGenerated:"미리보기를 만들었습니다.", previewError:"미리보기 생성 오류: ", pdfSaved:"PDF를 저장했습니다.", pdfSavedOverflow:"PDF를 저장했습니다. 단, {n}개 로트의 텍스트가 잘렸습니다. 위 경고를 확인하세요.", pdfError:"PDF 생성 오류: ", loaded:"불러옴: ", lotsSuffix:"개 로트 → ", labelsTotal:"개 라벨", stickersSuffix:"개 스티커, 총 ", pagesSuffix:"페이지", gridSuffix:" 격자, ", perPageSuffix:"개/페이지", usedOnSheetSuffix:"개 사용됨 (첫 번째 시트)", lotFallback:"(이름 없는 행)", warningFit:"{n}개 로트의 텍스트가 현재 글꼴 크기에 맞지 않아 일부가 잘릴 수 있습니다.", warningFitHelp:"글꼴 크기를 줄이거나 만들기 전에 미리보기를 확인하세요."
};
UI_TEXT.es = { ...UI_TEXT.en,
  language:"Idioma", subtitle:"Sube un CSV de lotes de café, elige el tipo de pegatina y crea tus pegatinas.", chooseCsv:"Haz clic para elegir un archivo CSV", orDrag:"o arrástralo aquí", csvOnly:"Solo archivos CSV", editLots:"Editar / añadir lotes manualmente", output:"Formato de salida", a4Sheet:"Hoja A4", thermalLabel:"Etiqueta térmica", font:"Fuente", manualFontSize:"Tamaño de fuente manual", titleSize:"Tamaño del título (pt)", bodySize:"Tamaño del texto (pt)", labelSize:"Tamaño de etiqueta", customSize:"Tamaño personalizado", stickerWidth:"Ancho de pegatina (mm)", stickerHeight:"Alto de pegatina (mm)", gapX:"Separación horizontal (mm)", gapY:"Separación vertical (mm)", copiesPerLot:"Copias por lote", reuseSheet:"Reutilizar una hoja empezada (marca las pegatinas ya usadas)", chooseStickers:"Elegir pegatinas disponibles", generatePdf:"Generar PDF", previewPdf:"Vista previa del PDF", editLotsTitle:"Editar lotes", editLotsHelp:"Añade, edita o elimina lotes manualmente. Los cambios se aplican de inmediato.", addLot:"+ Añadir lote", done:"Listo", pickerHelp:"Haz clic en una pegatina para marcarla como usada (se omite) o disponible.", markAllUsed:"Marcar todas como usadas", markAllAvailable:"Marcar todas como disponibles", recognizedColumns:"Columnas reconocidas", columnHelp:"No distingue mayúsculas y minúsculas ni importa el orden. Los campos vacíos se omiten en cada pegatina.", code:"Código", name:"Nombre", country:"País", region:"Región", variety:"Variedad", processing:"Procesamiento", producer:"Productor", altitude:"Altitud", lot:"Lote", quantity:"Cantidad", remove:"Eliminar", decrease:"Reducir cantidad", increase:"Aumentar cantidad", recognizedField:"Campo reconocido", csvColumn:"Columna CSV", ignoredColumns:"Columnas ignoradas (sin coincidencia): ", parsing:"Procesando ", csvParseError:"Error al analizar el CSV: ", csvNoHeader:"El CSV no tiene una fila de encabezados.", csvNoRows:"El CSV no tiene filas de datos.", readError:"No se pudo leer el archivo: ", addLotToGenerate:"Añade al menos un lote mediante un CSV o la edición manual para generar pegatinas.", setQuantity:"Asigna una cantidad mayor que 0 a algún lote.", sizeTooLarge:"La pegatina es demasiado grande para caber en una página A4. Reduce el ancho, el alto o el espacio.", previewGenerated:"Vista previa generada.", previewError:"Error al generar la vista previa: ", pdfSaved:"PDF guardado.", pdfSavedOverflow:"PDF guardado, pero el texto de {n} lote(s) quedó cortado. Consulta el aviso anterior.", pdfError:"Error al generar el PDF: ", loaded:"Cargados ", lotsSuffix:" lote(s) → ", labelsTotal:" etiqueta(s) en total.", stickersSuffix:" pegatina(s) en ", pagesSuffix:" página(s)", gridSuffix:" cuadrícula, ", perPageSuffix:" por página", usedOnSheetSuffix:" ya usadas en la primera hoja", lotFallback:"(fila sin nombre)", warningFit:"El texto de {n} lote(s) no cabe con este tamaño de fuente y puede quedar cortado.", warningFitHelp:"Prueba con una fuente más pequeña o revisa la vista previa antes de generar el PDF."
};
UI_TEXT.pt = { ...UI_TEXT.en,
  language:"Idioma", subtitle:"Carregue um CSV de lotes de café, escolha o tipo de etiqueta e crie suas etiquetas.", chooseCsv:"Clique para escolher um arquivo CSV", orDrag:"ou arraste-o até aqui", csvOnly:"Somente arquivos CSV", editLots:"Editar / adicionar lotes manualmente", output:"Formato de saída", a4Sheet:"Folha A4", thermalLabel:"Etiqueta térmica", font:"Fonte", manualFontSize:"Tamanho da fonte manual", titleSize:"Tamanho do título (pt)", bodySize:"Tamanho do texto (pt)", labelSize:"Tamanho da etiqueta", customSize:"Tamanho personalizado", stickerWidth:"Largura da etiqueta (mm)", stickerHeight:"Altura da etiqueta (mm)", gapX:"Espaçamento horizontal (mm)", gapY:"Espaçamento vertical (mm)", copiesPerLot:"Cópias por lote", reuseSheet:"Reutilizar uma folha iniciada (marque as etiquetas já usadas)", chooseStickers:"Escolher etiquetas disponíveis", generatePdf:"Gerar PDF", previewPdf:"Visualizar PDF", editLotsTitle:"Editar lotes", editLotsHelp:"Adicione, edite ou remova lotes manualmente. As alterações são aplicadas imediatamente.", addLot:"+ Adicionar lote", done:"Concluído", pickerHelp:"Clique em uma etiqueta para marcá-la como usada (será ignorada) ou disponível.", markAllUsed:"Marcar todas como usadas", markAllAvailable:"Marcar todas como disponíveis", recognizedColumns:"Colunas reconhecidas", columnHelp:"Não diferencia maiúsculas de minúsculas e aceita qualquer ordem. Campos vazios são omitidos em cada etiqueta.", code:"Código", name:"Nome", country:"País", region:"Região", variety:"Variedade", processing:"Processamento", producer:"Produtor", altitude:"Altitude", lot:"Lote", quantity:"Quantidade", remove:"Remover", decrease:"Diminuir quantidade", increase:"Aumentar quantidade", recognizedField:"Campo reconhecido", csvColumn:"Coluna CSV", ignoredColumns:"Colunas ignoradas (sem correspondência): ", parsing:"Lendo ", csvParseError:"Erro ao analisar CSV: ", csvNoHeader:"O CSV não tem uma linha de cabeçalho.", csvNoRows:"O CSV não tem linhas de dados.", readError:"Falha ao ler o arquivo: ", addLotToGenerate:"Adicione pelo menos um lote por CSV ou pela edição manual para gerar etiquetas.", setQuantity:"Defina uma quantidade maior que 0 para pelo menos um lote.", sizeTooLarge:"A etiqueta é grande demais para caber em uma folha A4. Reduza a largura, a altura ou o espaçamento.", previewGenerated:"Pré-visualização gerada.", previewError:"Erro ao gerar pré-visualização: ", pdfSaved:"PDF salvo.", pdfSavedOverflow:"PDF salvo, mas o texto de {n} lote(s) foi cortado. Consulte o aviso acima.", pdfError:"Erro ao gerar PDF: ", loaded:"Carregados ", lotsSuffix:" lote(s) → ", labelsTotal:" etiqueta(s) no total.", stickersSuffix:" etiqueta(s) em ", pagesSuffix:" página(s)", gridSuffix:" grade, ", perPageSuffix:" por página", usedOnSheetSuffix:" já usadas na primeira folha", lotFallback:"(linha sem nome)", warningFit:"O texto de {n} lote(s) pode não caber neste tamanho de fonte e ser cortado.", warningFitHelp:"Tente reduzir o tamanho da fonte ou confira a pré-visualização antes de gerar."
};
Object.assign(UI_TEXT.en, { editLotsTitle:"Edit Lots", loaded:"Loaded", lotsSuffix:" lot(s) → ", labelsTotal:" label(s) total.", stickersSuffix:" sticker(s) across ", pagesSuffix:" page(s)", gridSuffix:" grid, ", perPageSuffix:" per page", usedOnSheetSuffix:" already used on sheet 1", lotFallback:"(unlabeled row)" });
Object.assign(UI_TEXT.ja, { editLotsTitle:"ロットを編集", loaded:"読み込み完了：", lotsSuffix:"件のロット → ", labelsTotal:"枚のラベル", stickersSuffix:"枚のステッカー、全", pagesSuffix:"ページ", gridSuffix:"グリッド、", perPageSuffix:"枚/ページ", usedOnSheetSuffix:"枚使用済み（1枚目）", lotFallback:"（名前なし）" });
Object.assign(UI_TEXT.en, { warningFit:"{n} lot(s) may not fit at this font size, so some text could be cut off.", warningFitHelp:"Try a smaller font size, or check the preview before generating." });
Object.assign(UI_TEXT.ja, { warningFit:"{n}件のロットが設定したフォントサイズに収まらず、一部の文字が切れる可能性があります。", warningFitHelp:"フォントサイズを小さくするか、作成前にプレビューをご確認ください。" });
Object.assign(UI_TEXT.ko, { editLotsTitle:"로트 편집", warningFit:"{n}개 로트의 텍스트가 현재 글꼴 크기에 맞지 않아 일부가 잘릴 수 있습니다.", warningFitHelp:"글꼴 크기를 줄이거나 만들기 전에 미리보기를 확인하세요." });
Object.assign(UI_TEXT.es, { editLotsTitle:"Editar lotes", warningFit:"El texto de {n} lote(s) no cabe con este tamaño de fuente y puede quedar cortado.", warningFitHelp:"Prueba con una fuente más pequeña o revisa la vista previa antes de generar el PDF." });
Object.assign(UI_TEXT.en, { emptyLotMessage:"Complete or remove every empty lot before generating a PDF.", csvEmptyLots:"The CSV contains one or more lots with no properties. Fill them in or remove those rows, then try again." });
Object.assign(UI_TEXT.ja, { emptyLotMessage:"空のロットをすべて入力するか削除してからPDFを作成してください。", csvEmptyLots:"CSVに項目が空のロットがあります。入力するか該当行を削除して、もう一度お試しください。" });
Object.assign(UI_TEXT.ko, { emptyLotMessage:"PDF를 만들기 전에 속성이 비어 있는 로트를 모두 입력하거나 삭제하세요.", csvEmptyLots:"CSV에 속성이 비어 있는 로트가 있습니다. 내용을 입력하거나 해당 행을 삭제한 뒤 다시 시도하세요." });
Object.assign(UI_TEXT.es, { emptyLotMessage:"Completa o elimina todos los lotes vacíos antes de generar el PDF.", csvEmptyLots:"El CSV contiene uno o más lotes sin propiedades. Complétalos o elimina esas filas e inténtalo de nuevo." });
Object.assign(UI_TEXT.pt, { emptyLotMessage:"Preencha ou remova todos os lotes vazios antes de gerar o PDF.", csvEmptyLots:"O CSV contém um ou mais lotes sem propriedades. Preencha-os ou remova essas linhas e tente novamente." });
Object.assign(UI_TEXT.en, { pdfCancelled:"PDF save cancelled.", stickerAvailable:"available", stickerUsed:"used" });
Object.assign(UI_TEXT.ja, { pdfCancelled:"PDFの保存をキャンセルしました。", stickerAvailable:"使用可能", stickerUsed:"使用済み" });
Object.assign(UI_TEXT.ko, { pdfCancelled:"PDF 저장을 취소했습니다.", stickerAvailable:"사용 가능", stickerUsed:"사용됨" });
Object.assign(UI_TEXT.es, { pdfCancelled:"Se canceló el guardado del PDF.", stickerAvailable:"disponible", stickerUsed:"usada" });
Object.assign(UI_TEXT.pt, { pdfCancelled:"O salvamento do PDF foi cancelado.", stickerAvailable:"disponível", stickerUsed:"usada" });
const savedUiLanguage = localStorage.getItem("stickerUiLanguage");
let uiLanguage = UI_TEXT[savedUiLanguage] ? savedUiLanguage : "en";
function tr(key) { return (UI_TEXT[uiLanguage] && UI_TEXT[uiLanguage][key]) || UI_TEXT.en[key] || key; }
function setLotModalValidation(visible) {
  const el = document.getElementById("lotModalValidation");
  if (!el) return;
  el.textContent = visible ? tr("emptyLotMessage") : "";
  el.style.display = visible ? "block" : "none";
}
function applyLanguage() {
  document.documentElement.lang = uiLanguage;
  document.title = tr("appTitle");
  document.getElementById("languageSelect").setAttribute("aria-label", tr("language"));
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = tr(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = tr(el.dataset.i18nTitle); });
  document.getElementById("languageSelect").value = uiLanguage;
  const lotValidation = document.getElementById("lotModalValidation");
  if (lotValidation && lotValidation.style.display !== "none") setLotModalValidation(true);
  renderQuantityTable();
  if (parsedRows) renderLotModalTable();
  const picker = document.getElementById("cellPickerModalOverlay");
  if (picker && picker.style.display !== "none") {
    const focusedCell = document.activeElement.closest?.(".pickerCell");
    const focusedIndex = focusedCell?.dataset.idx;
    renderCellPickerGrid();
    if (focusedIndex !== undefined) document.querySelector(`#cellPickerGrid [data-idx="${focusedIndex}"]`)?.focus();
  }
  if (parsedRows) runFitCheck();
}
document.getElementById("languageSelect").addEventListener("change", e => {
  uiLanguage = e.target.value;
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
let pendingLotDraft = null; // not committed as a lot until at least one property has content
let outputModeValue = "sheet"; // set by the Output toggle buttons, see setOutputMode

// Sheet mode only: lets a partially-used physical sheet be reused by
// marking which of its grid cells are already gone, so the first page's
// sequence skips those positions instead of printing over blank stickers
// that aren't actually there. usedCells[i] true = already used/skip.
let usedCells = [];
let cellPickerCols = 0;
let cellPickerRows = 0;
let cellPickerRatio = 1; // current sticker width/height, so picker cells look like the real stickers
let fitCheckRevision = 0;
let fitCheckTimer = null;
let activeModal = null;
let modalReturnFocus = null;

function scheduleFitCheck() {
  fitCheckRevision++;
  clearTimeout(fitCheckTimer);
  fitCheckTimer = setTimeout(runFitCheck, 120);
}

function setActiveModal(modal, initialFocus) {
  activeModal = modal;
  modalReturnFocus = document.activeElement;
  initialFocus.focus();
}

function restoreModalFocus() {
  activeModal = null;
  if (modalReturnFocus && modalReturnFocus.isConnected) modalReturnFocus.focus();
  modalReturnFocus = null;
}

document.addEventListener("keydown", (event) => {
  if (!activeModal) return;
  if (event.key === "Escape") {
    event.preventDefault();
    if (activeModal.id === "lotModalOverlay") closeLotModal();
    else closeCellPickerModal();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...activeModal.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex="0"]')];
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

function currentMode() {
  return outputModeValue;
}

function setStatus(msg, kind) {
  statusEl.textContent = msg;
  statusEl.className = kind || "";
}

function lotHasProperties(lot) {
  return ALL_FIELDS.some((field) => cleanField(lot[field]));
}

function emptyLotIndexes() {
  return (parsedRows || []).reduce((indexes, lot, idx) => {
    if (!lotHasProperties(lot)) indexes.push(idx);
    return indexes;
  }, []);
}

function hasIncompleteLots() {
  return !!pendingLotDraft || emptyLotIndexes().length > 0;
}

function focusFirstEmptyLot() {
  const idx = emptyLotIndexes()[0];
  const input = pendingLotDraft
    ? lotModalTable.querySelector('.lotField[data-draft="true"]')
    : idx === undefined ? null : lotModalTable.querySelector(`.lotField[data-idx="${idx}"]`);
  if (input) input.focus();
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
    `<strong>${tr("warningFit").replace("{n}", overflowing.length)}</strong>` +
    `<ul>${items}</ul>` + tr("warningFitHelp");
  warningsEl.className = "warn";
}

async function runFitCheck() {
  clearTimeout(fitCheckTimer);
  fitCheckTimer = null;
  const revision = ++fitCheckRevision;
  if (!parsedRows) return;
  const options = getOptions();

  if (hasIncompleteLots()) {
    generateBtn.disabled = true;
    previewBtn.disabled = true;
    setStatus(tr("emptyLotMessage"), "error");
    warningsEl.innerHTML = "";
    warningsEl.className = "";
    return;
  }

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
    const report = await checkFitLabel(parsedRows, options);
    if (revision === fitCheckRevision) renderFitWarnings(report);
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
  const report = await checkFit(parsedRows, options);
  if (revision === fitCheckRevision) renderFitWarnings(report);
}

["fontFamily", "titleSize", "bodySize", "stickerWidth", "stickerHeight", "gapX", "gapY"].forEach((id) => {
  document.getElementById(id).addEventListener("input", scheduleFitCheck);
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
  scheduleFitCheck();
});

document.getElementById("quantityTable").addEventListener("input", (e) => {
  if (!e.target.classList.contains("qtyInput")) return;
  const idx = parseInt(e.target.dataset.idx, 10);
  quantities[idx] = Math.max(0, parseInt(e.target.value, 10) || 0);
  scheduleFitCheck();
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
    html += `<button type="button" class="pickerCell${used ? " used" : ""}" data-idx="${i}" aria-pressed="${used}" aria-label="${i + 1}, ${tr(used ? "stickerUsed" : "stickerAvailable")}">${i + 1}</button>`;
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
  setActiveModal(cellPickerModalOverlay, document.getElementById("cellPickerGrid").querySelector("button") || document.getElementById("closeCellPickerModalBtn"));
}

function closeCellPickerModal() {
  cellPickerModalOverlay.style.display = "none";
  restoreModalFocus();
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
  cell.setAttribute("aria-pressed", String(usedCells[idx]));
  cell.setAttribute("aria-label", `${idx + 1}, ${tr(usedCells[idx] ? "stickerUsed" : "stickerAvailable")}`);
  runFitCheck();
});

document.getElementById("cellPickerGrid").addEventListener("keydown", (e) => {
  if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
  const cells = [...document.querySelectorAll("#cellPickerGrid .pickerCell")];
  const index = cells.indexOf(e.target);
  if (index < 0) return;
  const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? cellPickerCols : -cellPickerCols;
  if (cells[index + delta]) { e.preventDefault(); cells[index + delta].focus(); }
});

document.getElementById("markAllUsedBtn").addEventListener("click", () => {
  usedCells = usedCells.map(() => true);
  renderCellPickerGrid();
  document.getElementById("markAllUsedBtn").focus();
  runFitCheck();
});

document.getElementById("markAllAvailableBtn").addEventListener("click", () => {
  usedCells = usedCells.map(() => false);
  renderCellPickerGrid();
  document.getElementById("markAllAvailableBtn").focus();
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
  if (pendingLotDraft) {
    html += "<tr>" + LOT_FIELD_LABELS.map(([field]) =>
      `<td><input type="text" class="lotField" data-draft="true" data-field="${field}" value="${escapeAttr(pendingLotDraft[field] || "")}"></td>`
    ).join("");
    html += `<td><button type="button" class="removeLotBtn" data-idx="draft">${tr("remove")}</button></td></tr>`;
  }
  lotModalTable.innerHTML = html;
}

function openLotModal() {
  if (!parsedRows) {
    parsedRows = [];
    quantities = [];
  }
  renderLotModalTable();
  setLotModalValidation(hasIncompleteLots());
  lotModalOverlay.style.display = "flex";
  setActiveModal(lotModalOverlay, lotModalTable.querySelector("input") || document.getElementById("closeLotModalBtn"));
}

function closeLotModal() {
  if (hasIncompleteLots()) {
    setLotModalValidation(true);
    setStatus(tr("emptyLotMessage"), "error");
    focusFirstEmptyLot();
    return;
  }
  setLotModalValidation(false);
  lotModalOverlay.style.display = "none";
  restoreModalFocus();
}

document.getElementById("editLotsBtn").addEventListener("click", openLotModal);
document.getElementById("closeLotModalBtn").addEventListener("click", closeLotModal);
lotModalOverlay.addEventListener("click", (e) => {
  if (e.target === lotModalOverlay) closeLotModal(); // clicked the backdrop, not the box
});

document.getElementById("addLotBtn").addEventListener("click", () => {
  if (hasIncompleteLots()) {
    setLotModalValidation(true);
    setStatus(tr("emptyLotMessage"), "error");
    focusFirstEmptyLot();
    return;
  }
  pendingLotDraft = emptyLot();
  renderLotModalTable();
  setLotModalValidation(true);
  const draftInput = lotModalTable.querySelector('.lotField[data-draft="true"]');
  if (draftInput) draftInput.focus();
  runFitCheck();
});

lotModalTable.addEventListener("input", (e) => {
  if (!e.target.classList.contains("lotField")) return;
  if (e.target.dataset.draft === "true") {
    const field = e.target.dataset.field;
    pendingLotDraft[field] = e.target.value;
    if (lotHasProperties(pendingLotDraft)) {
      const committedIndex = parsedRows.length;
      parsedRows.push(pendingLotDraft);
      quantities.push(1);
      pendingLotDraft = null;
      renderLotModalTable();
      renderQuantityTable();
      setLotModalValidation(hasIncompleteLots());
      const committedInput = lotModalTable.querySelector(`.lotField[data-idx="${committedIndex}"][data-field="${field}"]`);
      if (committedInput) committedInput.focus();
    }
    else setLotModalValidation(true);
    runFitCheck();
    return;
  }
  const idx = parseInt(e.target.dataset.idx, 10);
  parsedRows[idx][e.target.dataset.field] = e.target.value;
  renderQuantityTable(); // code/name changes affect the quantity table's row labels
  setLotModalValidation(hasIncompleteLots());
  runFitCheck();
});

lotModalTable.addEventListener("click", (e) => {
  const btn = e.target.closest(".removeLotBtn");
  if (!btn) return;
  if (btn.dataset.idx === "draft") {
    pendingLotDraft = null;
    renderLotModalTable();
    setLotModalValidation(hasIncompleteLots());
    runFitCheck();
    return;
  }
  const idx = parseInt(btn.dataset.idx, 10);
  parsedRows.splice(idx, 1);
  quantities.splice(idx, 1);
  renderLotModalTable();
  renderQuantityTable();
  setLotModalValidation(hasIncompleteLots());
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

      const canonicalRows = rows.map((row) => toCanonicalRow(row, columns));
      if (canonicalRows.some((row) => !lotHasProperties(row))) {
        setStatus(tr("csvEmptyLots"), "error");
        generateBtn.disabled = true;
        previewBtn.disabled = true;
        return;
      }
      parsedRows = canonicalRows;
      pendingLotDraft = null;
      quantities = rows.map(() => 1);
      renderQuantityTable();
      runFitCheck();

      const recognized = Object.keys(columns);
      const unrecognized = fieldnames.filter(f => !Object.values(columns).includes(f));
      let html = `<table><tr><th>${tr("recognizedField")}</th><th>${tr("csvColumn")}</th></tr>`;
      const fieldKeys = { code:"code", name:"name", Country:"country", Region:"region", Variety:"variety", Processing:"processing", Producer:"producer", Altitude:"altitude" };
      recognized.forEach(k => { html += `<tr><td>${tr(fieldKeys[k] || k)}</td><td>${escapeHtml(columns[k])}</td></tr>`; });
      html += "</table>";
      if (unrecognized.length) {
        html += `<p style="font-size:0.85rem;color:#fcd34d;margin-top:0.5rem;">${tr("ignoredColumns")}${unrecognized.map(escapeHtml).join(", ")}</p>`;
      }
      previewEl.innerHTML = html;
    },
    error: (err) => {
      setStatus(tr("readError") + err.message, "error");
    },
  });
}

dropEl.addEventListener("click", () => fileInput.click());
dropEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); }
});
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
  if (hasIncompleteLots()) throw new Error(tr("emptyLotMessage"));
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
    const saved = await savePdf(doc);
    if (!saved) {
      setStatus(tr("pdfCancelled"), "");
      return;
    }
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
