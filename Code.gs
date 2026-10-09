/**
 * ==============================================================================
 * 스마트 도서관 좌석/공간 예약 시스템 - Google Apps Script (Code.gs)
 * ==============================================================================
 * 
 * [오류 해결 안내 - 핵심!]
 * 만약 "Cannot read properties of null (reading 'getDataRange')" 오류가 떴다면:
 * 1. 아래 SPREADSHEET_ID에 구글 시트 주소를 넣거나, 구글 시트의 [확장 프로그램] > [Apps Script]에서 실행하세요.
 * 2. 코드를 붙여넣고 저장한 뒤, 반드시 [배포] > [배포 관리] > [수정(연필)] > [버전: 새 버전] > [배포]를 눌러야 적용됩니다!
 * ==============================================================================
 */

// ★ [옵션] 스프레드시트의 [확장 프로그램 > Apps Script]로 여신 경우 비워두셔도 자동 인식됩니다.
// 혹시 script.google.com에서 별도로 스크립트를 만드셨다면 구글 시트 URL이나 ID를 아래 따옴표 안에 넣어주세요!
var SPREADSHEET_ID = ""; 

// 연동된 도서관 예약 웹사이트 프론트엔드 URL
var WEB_APP_URL = "https://ais-dev-tlsr5ofu54lxonaligzk5g-70397764465.asia-northeast1.run.app";

// ==============================================================================
// 1. GET 요청 처리 (좌석 목록 / 예약 현황 / 상태 확인)
// ==============================================================================
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action ? String(params.action).trim().toLowerCase() : "";
    var date = params.date ? String(params.date).trim() : "";

    // 1-1. 좌석 목록 가져오기 (?action=getSeats)
    if (action === "getseats" || action === "seats") {
      return handleGetSeats(params);
    }

    // 1-2. 특정 날짜 예약 현황 가져오기 (?action=getReservations&date=YYYY-MM-DD)
    if (action === "getreservations" || action === "reservations") {
      return handleGetReservations(date, params);
    }

    // 1-3. API 동작 점검 (?action=check)
    if (action === "check" || action === "test") {
      return handleCheckConnection(params);
    }

    // 1-4. 브라우저에서 주소를 직접 열었을 때: 친절한 연결 점검 및 웹앱 이동 안내 페이지
    return handleBrowserView();
  } catch (globalErr) {
    return jsonResponse({
      success: false,
      message: "doGet 처리 중 예외 발생: " + globalErr.toString()
    });
  }
}

// ==============================================================================
// 2. POST 요청 처리 (예약 생성 및 취소)
// ==============================================================================
function doPost(e) {
  try {
    var ss = getSpreadsheetSafe();
    if (!ss) {
      return jsonResponse({
        success: false,
        message: "스프레드시트를 찾을 수 없습니다. SPREADSHEET_ID를 설정하거나 시트의 [확장 프로그램 > Apps Script]에서 실행해주세요."
      });
    }

    var resSheet = getReservationSheetSafe(ss);
    if (!resSheet) {
      return jsonResponse({
        success: false,
        message: "예약내역(Reservations) 시트를 생성하거나 접근할 수 없습니다."
      });
    }

    var body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        body = {};
      }
    }

    var action = body.action || (e && e.parameter && e.parameter.action) || "";

    // 예약 생성 (createReservation)
    if (action === "createReservation") {
      return handleCreateReservation(resSheet, body.data || body);
    }

    // 예약 취소 (cancelReservation)
    if (action === "cancelReservation") {
      var rId = body.reservationId || body.id || (body.data && body.data.reservationId);
      return handleCancelReservation(resSheet, rId);
    }

    return jsonResponse({
      success: false,
      message: "지원하지 않는 액션입니다: " + action
    });
  } catch (postErr) {
    return jsonResponse({
      success: false,
      message: "doPost 오류: " + postErr.toString()
    });
  }
}

// ==============================================================================
// 3. 비즈니스 로직 함수들
// ==============================================================================

/**
 * 좌석 목록 조회 (?action=getSeats)
 */
