import React, { useState, useEffect } from 'react';
import { Seat, Reservation, CreateReservationPayload } from '../types';
import { START_TIME_OPTIONS, END_TIME_OPTIONS } from '../data/defaultSeats';
import { AlertCircle, Calendar, Check, Clock, Info, User, Phone, X, ShieldAlert } from 'lucide-react';

interface ReservationModalProps {
  seat: Seat | null;
  selectedDate: string;
  existingReservations: Reservation[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateReservationPayload) => Promise<void>;
  isSubmitting: boolean;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  seat,
  selectedDate,
  existingReservations,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Phone auto formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 3 && val.length <= 7) {
      val = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (val.length > 7) {
      val = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`;
    }
    setUserPhone(val);
  };

  // Real-time conflict checking
  const relevantBookings = seat
    ? existingReservations.filter((r) => r.seatId === seat.id && r.status !== 'CANCELLED')
    : [];

  const checkConflict = (start: string, end: string): string | null => {
    if (start >= end) {
      return '이용 종료 시간은 시작 시간보다 이후여야 합니다.';
    }

    const isRoom = String(seat?.type || '').toLowerCase().includes('room');
    const maxHours = isRoom ? 3 : 4;
    const startHour = parseInt(start.split(':')[0], 10);
    const endHour = parseInt(end.split(':')[0], 10);
    if (endHour - startHour > maxHours) {
      return `${isRoom ? '스터디룸은 최대 3시간' : '열람석은 최대 4시간'}까지 연속 예약이 가능합니다.`;
    }

    // Check overlap with existing reservations
    const conflict = relevantBookings.find((r) => {
      // Overlaps if start < r.endTime && end > r.startTime
      return start < r.endTime && end > r.startTime;
    });

    if (conflict) {
      return `선택하신 시간(${start} ~ ${end})에 이미 다른 예약(${conflict.startTime} ~ ${conflict.endTime})이 존재합니다.`;
    }

    return null;
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(checkConflict(startTime, endTime));
    }
  }, [startTime, endTime, seat, isOpen]);

  if (!isOpen || !seat) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const conflict = checkConflict(startTime, endTime);
    if (conflict) {
      setErrorMsg(conflict);
      return;
    }

    if (!userName.trim()) {
      setErrorMsg('예약자 성함을 입력해주세요.');
      return;
    }

    if (userPhone.trim().replace(/[^0-9]/g, '').length < 10) {
      setErrorMsg('정상적인 휴대폰 번호(10~11자리)를 입력해주세요.');
      return;
    }

    await onSubmit({
      seatId: seat.id,
      userName: userName.trim(),
      userPhone: userPhone.trim(),
      date: selectedDate,
      startTime,
      endTime,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
              {String(seat.type).toLowerCase().includes('desk') || String(seat.type).toLowerCase() === 'general'
                ? '일반 열람석 (Desk)'
                : String(seat.type).toLowerCase().includes('laptop')
                ? '노트북 열람석 (Laptop)'
                : '스터디룸 (Room)'}
            </div>
            <h3 className="text-lg font-bold">{seat.name} 예약 신청</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Seat Spec Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium text-slate-500">배치 구역</span>
              <span className="font-bold text-slate-800">{seat.zone}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium text-slate-500">예약 희망일</span>
              <span className="font-bold text-emerald-700">{selectedDate}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium text-slate-500">제공 시설</span>
              <span className="font-medium text-slate-700">{(seat.features || []).join(', ')}</span>
            </div>
          </div>

          {/* User Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              예약자 성함 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="홍길동"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* User Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              휴대폰 번호 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="tel"
                required
                value={userPhone}
                onChange={handlePhoneChange}
                maxLength={13}
                placeholder="010-0000-0000"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              예약 확인, 입장 키오스크 인증 및 예약 취소 시 비밀번호로 사용됩니다.
            </p>
          </div>

          {/* Time Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                시작 시간
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                >
                  {START_TIME_OPTIONS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                종료 시간
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                >
                  {END_TIME_OPTIONS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Conflict or Error Notification */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || Boolean(errorMsg)}
              className={`w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                isSubmitting || Boolean(errorMsg) ? 'opacity-60 cursor-not-allowed' : 'active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>예약 처리 중 (GAS 통신)...</span>
                </>
              ) : (
                <span>도서관 좌석 예약 확정하기</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
