/**
 * Winter Trip Poll — backend
 * ------------------------------------------------------------------
 * Deploy this as a Google Apps Script Web App bound to a Google Sheet.
 * It stores one row per voter and returns every vote as JSON.
 *
 * Sheet columns (created automatically on first write):
 *   A: name        the voter's name (case-insensitive unique key)
 *   B: picks       JSON array of destination ids, best first, e.g. ["pv","oahu","cdmx"]
 *   C: updated     ISO timestamp of the last change
 *
 * SETUP
 *   1. Create a Google Sheet. Extensions > Apps Script.
 *   2. Replace the default Code.gs contents with this file. Save.
 *   3. Deploy > New deployment > type "Web app".
 *        - Description:  winter trip poll
 *        - Execute as:   Me
 *        - Who has access: Anyone
 *   4. Authorize when prompted. Copy the Web app URL (ends in /exec).
 *   5. Paste that URL into index.html as API_URL.
 *
 *   After any edit to this script you must Deploy > Manage deployments >
 *   edit the existing deployment > Version: "New version" > Deploy,
 *   otherwise the live URL keeps running the old code.
 */

var SHEET_NAME = 'Votes';

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['name', 'picks', 'updated']);
  }
  return sh;
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePicks_(v) {
  if (Array.isArray(v)) return v;
  try {
    var parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/** GET  ->  { ok: true, votes: [ { name, picks: [...] }, ... ] } */
function doGet() {
  var sh = getSheet_();
  var values = sh.getDataRange().getValues();
  var votes = [];
  for (var i = 1; i < values.length; i++) {
    var name = String(values[i][0] || '').trim();
    if (!name) continue;
    votes.push({ name: name, picks: parsePicks_(values[i][1]) });
  }
  return jsonOut_({ ok: true, votes: votes });
}

/**
 * POST body (text/plain JSON):
 *   { action: "submit", name: "Maya", picks: ["pv","oahu","cdmx"] }
 *   { action: "delete", name: "Maya" }
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = body.action || 'submit';
    var name = String(body.name || '').trim();
    if (!name) return jsonOut_({ ok: false, error: 'missing name' });

    var sh = getSheet_();
    var values = sh.getDataRange().getValues();
    var rowIndex = -1; // 1-based sheet row number
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0] || '').trim().toLowerCase() === name.toLowerCase()) {
        rowIndex = i + 1;
        break;
      }
    }

    if (action === 'delete') {
      if (rowIndex > 0) sh.deleteRow(rowIndex);
      return jsonOut_({ ok: true, deleted: true });
    }

    // submit / upsert
    var picks = Array.isArray(body.picks) ? body.picks.slice(0, 3).map(String) : [];
    var now = new Date().toISOString();
    if (rowIndex > 0) {
      sh.getRange(rowIndex, 2, 1, 2).setValues([[JSON.stringify(picks), now]]);
    } else {
      sh.appendRow([name, JSON.stringify(picks), now]);
    }
    return jsonOut_({ ok: true, saved: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
