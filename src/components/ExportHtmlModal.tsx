import React, { useState } from 'react';
import { Check, Copy, Download, FileCode, X } from 'lucide-react';

interface ExportHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportHtmlModal: React.FC<ExportHtmlModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    // Fetch or link directly to standalone_library_booking.html
    const a = document.createElement('a');
    a.href = '/standalone_library_booking.html';
    a.download = 'library_seat_booking.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async () => {
    try {
      const res = await fetch('/standalone_library_booking.html');
      const htmlText = await res.text();
      await navigator.clipboard.writeText(htmlText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      alert('HTML 코드를 클립보드로 복사하지 못했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <FileCode className="w-5 h-5 text-emerald-600" />
            <span>단일 HTML 파일 내보내기 & 복사</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          요청하신 단일 파일(Tailwind CSS CDN + 바닐라 JavaScript + GAS API 연동 포함)이 준비되었습니다. 브라우저에서 더블 클릭만으로 즉시 열 수 있는 완벽한 독립형 웹앱 파일입니다.
        </p>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">파일명:</span>
            <span className="font-mono font-bold text-slate-800">standalone_library_booking.html</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">포함 기술:</span>
            <span className="font-medium text-slate-800">HTML5 + Tailwind CSS CDN + Vanilla JS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">백엔드 연동:</span>
            <span className="font-medium text-emerald-700">Google Apps Script REST API 지원</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'HTML 코드 복사됨!' : 'HTML 소스 복사'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>단일 HTML 파일 다운로드</span>
          </button>
        </div>
      </div>
    </div>
  );
};
