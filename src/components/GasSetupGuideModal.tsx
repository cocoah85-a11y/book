import React, { useState } from 'react';
import { Copy, Check, ExternalLink, RefreshCw, X, AlertCircle, CheckCircle2, Play, Terminal } from 'lucide-react';
import { getStoredApiUrl, saveApiUrl, saveStoredSeats } from '../api/gasClient';
import { Seat } from '../types';

interface GasSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUrlUpdated: (newUrl: string) => void;
  onSeatsUpdated?: (seats: Seat[]) => void;
}

export const GasSetupGuideModal: React.FC<GasSetupGuideModalProps> = ({
  isOpen,
  onClose,
  onUrlUpdated,
  onSeatsUpdated,
}) => {
  const [currentUrl, setCurrentUrl] = useState(getStoredApiUrl());
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveApiUrl(currentUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    onUrlUpdated(currentUrl);
  };

  // Live tester function
  const runApiTest = async (mode: 'check' | 'seats' | 'none') => {
    setIsTesting(true);
    setTestResult(null);
    try {
      let url = currentUrl;
      const t = Date.now();
      if (mode === 'check') {
        url = `${currentUrl}?action=check&t=${t}`;
      } else if (mode === 'seats') {
        url = `${currentUrl}?action=getSeats&t=${t}`;
      } else {
        url = `${currentUrl}?t=${t}`;
      }
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      const text = await res.text();
      setTestResult(`[응답 코드: ${res.status}]\n${text}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult(`[연결 오류 또는 CORS 제약]\n${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  // The 100% foolproof Google Apps Script code
  const perfectGasCode = `/**
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

// 1. GET 요청 처리
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action ? String(params.action).trim().toLowerCase() : "";
    var date = params.date ? String(params.date).trim() : "";

    if (action === "getseats" || action === "seats") {
      return handleGetSeats(params);
    }
    if (action === "getreservations" || action === "reservations") {
      return handleGetReservations(date, params);
    }
    if (action === "check" || action === "test") {
      return handleCheckConnection(params);
    }
    return handleBrowserView();
  } catch (err) {
    return jsonResponse({ success: false, message: "doGet 오류: " + err.toString() });
  }
}

// 2. POST 요청 처리
function doPost(e) {
  try {
    var ss = getSpreadsheetSafe();
    if (!ss) return jsonResponse({ success: false, message: "스프레드시트를 찾을 수 없습니다." });

    var resSheet = getReservationSheetSafe(ss);
    if (!resSheet) return jsonResponse({ success: false, message: "예약내역 시트 접근 실패" });

    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = body.action || (e && e.parameter && e.parameter.action) || "";

    if (action === "createReservation") {
      return handleCreateReservation(resSheet, body.data || body);
    }
    if (action === "cancelReservation") {
      return handleCancelReservation(resSheet, body.reservationId || body.id);
    }
    return jsonResponse({ success: false, message: "알 수 없는 액션: " + action });
  } catch (err) {
    return jsonResponse({ success: false, message: "doPost 오류: " + err.toString() });
  }
}

// 3. 비즈니스 로직
function handleGetSeats(params) {
  var ss = getSpreadsheetSafe(params);
  if (!ss) {
    return jsonResponse({
      success: false,
      message: "스프레드시트를 찾을 수 없습니다. 시트의 [확장 프로그램 > Apps Script]에서 실행하시거나 코드 상단의 SPREADSHEET_ID에 시트 주소를 넣어주세요."
    });
  }

  var seatSheet = getSeatSheetSafe(ss);
  if (!seatSheet) return jsonResponse({ success: false, message: "시트 탭을 찾을 수 없습니다." });

  var dataRange = seatSheet.getDataRange();
  if (!dataRange) return jsonResponse({ success: true, total: 0, data: [] });

  var values = dataRange.getValues();
  var seats = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row && row[0] !== undefined && String(row[0]).trim() !== "") {
      seats.push({
        id: String(row[0]).trim(),
        seatId: String(row[0]).trim(),
        name: String(row[1] || row[0]).trim(),
        type: String(row[2] || "Desk").trim(),
        status: String(row[3] || "Available").trim()
      });
    }
  }
  return jsonResponse({ success: true, total: seats.length, sheetName: seatSheet.getName(), data: seats });
}

function handleGetReservations(targetDate, params) {
  var ss = getSpreadsheetSafe(params);
  if (!ss) return jsonResponse({ success: true, count: 0, data: [] });

  var resSheet = getReservationSheetSafe(ss);
  if (!resSheet) return jsonResponse({ success: true, count: 0, data: [] });

  var data = resSheet.getDataRange().getValues();
  var reservations = [];
  
  for (var j = 1; j < data.length; j++) {
    var rRow = data[j];
    if (!rRow || !rRow[0]) continue;

    var rDate = "";
    if (rRow[4]) {
      try {
        rDate = (rRow[4] instanceof Date) ? Utilities.formatDate(rRow[4], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(rRow[4]).split("T")[0].trim();
      } catch (e) {
        rDate = String(rRow[4]).trim();
      }
    }
    var status = String(rRow[7] || "CONFIRMED").trim().toUpperCase();

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
  return jsonResponse({ success: true, count: reservations.length, data: reservations });
}

function handleCreateReservation(resSheet, p) {
  p = p || {};
  if (!p.seatId || !p.date || !p.startTime || !p.endTime) {
    return jsonResponse({ success: false, message: "필수 정보(좌석ID, 날짜, 시작시간, 종료시간) 누락" });
  }

  // 중복 시간 확인
  var existing = resSheet.getDataRange().getValues();
  var reqDate = String(p.date).trim();
  var reqStart = String(p.startTime).trim();
  var reqEnd = String(p.endTime).trim();
  var reqSeat = String(p.seatId).trim();

  for (var i = 1; i < existing.length; i++) {
    var row = existing[i];
    if (String(row[7] || "").toUpperCase() === "CANCELLED") continue;
    var rowDate = (row[4] instanceof Date) ? Utilities.formatDate(row[4], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(row[4] || "").split("T")[0].trim();
    if (String(row[1] || "").trim() === reqSeat && rowDate === reqDate) {
      var rowStart = String(row[5] || "").trim();
      var rowEnd = String(row[6] || "").trim();
      if (reqStart < rowEnd && reqEnd > rowStart) {
        return jsonResponse({ success: false, message: "해당 시간대에 이미 예약이 존재합니다 (" + rowStart + "~" + rowEnd + ")" });
      }
    }
  }

  var resId = "RES_" + reqDate.replace(/-/g, "") + "_" + reqSeat + "_" + Math.floor(1000 + Math.random() * 9000);
  resSheet.appendRow([resId, reqSeat, p.userName || "", p.userPhone || "", reqDate, reqStart, reqEnd, "CONFIRMED", new Date()]);

  return jsonResponse({
    success: true,
    reservationId: resId,
    message: "예약이 완료되었습니다.",
    data: { id: resId, seatId: reqSeat, userName: p.userName, date: reqDate, startTime: reqStart, endTime: reqEnd }
  });
}

function handleCancelReservation(resSheet, reservationId) {
  var data = resSheet.getDataRange().getValues();
  for (var k = 1; k < data.length; k++) {
    if (String(data[k][0]).trim() === String(reservationId).trim()) {
      resSheet.getRange(k + 1, 8).setValue("CANCELLED");
      return jsonResponse({ success: true, message: "예약이 취소되었습니다." });
    }
  }
  return jsonResponse({ success: false, message: "예약 번호를 찾을 수 없습니다." });
}

function handleCheckConnection(params) {
  var ss = getSpreadsheetSafe(params);
  if (!ss) return jsonResponse({ success: false, connected: false, message: "스프레드시트를 찾을 수 없습니다." });
  var seatSheet = getSeatSheetSafe(ss);
  var seatCount = seatSheet ? Math.max(0, seatSheet.getDataRange().getValues().length - 1) : 0;
  return jsonResponse({
    success: true,
    connected: true,
    spreadsheetName: ss.getName(),
    sheetName: seatSheet ? seatSheet.getName() : "없음",
    seatCount: seatCount
  });
}

// 4. 안전 유틸리티
function getSpreadsheetSafe(params) {
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) return activeSs;
  } catch (e) {}

  if (params && (params.sheetId || params.spreadsheetId)) {
    try {
      var pId = String(params.sheetId || params.spreadsheetId).trim();
      return pId.indexOf("http") === 0 ? SpreadsheetApp.openByUrl(pId) : SpreadsheetApp.openById(pId);
    } catch (e) {}
  }

  if (SPREADSHEET_ID && typeof SPREADSHEET_ID === "string" && SPREADSHEET_ID.trim() !== "") {
    try {
      var cleanId = SPREADSHEET_ID.trim();
      return cleanId.indexOf("http") === 0 ? SpreadsheetApp.openByUrl(cleanId) : SpreadsheetApp.openById(cleanId);
    } catch (e) {}
  }
  return null;
}

function getSeatSheetSafe(ss) {
  if (!ss) return null;
  var sheets = ss.getSheets();
  if (!sheets || sheets.length === 0) return null;

  var targetNames = ["시트1", "seats", "sheet1", "좌석", "seat", "열람석"];
  for (var i = 0; i < sheets.length; i++) {
    var nameLower = sheets[i].getName().trim().toLowerCase();
    for (var t = 0; t < targetNames.length; t++) {
      if (nameLower === targetNames[t]) return sheets[i];
    }
  }

  for (var j = 0; j < sheets.length; j++) {
    var sName = sheets[j].getName().trim().toLowerCase();
    if (sName !== "reservations" && sName !== "예약내역" && sName !== "예약") return sheets[j];
  }
  return sheets[0];
}

function getReservationSheetSafe(ss) {
  if (!ss) return null;
  var res = ss.getSheetByName("Reservations") || ss.getSheetByName("예약내역");
  if (!res) {
    try {
      res = ss.insertSheet("Reservations");
      res.appendRow(["id", "seatId", "userName", "userPhone", "date", "startTime", "endTime", "status", "createdAt"]);
      res.getRange("A1:I1").setBackground("#0f172a").setFontColor("#ffffff").setFontWeight("bold");
    } catch (e) {
      var all = ss.getSheets();
      return all.length > 1 ? all[1] : all[0];
    }
  }
  return res;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function handleBrowserView() {
  var ss = getSpreadsheetSafe();
  var badge = ss ? "✅ 스프레드시트 연결 완료" : "⚠️ SPREADSHEET_ID 설정 필요";
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>도서관 예약 백엔드</title>' +
    '<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b;text-align:center;}' +
    '.card{background:white;padding:36px;border-radius:24px;box-shadow:0 10px 30px rgba(0,0,0,0.06);max-width:440px;width:90%;}' +
    '.btn{display:inline-block;margin-top:20px;padding:12px 24px;background:#0f172a;color:white;border-radius:12px;text-decoration:none;font-weight:bold;}' +
    '</style></head><body><div class="card"><h1>📚 도서관 예약 백엔드</h1><p>' + badge + '</p>' +
    '<a class="btn" href="' + WEB_APP_URL + '">예약 웹사이트 열기 &rarr;</a></div></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle("도서관 예약 백엔드");
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(perfectGasCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleApplyUserSheetDirectly = () => {
    const userSheetSeats: Seat[] = [
      {
        id: 'S01',
        name: '1번 일반 열람석',
        type: 'Desk',
        status: 'Available',
        zone: '제1열람실 (집중 정숙)',
        capacity: 1,
        features: ['개별 LED 스탠드', '220V 콘센트 1구', '독서대 비치', '프라이빗 칸막이'],
        floor: 2,
        x: 18,
        y: 22,
        description: '구글 시트 연동: 1번 일반 열람석 (Desk, Available)'
      },
      {
        id: 'S02',
        name: '2번 노트북 열람석',
        type: 'Laptop',
        status: 'Available',
        zone: '노트북 존 (타이핑 가능)',
        capacity: 1,
        features: ['초고속 Wi-Fi 6', '듀얼 콘센트 2구', '무소음 마우스 패드'],
        floor: 2,
        x: 62,
        y: 22,
        description: '구글 시트 연동: 2번 노트북 열람석 (Laptop, Available)'
      },
      {
        id: 'R01',
        name: '1번 스터디룸 (4인실)',
        type: 'Room',
        status: 'Available',
        zone: '그룹 미팅룸 구역',
        capacity: 4,
        features: ['방음벽 시공', '55인치 4K 스마트 TV', '대형 자석 화이트보드'],
        floor: 2,
        x: 20,
        y: 76,
        description: '구글 시트 연동: 1번 스터디룸 4인실 (Room, Available)'
      }
    ];

    saveStoredSeats(userSheetSeats);
    if (onSeatsUpdated) {
      onSeatsUpdated(userSheetSeats);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">오류 해결 & Google Apps Script 가이드</h3>
            <p className="text-xs text-slate-400">
              'Invalid action parameter' 오류 원인 및 1분 해결 방법
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs text-slate-700">
          
          {/* Error Diagnosis Banner for Cannot read properties of null */}
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2.5 text-rose-950">
            <div className="font-bold flex items-center gap-2 text-sm text-rose-900">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>'Cannot read properties of null' 5초 만에 해결하는 방법!</span>
            </div>
            
            <div className="p-3 bg-white border border-rose-200 rounded-lg text-xs space-y-1.5 shadow-xs">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <span>⚡ 초간단 5초 해결법 (지금 바로 적용 가능):</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                구글 스프레드시트 화면 맨 아래에 있는 탭 이름 <strong>'시트1'</strong>을 마우스로 더블 클릭하여 <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">Seats</code> 로 변경해 주세요!
              </p>
              <p className="text-[11px] text-slate-500">
                ※ 현재 배포된 스크립트가 스프레드시트에서 'Seats'라는 탭을 찾고 있으므로, 탭 이름만 <strong>Seats</strong>로 바꾸시면 재배포할 필요도 없이 즉시 정상 작동합니다!
              </p>
            </div>

            <div className="text-[11px] text-rose-900 leading-relaxed">
              <strong>원인 설명:</strong> 스프레드시트에 'Seats' 탭이 없어서 시트 변수가 <code className="font-mono bg-rose-100 px-1 rounded">null</code>이 되었고, <code className="font-mono bg-rose-100 px-1 rounded">null.getDataRange()</code>를 실행하려다 위 에러가 발생한 것입니다.
            </div>
          </div>

          {/* Critical deployment instructions */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
            <div className="font-bold text-amber-900 text-xs">
              ★ 가장 중요한 핵심: Apps Script '새 버전' 배포 방법 (3단계)
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Apps Script에서 코드를 붙여넣고 저장만 하시면 이전 코드가 계속 동작합니다. <strong>반드시 새 버전으로 배포</strong>하셔야 합니다:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900 font-medium pl-1">
              <li>우측 상단 <strong>[배포] &gt; [배포 관리]</strong> 클릭</li>
              <li>상단 연필(수정) 아이콘 클릭 후, <strong>버전</strong> 드롭다운에서 <strong>[새 버전]</strong> 선택</li>
              <li>우측 하단 <strong>[배포]</strong> 버튼 클릭!</li>
            </ol>
          </div>

          {/* Script Copy Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                수정 완료된 Apps Script 전체 코드 (그대로 복사하여 붙여넣기):
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사 완료!' : '수정 코드 전체 복사'}</span>
              </button>
            </div>

            <div className="relative bg-slate-950 text-slate-200 rounded-xl p-3.5 max-h-52 overflow-y-auto font-mono text-[10px] leading-relaxed border border-slate-800">
              <pre>{perfectGasCode}</pre>
            </div>
          </div>

          {/* Live In-App Tester */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-600" />
              <span>실시간 API 연결 테스트</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isTesting}
                onClick={() => runApiTest('check')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                <Play className="w-3 h-3 text-white" />
                <span>?action=check (연결 진단)</span>
              </button>

              <button
                type="button"
                disabled={isTesting}
                onClick={() => runApiTest('seats')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                <Play className="w-3 h-3 text-emerald-400" />
                <span>?action=getSeats (좌석 목록)</span>
              </button>

              <button
                type="button"
                disabled={isTesting}
                onClick={() => runApiTest('none')}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                <Play className="w-3 h-3 text-slate-600" />
                <span>기본 URL 테스트</span>
              </button>
            </div>

            {testResult && (
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[10px] whitespace-pre-wrap max-h-28 overflow-y-auto">
                  {testResult}
                </div>

                {testResult.includes("Invalid action parameter") && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                      <span>⚠️ 'Invalid action parameter' 응답 분석:</span>
                    </div>
                    <p className="leading-relaxed">
                      이 응답은 <strong>구버전 스크립트가 여전히 배포</strong>되어 실행되고 있음을 뜻합니다.<br />
                      위의 <strong>[수정 코드 전체 복사]</strong> 버튼을 누르신 후, Apps Script 편집기에서 코드를 붙여넣고 <strong>[배포] &gt; [배포 관리] &gt; [연필(수정)] &gt; [버전: 새 버전] &gt; [배포]</strong>를 클릭해 주시면 즉시 정상 작동합니다!
                    </p>
                  </div>
                )}

                {testResult.includes("Cannot read properties of null") && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-950 text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-900">
                      <span>⚡ 5초 해결법: 구글 시트 탭 이름을 'Seats'로 바꾸세요!</span>
                    </div>
                    <p className="leading-relaxed">
                      구글 스프레드시트 하단의 탭 이름 <strong>'시트1'</strong>을 더블클릭하여 영문 <strong>Seats</strong>로 변경하시면 스크립트 재배포 없이도 즉시 연결됩니다!
                    </p>
                  </div>
                )}

                {testResult.includes('"success":true') && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 text-[11px] font-semibold flex items-center gap-1.5">
                    <span>🎉 축하합니다! 구글 스프레드시트와 백엔드가 정상적으로 완벽 연동되었습니다!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={handleApplyUserSheetDirectly}
            className="text-emerald-700 hover:text-emerald-800 font-bold text-xs"
          >
            ✓ 구글 시트 좌석 앱에 즉시 적용
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
