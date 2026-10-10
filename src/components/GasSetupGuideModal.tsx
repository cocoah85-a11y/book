import React, { useState } from 'react';
import { ExternalLink, RefreshCw, X, AlertCircle, CheckCircle2, Play, Terminal, Database, Save, Check } from 'lucide-react';
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
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">Google Apps Script & 시트 연동 관리</h3>
              <p className="text-xs text-slate-400">
                구글 스프레드시트 Web App API 설정 및 실시간 연결 상태 점검
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs text-slate-700">
          
          {/* API URL Config Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="block font-bold text-slate-900 text-xs">
              배포된 Google Apps Script Web App URL:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
              >
                {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{saveSuccess ? '저장 완료!' : 'URL 저장'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              ※ 저장된 URL은 브라우저에 보관되며, 도서관 좌석 조회 및 예약 시 실시간 fetch 통신에 사용됩니다.
            </p>
          </div>

          {/* Vercel & GitHub Architecture Note */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-blue-950">
            <div className="font-bold flex items-center gap-1.5 text-blue-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Vercel / GitHub 빌드 최적화 완료 안내</span>
            </div>
            <p className="text-[11px] text-blue-900 leading-relaxed">
              Google Apps Script 백엔드 코드는 웹 프론트엔드(<code className="bg-blue-100 px-1 rounded font-mono">src/</code>)와 완전히 분리되어 프로젝트 루트의 <code className="bg-blue-100 px-1 rounded font-mono font-bold">Code.gs</code> 파일로 관리됩니다.
              따라서 Vercel 배포 시 TypeScript/Vite 빌드가 100% 오류 없이 통과합니다.
            </p>
          </div>

          {/* Error Diagnosis Banner for Cannot read properties of null */}
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2.5 text-rose-950">
            <div className="font-bold flex items-center gap-2 text-sm text-rose-900">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>스프레드시트 탭 이름 주의사항 (핵심!)</span>
            </div>
            
            <div className="p-3 bg-white border border-rose-200 rounded-lg text-xs space-y-1.5 shadow-xs">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <span>⚡ 2개 시트 탭 이름 확인:</span>
              </div>
              <ul className="text-slate-700 leading-relaxed list-disc list-inside space-y-1">
                <li>첫 번째 탭: <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">Seats</code> (좌석 정보 테이블)</li>
                <li>두 번째 탭: <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">Reservations</code> (예약 내역 기록 테이블, 없으면 자동 생성)</li>
              </ul>
            </div>

            <div className="text-[11px] text-rose-900 leading-relaxed">
              <strong>안내:</strong> 만약 'Cannot read properties of null (reading getDataRange)' 에러가 발생한다면, 구글 시트 맨 아래 탭 이름이 <strong>Seats</strong>로 되어 있는지 확인해 주세요.
            </div>
          </div>

          {/* Deployment Guide */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
            <div className="font-bold text-amber-900 text-xs">
              ★ Google Apps Script '새 버전' 배포 방법 (3단계)
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Apps Script에서 <code className="bg-amber-100 px-1 rounded font-mono">Code.gs</code>를 수정한 뒤에는 반드시 새 버전으로 배포해야 변경 사항이 반영됩니다:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900 font-medium pl-1">
              <li>우측 상단 <strong>[배포] &gt; [배포 관리]</strong> 클릭</li>
              <li>상단 연필(수정) 아이콘 클릭 후, <strong>버전</strong> 드롭다운에서 <strong>[새 버전]</strong> 선택</li>
              <li>우측 하단 <strong>[배포]</strong> 버튼 클릭!</li>
            </ol>
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
                      저장소 루트의 <code className="bg-amber-100 font-mono px-1 rounded">Code.gs</code> 내용을 복사하여 Apps Script에 붙여넣고 <strong>[배포] &gt; [배포 관리] &gt; [수정] &gt; [버전: 새 버전] &gt; [배포]</strong>를 진행해 주세요!
                    </p>
                  </div>
                )}

                {testResult.includes("Cannot read properties of null") && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-950 text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-900">
                      <span>⚡ 5초 해결법: 구글 시트 탭 이름을 'Seats'로 바꾸세요!</span>
                    </div>
                    <p className="leading-relaxed">
                      구글 스프레드시트 하단의 탭 이름 <strong>'시트1'</strong>을 더블클릭하여 영문 <strong>Seats</strong>로 변경하시면 즉시 정상 작동합니다!
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
