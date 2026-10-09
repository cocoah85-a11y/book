import React, { useState } from 'react';
import { Reservation } from '../types';
import { AlertTriangle, Calendar, CheckCircle2, Clock, MapPin, Search, Trash2, X } from 'lucide-react';

interface MyReservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelReservation: (reservationId: string) => Promise<void>;
  allReservations: Reservation[];
  isCancelling: boolean;
}

export const MyReservationsModal: React.FC<MyReservationsModalProps> = ({
  isOpen,
  onClose,
  onCancelReservation,
  allReservations,
  isCancelling,
}) => {
  const [query, setQuery] = useState('');
  const [selectedToCancel, setSelectedToCancel] = useState<Reservation | null>(null);

  if (!isOpen) return null;

  // Search filter
  const cleanQuery = query.trim().replace(/[^0-9a-zA-Z_]/g, '').toLowerCase();

  const filteredReservations = allReservations.filter((r) => {
    if (!cleanQuery) return true;
    const phoneClean = r.userPhone.replace(/[^0-9]/g, '');
    const idClean = r.id.toLowerCase();
    const nameClean = r.userName.toLowerCase();
    return (
      phoneClean.includes(cleanQuery) ||
      idClean.includes(cleanQuery) ||
      nameClean.includes(cleanQuery)
    );
  });

  const handleConfirmCancel = async () => {
    if (!selectedToCancel) return;
    await onCancelReservation(selectedToCancel.id);
    setSelectedToCancel(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">내 예약 조회 및 취소</h3>
            <p className="text-xs text-slate-400">
              휴대폰 번호 또는 예약 번호로 내역을 검색하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="휴대폰 번호(010-0000-0000) 또는 예약 번호(RES_...)"
              className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* List */}
          <div className="space-y-3 min-h-[160px]">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <p className="text-xs">
                  {query ? '일치하는 예약 내역이 없습니다.' : '등록된 예약 내역이 없습니다.'}
                </p>
                <p className="text-[11px] text-slate-400">
                  휴대폰 번호를 다시 확인해 주시기 바랍니다.
                </p>
              </div>
            ) : (
              filteredReservations.map((r) => {
                const isCancelled = r.status === 'CANCELLED';

                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCancelled
                        ? 'bg-slate-50/60 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {r.seatName || r.seatId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isCancelled
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {isCancelled ? '취소됨' : '예약 확정'}
                        </span>
                      </div>

                      <span className="font-mono text-[11px] text-slate-400">
                        {r.id}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>이용 일자: {r.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>이용 시간: {r.startTime} ~ {r.endTime}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-0.5">
                        예약자: {r.userName} ({r.userPhone})
                      </div>
                    </div>

                    {!isCancelled && (
                      <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedToCancel(r)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>예약 취소</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cancellation Confirmation Alert */}
        {selectedToCancel && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="font-bold text-sm text-slate-900">예약을 취소하시겠습니까?</h4>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                좌석 <strong className="text-slate-900">{selectedToCancel.seatName || selectedToCancel.seatId}</strong> ({selectedToCancel.date} {selectedToCancel.startTime}~{selectedToCancel.endTime}) 예약이 취소되며, 다른 사용자가 즉시 예약할 수 있도록 전환됩니다.
              </p>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedToCancel(null)}
                  disabled={isCancelling}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  돌아가기
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5"
                >
                  {isCancelling ? '취소 처리 중...' : '확인, 취소합니다'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
