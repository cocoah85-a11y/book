import React from 'react';
import { Calendar, ChevronRight, Download, HelpCircle, Layers, MapPin, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  activeTab: 'grid' | 'map' | 'my-reservations';
  onTabChange: (tab: 'grid' | 'map' | 'my-reservations') => void;
  onOpenMyReservations: () => void;
  onOpenGasGuide: () => void;
  onOpenExportModal: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalSeats: number;
  availableSeats: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  activeTab,
  onTabChange,
  onOpenMyReservations,
  onOpenGasGuide,
  onOpenExportModal,
  onRefresh,
  isLoading,
  totalSeats,
  availableSeats,
}) => {
  // Quick date calculations
  const getDateOffset = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getDateOffset(0);
  const tomorrowStr = getDateOffset(1);
  const dayAfterStr = getDateOffset(2);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* 3-Zone Top Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-base shadow-sm">
            <span>📚</span>
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 tracking-tight leading-none">
              늘푸른 스마트 도서관
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1 leading-none">
              열람실 좌석 및 스터디룸 예약
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onTabChange('grid')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              activeTab === 'grid' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            좌석 현황
          </button>
          <button
            onClick={() => onTabChange('map')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              activeTab === 'map' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            층별 배치도
          </button>
          <button
            onClick={onOpenMyReservations}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              activeTab === 'my-reservations' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            내 예약 조회
          </button>
          <button
            onClick={onOpenGasGuide}
            className="text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <span>GAS API 연동</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenExportModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="단일 HTML 파일 다운로드 및 코드 복사"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>단일 HTML</span>
          </button>

          <button
            onClick={onOpenMyReservations}
            className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            내 예약 관리
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date & Occupancy Bar below Header */}
      <div className="bg-slate-50/80 border-t border-slate-200/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">예약 희망일:</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => onDateChange(todayStr)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  currentDate === todayStr
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => onDateChange(tomorrowStr)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  currentDate === tomorrowStr
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                내일
              </button>
              <button
                type="button"
                onClick={() => onDateChange(dayAfterStr)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  currentDate === dayAfterStr
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                모레
              </button>
            </div>

            {/* Native Date Picker */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={currentDate}
                min={todayStr}
                onChange={(e) => e.target.value && onDateChange(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Occupancy metrics */}
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-slate-400">운영시간</span>
              <span className="font-semibold text-slate-700">09:00 ~ 22:00</span>
            </div>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">잔여 좌석</span>
              <span className="font-bold text-emerald-600 tabular-nums">{availableSeats}</span>
              <span className="text-slate-400">/ {totalSeats}석</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
