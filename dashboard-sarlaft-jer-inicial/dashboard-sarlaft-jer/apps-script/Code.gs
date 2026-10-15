/**
 * API de lectura para el dashboard SARLAFT JER.
 * IMPORTANTE: revisa el README antes de desplegar. La salida JSONP puede ser leída
 * por cualquier persona que conozca la URL si el Web App se publica para "Cualquiera".
 */
const SPREADSHEET_ID = 'PEGA_AQUI_EL_ID_DE_GOOGLE_SHEETS';
const HEADER_ROW_OVERRIDES = {
  'ROI': 2,
  'BENEFICIARIOS FINALES': 2
};

// Lista de hojas usadas por el informe; los nombres respetan espacios originales.
const ALLOWED_SHEETS = [
  'N. GIROS ENV BOY', ' N. GIROS ENV AMZ', 'TOTAL N GIROS ENV JER',
  'N. P GIROS ENV. BOY', 'N. P GIROS ENV. AMZ', 'TOTAL N. P GIROS ENV. JER',
  'TOTALES GIROS ENV. BOY', 'TOTALES GIROS ENV. AMZ', 'TOTALES GIROS ENV. JER',
  'N. GIROS PAG. BOY', 'N. GIROS PAG. AMZ', 'TOTAL N. GIROS PAG. JER',
  'N. PER GIROS PAG. BOY', 'N. PER GIROS PAG. AMZ', 'TOTAL N. PER GIROS PAG. JER',
  'TOTAL GIROS PAG. BOY', 'TOTAL GIROS PAG. AMZ', 'TOTAL GIROS PAG. JER',
  'CANT PREMIOS CHANCE BOY', 'CANT PREMIOS CHANCE AMZ', 'TOTAL N PREMIOS CHANCE JER',
  'N. PERSONAS PREMIOS CHANCE BOY', 'N. PERSONAS PREMIOS CHANCE AMZ', 'TOTAL N. PERSONAS PREMIOS CHANC',
  ' MONTOS TOTALES PREMIOS CHANCE ', 'MONTOS TOTALES PREMIOS CHANCE A', 'MONTOS TOTALES PREMIOS CHANCE J',
  'CANT. INSTANT-BOY', 'CANT. INSTANT AMZ', 'CANT. INSTANT JER',
  'N. PERSONAS INSTANT BOY.', 'N. PERSONAS INSTANT AMZ.', 'TOTAL PERSONAS INST JER',
  'MONTOS INSTANT. BOY', 'MONTOS INSTANT. AMZ', 'MONTOS INST. JER',
  'CANT RECARGAS BETPLAY BOY', 'CANT RECARGAS BETPLAY AMZ', 'CANT RECARGAS BETPLAY JER',
  'N PERSONAS RECARGAS BOY', 'N PERSONAS RECARGAS AMZ', 'N PERSONAS RECARGAS JER',
  'MONTOS RECARGAS BOY', 'MONTOS RECARGAS AMZ', ' MONTOS RECARGAS JER',
  'CANT RETIROS BETPLAY BOY', 'CANT RETIROS BETPLAY AMZ', 'CANT RETIROS BETPLAY JER',
  'N PERSONAS RETIROS BOY', 'N PERSONAS RETIROS AMZ', 'N PERSONAS RETIROS JER',
  'MONTOS RETIROS BOY', 'MONTOS RETIROS AMZ', 'MONTOS RETIROS JER',
  'ROS', 'ROI', 'CNJSA', 'DEBIDA DILIGENCIA', 'PEP EXT', 'CAPACITACIONES', 'INDUCCIONES',
  'BENEFICIARIOS FINALES', 'formacion oc', 'otras act', 'REUNIONES', 'CAPACITACIONES JER', 'cursos'
];