function handleGetSeats(params) {
  var ss = getSpreadsheetSafe(params);
  if (!ss) {
    return jsonResponse({
      success: false,
      message: "스프레드시트를 찾을 수 없습니다. [확장 프로그램 > Apps Script]에서 실행하시거나 코드 상단의 SPREADSHEET_ID에 구글 시트 링크를 넣어주세요."
    });
  }

  var seatSheet = getSeatSheetSafe(ss);
  if (!seatSheet) {
    return jsonResponse({
      success: false,
      message: "좌석 시트 탭을 찾을 수 없습니다. 시트 탭이 존재하는지 확인해주세요."
    });
  }

  var dataRange = seatSheet.getDataRange();
  if (!dataRange) {
    return jsonResponse({ success: true, total: 0, data: [] });
  }

  var values = dataRange.getValues();
  if (!values || values.length <= 1) {
    // 헤더만 있거나 비어있는 경우
    return jsonResponse({ success: true, total: 0, data: [] });
  }

  var seats = [];
  // 1행은 헤더(제목)이므로 2행(index 1)부터 데이터 읽기
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row && row[0] !== undefined && String(row[0]).trim() !== "") {
      var seatId = String(row[0]).trim();
      var seatName = row[1] ? String(row[1]).trim() : seatId;
      var seatType = row[2] ? String(row[2]).trim() : "Desk";
      var status = row[3] ? String(row[3]).trim() : "Available";

      seats.push({
        id: seatId,
        seatId: seatId,
        name: seatName,
        type: seatType,
        status: status
      });
    }
  }

  return jsonResponse({
    success: true,
    total: seats.length,
    sheetName: seatSheet.getName(),
    data: seats
  });
}

/**
 * 예약 현황 조회 (?action=getReservations&date=YYYY-MM-DD)
 */
