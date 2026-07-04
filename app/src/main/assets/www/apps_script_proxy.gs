/**
 * Tort House Zakaz - Google Apps Script proxy
 * Deploy: Apps Script > Deploy > New deployment > Web app
 * Execute as: Me
 * Who has access: Anyone
 */
const SHEET_ID = 'GOOGLE_SHEET_ID_BU_YERGA';
const SHEET_NAME = 'Zakazlar';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (data.type === 'telegram') return sendTelegram_(data);
    if (data.type === 'sheet') return appendSheet_(data.order);
    return json_({ok:false, error:'Unknown type'});
  } catch (err) {
    return json_({ok:false, error:String(err)});
  }
}

function sendTelegram_(data) {
  const url = 'https://api.telegram.org/bot' + data.botToken + '/sendMessage';
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({chat_id: data.chatId, text: data.text})
  });
  const body = JSON.parse(res.getContentText());
  return json_({ok: body.ok, message_id: body.result && body.result.message_id});
}

function appendSheet_(o) {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  sh.appendRow([
    o.orderId, o.acceptedAt, o.customerName, o.customerPhone, o.source,
    o.sourceOther, o.cakeType, o.filling, o.cakeColor, o.cakeText,
    o.comment, o.price, o.prepayment, o.remaining, o.pickup,
    o.operatorName, o.branchName, o.status, o.telegramSent, o.printed
  ]);
  return json_({ok:true});
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