// Hojas que aparecen realmente en las páginas del informe. Las otras pestañas
// históricas/totales se usan, cuando aplica, para detectar años, pero no se envían
// al navegador porque no forman parte de esta versión del reporte.
const VISIBLE_SHEETS = [
  'N. GIROS ENV BOY', 'N. P GIROS ENV. BOY', 'TOTALES GIROS ENV. BOY',
  'N. GIROS PAG. BOY', 'N. PER GIROS PAG. BOY', 'TOTAL GIROS PAG. BOY',
  ' N. GIROS ENV AMZ', 'N. P GIROS ENV. AMZ', 'TOTALES GIROS ENV. AMZ',
  'N. GIROS PAG. AMZ', 'N. PER GIROS PAG. AMZ', 'TOTAL GIROS PAG. AMZ',
  'CANT RECARGAS BETPLAY BOY', 'N PERSONAS RECARGAS BOY', 'MONTOS RECARGAS BOY',
  'CANT RETIROS BETPLAY BOY', 'N PERSONAS RETIROS BOY', 'MONTOS RETIROS BOY',
  'CANT RECARGAS BETPLAY AMZ', 'N PERSONAS RECARGAS AMZ', 'MONTOS RECARGAS AMZ',
  'CANT RETIROS BETPLAY AMZ', 'N PERSONAS RETIROS AMZ', 'MONTOS RETIROS AMZ',
  'CANT PREMIOS CHANCE BOY', 'N. PERSONAS PREMIOS CHANCE BOY',
  ' MONTOS TOTALES PREMIOS CHANCE ', 'CANT. INSTANT-BOY',
  'N. PERSONAS INSTANT BOY.', 'MONTOS INSTANT. BOY',
  'CANT PREMIOS CHANCE AMZ', 'N. PERSONAS PREMIOS CHANCE AMZ',
  'MONTOS TOTALES PREMIOS CHANCE A', 'CANT. INSTANT AMZ',
  'N. PERSONAS INSTANT AMZ.', 'MONTOS INSTANT. AMZ',
  'ROS', 'ROI', 'CNJSA', 'DEBIDA DILIGENCIA', 'PEP EXT',
  'CAPACITACIONES', 'INDUCCIONES', 'formacion oc', 'CAPACITACIONES JER', 'otras act', 'REUNIONES'
];

const MONTHS = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

function doGet(e) {
  const params = (e && e.parameter) || {};
  let response;
  try {
    if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf('PEGA_AQUI') === 0) {
      throw new Error('Configura SPREADSHEET_ID en Code.gs antes de desplegar.');
    }
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const all = readAllAllowedSheets_(spreadsheet);
    const availableYears = all.availableYears;
    const requestedYear = Number(params.year);
    const year = requestedYear && availableYears.indexOf(requestedYear) >= 0
      ? requestedYear
      : (availableYears.length ? availableYears[availableYears.length - 1] : new Date().getFullYear());
    const requestedMonth = normalize_(params.month || 'ALL');
    const month = requestedMonth === 'ALL' || MONTHS.indexOf(requestedMonth) < 0 ? 'ALL' : requestedMonth;
    const datasets = {};

    VISIBLE_SHEETS.forEach(function (sheetName) {
      const source = all.datasets[sheetName];
      if (!source) return;
      const yearIndex = findHeaderIndex_(source.headers, ['ANO', 'YEAR']);
      const monthIndex = findHeaderIndex_(source.headers, ['MES']);
      const filteredRows = source.rows.filter(function (row) {
        if (yearIndex >= 0 && Number(row[yearIndex]) !== year) return false;
        if (month !== 'ALL' && monthIndex >= 0 && normalize_(row[monthIndex]) !== month) return false;
        return true;
      });
      // Fuerza el orden enero-diciembre para que un dato pegado fuera de orden
      // no cambie el eje horizontal de las gráficas. V8 conserva el orden relativo
      // de registros que pertenecen al mismo mes.
      if (monthIndex >= 0) {
        filteredRows.sort(function (a, b) {
          const monthA = MONTHS.indexOf(normalize_(a[monthIndex]));
          const monthB = MONTHS.indexOf(normalize_(b[monthIndex]));
          if (monthA < 0 || monthB < 0) return 0;
          return monthA - monthB;
        });
      }
      datasets[sheetName] = { name: sheetName, headers: source.headers, rows: filteredRows };
    });

    response = {
      ok: true,
      year: year,
      month: month,
      monthLabel: month === 'ALL' ? 'TODOS LOS MESES' : titleCase_(month),
      availableYears: availableYears,
      datasets: datasets,
      warnings: all.warnings
    };
  } catch (error) {
    response = { ok: false, error: error && error.message ? error.message : String(error) };
  }
  return output_(response, params.callback);
}