function handleGetReservations(targetDate, params) {
  var ss = getSpreadsheetSafe(params);
  if (!ss) {
    return jsonResponse({ success: true, count: 0, data: [] });
  }

  var resSheet = getReservationSheetSafe(ss);
  if (!resSheet) {
    return jsonResponse({ success: true, count: 0, data: [] });
  }

  var dataRange = resSheet.getDataRange();
  if (!dataRange) {
    return jsonResponse({ success: true, count: 0, data: [] });
  }

  var values = dataRange.getValues();
  var reservations = [];

  for (var j = 1; j < values.length; j++) {
    var rRow = values[j];
    if (!rRow || !rRow[0]) continue;

    var rDate = "";
    if (rRow[4]) {
      try {
        if (rRow[4] instanceof Date) {
          rDate = Utilities.formatDate(rRow[4], Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          var dStr = String(rRow[4]).trim();
          rDate = dStr.split("T")[0];
        }
      } catch (dateErr) {
        rDate = String(rRow[4]).trim();
      }
    }

    var status = String(rRow[7] || "CONFIRMED").trim().toUpperCase();

    // 취소되지 않은 예약 중 날짜 필터링
    if (status !== "CANCELLED" && (!targetDate || rDate === targetDate)) {
      reservations.push({
        id: String(rRow[0]),
        seatId: String(rRow[1]),
        userName: String(rRow[2] || ""),
        userPhone: String(rRow[3] || ""),
        date: rDate,
        startTime: String(rRow[5] || ""),
        endTime: String(rRow[6] || ""),
        status: status
      });
    }
  }

  return jsonResponse({
    success: true,
    count: reservations.length,
    targetDate: targetDate,
    data: reservations
  });
}

/**
 * 예약 생성
 */
function handleCreateReservation(resSheet, p) {
  p = p || {};
  if (!p.seatId || !p.date || !p.startTime || !p.endTime) {
    return jsonResponse({
      success: false,
      message: "필수 정보(좌석ID, 날짜, 시작시간, 종료시간)가 누락되었습니다."
    });
  }

  // 중복 예약 방지 검사
  var existing = resSheet.getDataRange().getValues();
  var reqDate = String(p.date).trim();
  var reqStart = String(p.startTime).trim();
  var reqEnd = String(p.endTime).trim();
  var reqSeat = String(p.seatId).trim();

  for (var i = 1; i < existing.length; i++) {
    var row = existing[i];
    var rowStatus = String(row[7] || "").toUpperCase();
    if (rowStatus === "CANCELLED") continue;

    var rowSeat = String(row[1] || "").trim();
    var rowDate = "";
    if (row[4] instanceof Date) {
      rowDate = Utilities.formatDate(row[4], Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      rowDate = String(row[4] || "").split("T")[0].trim();
    }

    if (rowSeat === reqSeat && rowDate === reqDate) {
      var rowStart = String(row[5] || "").trim();
      var rowEnd = String(row[6] || "").trim();
      // 시간 겹침 체크: start < rowEnd && end > rowStart
      if (reqStart < rowEnd && reqEnd > rowStart) {
        return jsonResponse({
          success: false,
          message: "선택하신 시간대에 이미 다른 예약(" + rowStart + "~" + rowEnd + ")이 존재합니다."
        });
      }
    }
  }

  // 예약 고유 ID 생성 (예: RES_20261010_S01_5821)
  var cleanDate = reqDate.replace(/-/g, "");
  var randNum = Math.floor(1000 + Math.random() * 9000);
  var resId = "RES_" + cleanDate + "_" + reqSeat + "_" + randNum;

  resSheet.appendRow([
    resId,
    reqSeat,
    p.userName || "",
    p.userPhone || "",
    reqDate,
    reqStart,
    reqEnd,
    "CONFIRMED",
    new Date()
  ]);

  return jsonResponse({
    success: true,
    reservationId: resId,
    message: "예약이 성공적으로 완료되었습니다.",
    data: {
      id: resId,
      seatId: reqSeat,
      userName: p.userName,
      userPhone: p.userPhone,
      date: reqDate,
      startTime: reqStart,
      endTime: reqEnd,
      status: "CONFIRMED"
    }
  });
}

/**
 * 예약 취소
 */
function handleCancelReservation(resSheet, reservationId) {
  if (!reservationId) {
    return jsonResponse({ success: false, message: "예약 번호가 전달되지 않았습니다." });
  }

  var data = resSheet.getDataRange().getValues();
  for (var k = 1; k < data.length; k++) {
    if (String(data[k][0]).trim() === String(reservationId).trim()) {
      resSheet.getRange(k + 1, 8).setValue("CANCELLED");
      return jsonResponse({
        success: true,
        message: "예약(" + reservationId + ")이 정상적으로 취소되었습니다."
      });
    }
  }

  return jsonResponse({
    success: false,
    message: "해당 예약 번호(" + reservationId + ")를 찾을 수 없습니다."
  });
}

/**
 * 연결 상태 진단 (?action=check)
 */
function handleCheckConnection(params) {
  var ss = getSpreadsheetSafe(params);
  if (!ss) {
    return jsonResponse({
      success: false,
      connected: false,
      message: "스프레드시트를 찾을 수 없습니다."
    });
  }

  var seatSheet = getSeatSheetSafe(ss);
  var resSheet = getReservationSheetSafe(ss);

  var seatCount = 0;
  if (seatSheet) {
    var values = seatSheet.getDataRange().getValues();
    seatCount = Math.max(0, values.length - 1);
  }

  return jsonResponse({
    success: true,
    connected: true,
    spreadsheetName: ss.getName(),
    seatSheetName: seatSheet ? seatSheet.getName() : "없음",
    seatCount: seatCount,
    reservationSheetReady: !!resSheet,
    timestamp: new Date().toISOString()
  });
}

// ==============================================================================
// 4. 안전한 스프레드시트 및 시트 탐색 유틸리티 (Null 에러 원천 차단)
// ==============================================================================

/**
 * 스프레드시트 안전하게 가져오기
 * 1. 현재 바인딩된 활성 시트 시도
 * 2. 코드 상단 SPREADSHEET_ID 시도
 * 3. URL 파라미터 sheetId / spreadsheetId 시도
 */
function getSpreadsheetSafe(params) {
  // 1. 컨테이너에 바인딩된 스프레드시트 우선 (확장 프로그램 > Apps Script로 연 경우)
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) return activeSs;
  } catch (eActive) {}

  // 2. URL 파라미터로 전달된 sheetId가 있는 경우
  if (params && (params.sheetId || params.spreadsheetId)) {
    try {
      var pId = String(params.sheetId || params.spreadsheetId).trim();
      if (pId.indexOf("http") === 0) {
        return SpreadsheetApp.openByUrl(pId);
      }
      return SpreadsheetApp.openById(pId);
    } catch (eParam) {}
  }

  // 3. 코드 상단 전역 변수 SPREADSHEET_ID가 설정된 경우
  if (SPREADSHEET_ID && typeof SPREADSHEET_ID === "string" && SPREADSHEET_ID.trim() !== "") {
    try {
      var cleanId = SPREADSHEET_ID.trim();
      if (cleanId.indexOf("http") === 0) {
        return SpreadsheetApp.openByUrl(cleanId);
      }
      return SpreadsheetApp.openById(cleanId);
    } catch (eId) {}
  }

  return null;
}

/**
 * 좌석 시트 탭 안전하게 찾기
 * '시트1', 'Seats', 'Sheet1', '좌석' 등 모든 이름 인식
 * 없으면 'Reservations'가 아닌 첫 번째 시트를 자동 반환
 */
