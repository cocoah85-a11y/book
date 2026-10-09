import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SeatCard } from './components/SeatCard';
import { FloorMap } from './components/FloorMap';
import { ReservationModal } from './components/ReservationModal';
import { BookingSuccessModal } from './components/BookingSuccessModal';
import { MyReservationsModal } from './components/MyReservationsModal';
import { GasSetupGuideModal } from './components/GasSetupGuideModal';
import { ExportHtmlModal } from './components/ExportHtmlModal';
import { Toast } from './components/Toast';
import { Seat, Reservation, CreateReservationPayload, ToastNotification, SeatType } from './types';
import { DEFAULT_SEATS } from './data/defaultSeats';
import { gasClient } from './api/gasClient';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Grid,
  Info,
  Laptop,
  Layers,
  Map,
  ShieldCheck,
  Sparkles,
  Users,
  VolumeX,
} from 'lucide-react';

export default function App() {
  // Helper to format date offset
  const getTodayDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [seats, setSeats] = useState<Seat[]>(DEFAULT_SEATS);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filterType, setFilterType] = useState<'all' | SeatType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Modals & Sheets
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyCreatedRes, setNewlyCreatedRes] = useState<Reservation | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isMyReservationsOpen, setIsMyReservationsOpen] = useState(false);
  const [isGasGuideOpen, setIsGasGuideOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Status & Toasts
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [gasErrorNotice, setGasErrorNotice] = useState<string | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch seats and reservations
  const loadData = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch seats
      const seatsRes = await gasClient.getSeats();
      setSeats(seatsRes.seats);

      // 2. Fetch reservations for selected date
      const resRes = await gasClient.getReservations(date);
      setReservations(resRes.reservations);

      if (seatsRes.isFallback || resRes.isFallback) {
        setGasErrorNotice(
          'Google Apps Script 백엔드 연동 상태: 스프레드시트 초기화 상태 또는 CORS 우회로 로컬 세션 모드가 활성화되어 있습니다.'
        );
      } else {
        setGasErrorNotice(null);
      }
    } catch (err: unknown) {
      console.warn('Data load error:', err);
      addToast('서버 통신 중 알림이 발생했습니다. 로컬 데이터를 유지합니다.', 'info');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData(currentDate);
  }, [currentDate, loadData]);

  // Handle Booking
  const handleOpenBooking = (seat: Seat) => {
    setSelectedSeat(seat);
    setIsBookingOpen(true);
  };

  const handleBookingSubmit = async (payload: CreateReservationPayload) => {
    setIsSubmitting(true);
    try {
      const res = await gasClient.createReservation(payload);
      if (res.success) {
        setNewlyCreatedRes(res.reservation);
        setIsBookingOpen(false);
        setIsSuccessOpen(true);
        addToast(`예약이 확정되었습니다. (예약번호: ${res.reservationId})`, 'success');
        // Refresh
        await loadData(currentDate);
      } else {
        addToast(res.message || '예약 처리에 실패했습니다.', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast(`예약 처리 중 오류: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel
  const handleCancelReservation = async (reservationId: string) => {
    setIsCancelling(true);
    try {
      const res = await gasClient.cancelReservation(reservationId);
      if (res.success) {
        addToast('예약이 정상적으로 취소되었습니다.', 'info');
        await loadData(currentDate);
      } else {
        addToast(res.message || '예약 취소 실패', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast(`취소 오류: ${msg}`, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filtered Seats
  const filteredSeats = seats.filter((seat) => {
    if (filterType === 'all') return true;
    const t = String(seat.type || '').toLowerCase();
    if (filterType === 'Desk' || filterType === 'general') return t === 'desk' || t === 'general';
    if (filterType === 'Laptop' || filterType === 'laptop') return t === 'laptop';
    if (filterType === 'Room' || filterType === 'study_room') return t === 'room' || t === 'study_room';
    return true;
  });

  const deskCount = seats.filter((s) => ['desk', 'general'].includes(String(s.type).toLowerCase())).length;
  const laptopCount = seats.filter((s) => String(s.type).toLowerCase() === 'laptop').length;
  const roomCount = seats.filter((s) => ['room', 'study_room'].includes(String(s.type).toLowerCase())).length;

  // Calculate live availability for today
  const activeBookingsCount = reservations.filter((r) => r.status !== 'CANCELLED').length;
  const availableSeatsCount = Math.max(0, seats.length - activeBookingsCount);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-24 md:pb-12 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Header with Top Bar Contract & Date Controls */}
      <Header
        currentDate={currentDate}
        onDateChange={(newDate) => setCurrentDate(newDate)}
        activeTab={viewMode === 'map' ? 'map' : 'grid'}
        onTabChange={(tab) => {
          if (tab === 'map') setViewMode('map');
          else if (tab === 'grid') setViewMode('grid');
          else if (tab === 'my-reservations') setIsMyReservationsOpen(true);
        }}
        onOpenMyReservations={() => setIsMyReservationsOpen(true)}
        onOpenGasGuide={() => setIsGasGuideOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onRefresh={() => loadData(currentDate)}
        isLoading={isLoading}
        totalSeats={seats.length}
        availableSeats={availableSeatsCount}
      />

      {/* GAS Information Banner */}
      {gasErrorNotice && (
        <div className="bg-emerald-950 text-emerald-100 px-4 py-2 text-xs border-b border-emerald-800">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>{gasErrorNotice}</span>
            </div>
            <button
              onClick={() => setIsGasGuideOpen(true)}
              className="text-emerald-300 hover:text-white underline font-semibold text-left sm:text-right shrink-0"
            >
              GAS 설정 가이드 확인 &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Step Banner / Area Filter Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">
                좌석 선택
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                이용 공간 및 좌석 유형 선택
              </h2>
            </div>

            {/* View Mode Switcher (Grid vs Floor Map) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-slate-600" />
                <span>카드 목록</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'map'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Map className="w-3.5 h-3.5 text-slate-600" />
                <span>2D 배치도</span>
              </button>
            </div>
          </div>

          {/* Type Category Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              전체 좌석 ({seats.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('Desk')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'Desk' || filterType === 'general'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <span>일반 열람석 Desk ({deskCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('Laptop')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'Laptop' || filterType === 'laptop'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-sky-600" />
              <span>노트북 열람석 Laptop ({laptopCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('Room')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'Room' || filterType === 'study_room'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>스터디룸 Room ({roomCount})</span>
            </button>
          </div>

          {/* Quick Notice about Google Sheet Sync */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-semibold text-emerald-700">구글 시트 연동:</span>
              <span className="text-slate-500 font-mono text-[11px]">A:SeatId · B:Name · C:Type · D:Status</span>
            </div>
            <button
              type="button"
              onClick={() => setIsGasGuideOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 font-bold underline"
            >
              연동 가이드 & 원클릭 해결 &rarr;
            </button>
          </div>
        </div>

        {/* View Mode Switching */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSeats.map((seat) => (
              <SeatCard
                key={seat.id}
                seat={seat}
                reservations={reservations}
                onSelect={handleOpenBooking}
              />
            ))}
          </div>
        ) : (
          <FloorMap
            seats={filteredSeats}
            reservations={reservations}
            onSelectSeat={handleOpenBooking}
            selectedDate={currentDate}
          />
        )}

        {/* Library Guideline Section (Quiet, Editorial) */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>늘푸른 스마트 도서관 이용 수칙</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">01. 입실 인증</div>
              <p className="text-slate-500 leading-relaxed">
                예약 시작 시간 기준 20분 내로 2층 스피드게이트 키오스크에 휴대폰 번호를 입력 후 입실하세요.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">02. 에티켓 준수</div>
              <p className="text-slate-500 leading-relaxed">
                일반 열람실에서는 무소음 마우스 및 타이핑이 제한되며, 노트북 존에서 작업이 가능합니다.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">03. 퇴실 및 연장</div>
              <p className="text-slate-500 leading-relaxed">
                이용 종료 30분 전 다음 대기자가 없을 경우 1회에 한하여 2시간 연장이 가능합니다.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR (Thumb Ergonomics) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
        <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto px-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              viewMode === 'grid' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">좌석 목록</span>
          </button>

          <button
            onClick={() => setViewMode('map')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              viewMode === 'map' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">2D 배치도</span>
          </button>

          <button
            onClick={() => setIsMyReservationsOpen(true)}
            className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">내 예약</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 hover:text-slate-900 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">단일 HTML</span>
          </button>
        </div>
      </nav>

      {/* MODALS */}
      <ReservationModal
        seat={selectedSeat}
        selectedDate={currentDate}
        existingReservations={reservations}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSubmit={handleBookingSubmit}
        isSubmitting={isSubmitting}
      />

      <BookingSuccessModal
        reservation={newlyCreatedRes}
        seat={selectedSeat}
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        onOpenMyReservations={() => setIsMyReservationsOpen(true)}
      />

      <MyReservationsModal
        isOpen={isMyReservationsOpen}
        onClose={() => setIsMyReservationsOpen(false)}
        allReservations={gasClient.getAllLocalReservations()}
        onCancelReservation={handleCancelReservation}
        isCancelling={isCancelling}
      />

      <GasSetupGuideModal
        isOpen={isGasGuideOpen}
        onClose={() => setIsGasGuideOpen(false)}
        onUrlUpdated={(newUrl) => {
          addToast('Web App URL이 업데이트되었습니다.', 'success');
          loadData(currentDate);
        }}
        onSeatsUpdated={(newSeats) => {
          setSeats(newSeats);
          addToast('구글 시트 좌석 데이터가 즉시 적용되었습니다.', 'success');
        }}
      />

      <ExportHtmlModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