function readAllAllowedSheets_(spreadsheet) {
  const datasets = {};
  const warnings = [];
  const years = {};
  const sourceNames = Array.from(new Set(ALLOWED_SHEETS.slice(0, 54).concat(VISIBLE_SHEETS)));
  sourceNames.forEach(function (sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      warnings.push('No existe la pestaña: ' + sheetName);
      return;
    }
    const values = sheet.getDataRange().getValues();
    const headerRow = HEADER_ROW_OVERRIDES[sheetName] || 1;
    if (!values || values.length < headerRow) {
      warnings.push('La pestaña está vacía: ' + sheetName);
      return;
    }
    const headers = values[headerRow - 1].map(function (value) { return String(value == null ? '' : value).trim(); });
    const rows = values.slice(headerRow).filter(function (row) {
      return row.some(function (value) { return value !== '' && value !== null; });
    }).map(function (row) { return row.map(cleanValue_); });
    const yearIndex = findHeaderIndex_(headers, ['ANO', 'YEAR']);
    // El selector anual sigue las pestañas de monitoreo (primeros 54 nombres),
    // cuyo período útil comienza en 2026. Las pestañas históricas de detalle
    // pueden contener 2024/2025, pero no tienen series de monitoreo para esos años.
    const isMonitoringSource = ALLOWED_SHEETS.slice(0, 54).indexOf(sheetName) >= 0;
    if (yearIndex >= 0 && isMonitoringSource) {
      rows.forEach(function (row) {
        const numericYear = Number(row[yearIndex]);
        if (numericYear && numericYear >= 2000 && numericYear <= 2200) years[numericYear] = true;
      });
    }
    datasets[sheetName] = { name: sheetName, headers: headers, rows: rows };
  });
  return { datasets: datasets, warnings: warnings, availableYears: Object.keys(years).map(Number).sort(function (a, b) { return a - b; }) };
}

function output_(payload, callback) {
  const json = JSON.stringify(payload);
  // Se valida el nombre para no permitir insertar código arbitrario como callback.
  if (callback && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function cleanValue_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (value === '' || value === undefined) return null;
  return value;
}

function normalize_(value) {
  return String(value == null ? '' : value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toUpperCase().replace(/\s+/g, ' ');
}

function findHeaderIndex_(headers, choices) {
  const normalized = headers.map(normalize_);
  for (let i = 0; i < choices.length; i++) {
    const index = normalized.indexOf(normalize_(choices[i]));
    if (index >= 0) return index;
  }
  return -1;
}

function titleCase_(text) {
  return String(text).toLowerCase().replace(/^./, function (first) { return first.toUpperCase(); });
}

/** Ejecuta esta función desde el editor para comprobar el ID y las pestañas. */
function probarConexion() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf('PEGA_AQUI') === 0) {
    throw new Error('Primero pega el ID real de Google Sheets en SPREADSHEET_ID.');
  }
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const result = readAllAllowedSheets_(spreadsheet);
  Logger.log('Libro: %s', spreadsheet.getName());
  Logger.log('Años encontrados: %s', JSON.stringify(result.availableYears));
  Logger.log('Hojas leídas por el servicio: %s', Object.keys(result.datasets).length);
  Logger.log('Advertencias: %s', JSON.stringify(result.warnings));
}
