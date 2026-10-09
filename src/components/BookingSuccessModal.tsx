import React, { useState } from 'react';
import { Reservation, Seat } from '../types';
import { Check, Copy, ExternalLink, QrCode, X } from 'lucide-react';

interface BookingSuccessModalProps {
  reservation: Reservation | null;
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMyReservations: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  reservation,
  seat,
  isOpen,
  onClose,
  onOpenMyReservations,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !reservation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reservation.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl p-6 text-center shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900">도서관 예약 완료!</h3>
          <p className="text-xs text-slate-500 mt-1">
            정상적으로 예약이 접수되어 배정이 확정되었습니다.
          </p>
        </div>

        {/* Digital Ticket / Receipt */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start pb-2 border-b border-slate-200">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                RESERVATION NUMBER
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <span>{reservation.id}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
                  title="예약번호 복사"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-md">
                예약 확정
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">좌석 번호:</span>
              <span className="font-bold text-slate-900">
                {seat?.name || reservation.seatName || reservation.seatId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">구역:</span>
              <span className="font-medium text-slate-800">
                {seat?.zone || '도서관 2층'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">이용 날짜:</span>
              <span className="font-semibold text-slate-800">{reservation.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">이용 시간:</span>
              <span className="font-bold text-emerald-700">
                {reservation.startTime} ~ {reservation.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">예약자:</span>
              <span className="font-medium text-slate-800">
                {reservation.userName} ({reservation.userPhone})
              </span>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
            ※ 시작 시간 기준 20분 내 미입실 시 자동 취소될 수 있습니다. 입실 시 게이트에 휴대폰 번호 또는 예약 번호를 입력해 주세요.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenMyReservations();
            }}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>내 예약에서 확인</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
