/**
 * Google Apps Script backend for the mangrove survey.
 * - Bound to a Google Sheet (Extensions > Apps Script from the sheet).
 * - Writes one row per respondent in "Reponses" and one row per method in "Methodes".
 * - Saves uploaded photos/documents in a Google Drive folder (one subfolder per response)
 *   and writes the file links in the "Methodes" sheet.
 */

// ID of the Drive folder that will receive the uploaded files
// (the part after /folders/ in the folder URL).
const FOLDER_ID = 'PASTE_YOUR_DRIVE_FOLDER_ID_HERE';

const SHEET_RESP = 'Reponses';
const SHEET_METH = 'Methodes';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const meta = data.meta || {};
    const rid = String(meta.response_id || Utilities.getUuid());

    // Ignore duplicates (e.g. double click or retry after a timeout)
    if (alreadyStored_(ss, rid)) return json_({ ok: true, id: rid, duplicate: true });

    // 1) Files -> Drive
    const links = {}; // "methodIndex|field" -> [url]
    const fileList = data.files || [];
    if (fileList.length) {
      const root = DriveApp.getFolderById(FOLDER_ID);
      const org = (data.general && data.general.q3) ? ' - ' + String(data.general.q3).slice(0, 60) : '';
      const folder = root.createFolder(rid + org);
      fileList.forEach(function (f) {
        const blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.mime, 'M' + f.method_index + '_' + f.field + '_' + f.name);
        const file = folder.createFile(blob);
        const key = f.method_index + '|' + f.field;
        (links[key] = links[key] || []).push(file.getUrl());
      });
    }

    // 2) Respondent row
    const resp = Object.assign({
      response_id: rid,
      submitted_at: new Date(),
      started_at: meta.started_at || '',
      n_methods: meta.n_methods || 0,
      form_version: meta.form_version || ''
    }, data.general || {});
    appendObject_(ss, SHEET_RESP, resp);

    // 3) One row per method
    (data.methods || []).forEach(function (m) {
      const row = Object.assign({ response_id: rid, organisation: (data.general || {}).q3 || '' }, m);
      row.q79 = (links[m.method_index + '|q79'] || []).join(' | ');
      row.q83 = (links[m.method_index + '|q83'] || []).join(' | ');
      appendObject_(ss, SHEET_METH, row);
    });

    return json_({ ok: true, id: rid });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Simple check that the deployment works: open the Web App URL in a browser.
function doGet() {
  return json_({ ok: true, message: 'Mangrove survey endpoint is running.' });
}

/** Append an object as a row; new keys automatically become new columns. */
function appendObject_(ss, name, obj) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  let headers = sh.getLastColumn() > 0 ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
  const missing = Object.keys(obj).filter(function (k) { return headers.indexOf(k) === -1; });
  if (missing.length) {
    sh.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    headers = headers.concat(missing);
    sh.setFrozenRows(1);
  }
  const row = headers.map(function (h) {
    const v = obj[h];
    if (v === undefined || v === null) return '';
    // prevent formula injection ("=", "+", "-", "@" at the start of a text answer)
    if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
    return v;
  });
  sh.appendRow(row);
}

function alreadyStored_(ss, rid) {
  const sh = ss.getSheetByName(SHEET_RESP);
  if (!sh || sh.getLastRow() < 2) return false;
  const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat();
  return ids.indexOf(rid) !== -1;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to authorise Drive + Sheets access and check the folder ID. */
function testSetup() {
  const f = DriveApp.getFolderById(FOLDER_ID);
  Logger.log('Folder OK: ' + f.getName());
  Logger.log('Sheet OK: ' + SpreadsheetApp.getActiveSpreadsheet().getName());
}