function getSeatSheetSafe(ss) {
  if (!ss) return null;
  var sheets = ss.getSheets();
  if (!sheets || sheets.length === 0) return null;

  // 1차: 자주 쓰이는 이름 매칭
  var targetNames = ["시트1", "seats", "sheet1", "좌석", "seat", "열람석"];
  for (var i = 0; i < sheets.length; i++) {
    var nameLower = sheets[i].getName().trim().toLowerCase();
    for (var t = 0; t < targetNames.length; t++) {
      if (nameLower === targetNames[t]) {
        return sheets[i];
      }
    }
  }

  // 2차: 'Reservations'나 '예약'이 아닌 첫 번째 시트 찾기
  for (var j = 0; j < sheets.length; j++) {
    var sName = sheets[j].getName().trim().toLowerCase();
    if (sName !== "reservations" && sName !== "예약내역" && sName !== "예약") {
      return sheets[j];
    }
  }

  // 3차: 첫 번째 시트 반환
  return sheets[0];
}

/**
 * 예약 내역 시트 안전하게 찾거나 자동 생성
 */
function getReservationSheetSafe(ss) {
  if (!ss) return null;

  var res = ss.getSheetByName("Reservations") || ss.getSheetByName("예약내역");
  if (!res) {
    try {
      res = ss.insertSheet("Reservations");
      res.appendRow([
        "id",
        "seatId",
        "userName",
        "userPhone",
        "date",
        "startTime",
        "endTime",
        "status",
        "createdAt"
      ]);
      // 헤더 스타일 적용
      var headerRange = res.getRange("A1:I1");
      headerRange.setBackground("#0f172a");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
    } catch (insertErr) {
      // 권한 등으로 생성 실패 시 첫 번째 시트 뒤에 탐색
      var all = ss.getSheets();
      if (all.length > 1) return all[1];
      return all[0];
    }
  }
  return res;
}

/**
 * JSON 응답 생성기
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 브라우저 주소창 직접 접속 시 안내 화면
 */
function handleBrowserView() {
  var ss = getSpreadsheetSafe();
  var statusBadge = ss
    ? '<span style="background:#dcfce7;color:#166534;padding:4px 10px;border-radius:20px;font-weight:bold;font-size:12px;">✅ 스프레드시트 연결 완료</span>'
    : '<span style="background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:20px;font-weight:bold;font-size:12px;">⚠️ SPREADSHEET_ID 설정 필요</span>';

  var html = '<!DOCTYPE html>' +
    '<html lang="ko"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>도서관 좌석 예약 API 백엔드 상태</title>' +
    '<style>' +
    '  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#f8fafc; color:#1e293b; padding:16px; }' +
    '  .card { background:white; padding:36px; border-radius:24px; box-shadow:0 10px 30px rgba(0,0,0,0.06); border:1px solid #e2e8f0; max-width:480px; width:100%; text-align:center; }' +
    '  .icon { font-size:42px; margin-bottom:12px; }' +
    '  h1 { font-size:20px; margin:0 0 8px; color:#0f172a; }' +
    '  p { font-size:14px; color:#64748b; margin:0 0 20px; line-height:1.6; }' +
    '  .box { background:#f1f5f9; padding:16px; border-radius:12px; margin-bottom:24px; text-align:left; font-size:13px; }' +
    '  .btn { display:inline-block; width:100%; box-sizing:border-box; padding:14px; background:#0f172a; color:white; border-radius:14px; text-decoration:none; font-weight:bold; font-size:15px; transition:0.2s; }' +
    '  .btn:hover { background:#1e293b; }' +
    '</style>' +
    '</head><body>' +
    '<div class="card">' +
    '  <div class="icon">📚</div>' +
    '  <h1>스마트 도서관 예약 백엔드</h1>' +
    '  <p>' + statusBadge + '<br><br>Google Apps Script API 서비스가 정상 작동 중입니다.</p>' +
    '  <div class="box">' +
    '    <strong>💡 지원 API 엔드포인트:</strong><br>' +
    '    • 좌석 조회: <code>?action=getSeats</code><br>' +
    '    • 예약 현황: <code>?action=getReservations&date=YYYY-MM-DD</code><br>' +
    '    • 연결 진단: <code>?action=check</code>' +
    '  </div>' +
    '  <a class="btn" href="' + WEB_APP_URL + '">도서관 예약 웹사이트 열기 &rarr;</a>' +
    '</div>' +
    '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle("스마트 도서관 좌석/공간 예약 백엔드")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
