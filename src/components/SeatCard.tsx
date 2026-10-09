import React from 'react';
import { Seat, Reservation } from '../types';
import { TIME_SLOTS } from '../data/defaultSeats';
import { Clock, Monitor, Plug, Users, VolumeX, Wifi, Zap } from 'lucide-react';

interface SeatCardProps {
  seat: Seat;
  reservations: Reservation[];
  onSelect: (seat: Seat) => void;
}

export const SeatCard: React.FC<SeatCardProps> = ({ seat, reservations, onSelect }) => {
  const activeBookings = reservations.filter(
    (r) => r.seatId === seat.id && r.status !== 'CANCELLED'
  );

  const isFullyBooked = activeBookings.length >= 10; // near full occupancy
  const hasBookings = activeBookings.length > 0;

  // Type styling
  const getTypeBadge = () => {
    const t = String(seat.type || '').toLowerCase();
    if (t === 'desk' || t === 'general') {
      return {
        label: '일반 열람석 (Desk)',
        color: 'bg-slate-100 text-slate-700',
        icon: <VolumeX className="w-3.5 h-3.5" />,
      };
    }
    if (t === 'laptop') {
      return {
        label: '노트북 열람석 (Laptop)',
        color: 'bg-sky-50 text-sky-800',
        icon: <Monitor className="w-3.5 h-3.5" />,
      };
    }
    return {
      label: '스터디룸 (Room)',
      color: 'bg-emerald-50 text-emerald-800',
      icon: <Users className="w-3.5 h-3.5" />,
    };
  };

  const badge = getTypeBadge();

  // Helper for timeline slots (09:00 to 22:00)
  const hourSlots = TIME_SLOTS.slice(0, -1);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${badge.color}`}>
              {badge.icon}
              <span>{badge.label}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>정원 {seat.capacity}명</span>
          </div>

          <div className="text-right">
            {hasBookings ? (
              <span className="text-xs font-semibold text-amber-600">
                {activeBookings.length}건 예약됨
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-600">
                전 시간대 가능
              </span>
            )}
          </div>
        </div>

        {/* Seat Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
          {seat.name}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-3">{seat.zone}</p>

        {/* Features / Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(seat.features || []).map((feature, i) => (
            <span
              key={i}
              className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* 09:00 ~ 22:00 Occupancy Timeline */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-1.5">
            <span>09:00</span>
            <span>실시간 예약 타임라인</span>
            <span>22:00</span>
          </div>

          <div className="h-2.5 bg-slate-100 rounded-full flex overflow-hidden border border-slate-200/60 p-[1px]">
            {hourSlots.map((slot) => {
              const isOccupied = activeBookings.some(
                (b) => b.startTime <= slot && slot < b.endTime
              );
              return (
                <div
                  key={slot}
                  className={`flex-1 transition-colors ${
                    isOccupied ? 'bg-slate-400' : 'bg-emerald-500'
                  }`}
                  title={`${slot} ~ : ${isOccupied ? '예약됨' : '예약 가능'}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>최대 {seat.type === 'study_room' ? '3시간' : '4시간'} 이용</span>
        </span>

        <button
          onClick={() => onSelect(seat)}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-600 rounded-xl transition-all shadow-xs active:scale-95 whitespace-nowrap"
        >
          예약하기
        </button>
      </div>
    </div>
  );
};
