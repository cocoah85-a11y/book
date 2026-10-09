import React, { useState } from 'react';
import { Seat, Reservation } from '../types';
import { BookOpen, Coffee, DoorOpen, HelpCircle, Monitor, Users, VolumeX } from 'lucide-react';

interface FloorMapProps {
  seats: Seat[];
  reservations: Reservation[];
  onSelectSeat: (seat: Seat) => void;
  selectedDate: string;
}

export const FloorMap: React.FC<FloorMapProps> = ({
  seats,
  reservations,
  onSelectSeat,
  selectedDate,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  const getSeatBookings = (seatId: string) =>
    reservations.filter((r) => r.seatId === seatId && r.status !== 'CANCELLED');

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      {/* Map Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">도서관 2층 평면 배치도</h2>
          <p className="text-xs text-slate-500">
            좌석 위치를 직접 확인하고 터치(클릭)하여 바로 예약할 수 있습니다.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-xs"></span>
            <span>예약 가능</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-600 shadow-xs"></span>
            <span>일부 시간 예약됨</span>
          </span>
        </div>
      </div>

      {/* 2D Architectural Floor Plan */}
      <div className="relative w-full aspect-[16/11] min-h-[380px] bg-slate-50/70 border-2 border-slate-200 rounded-2xl overflow-hidden shadow-inner p-4 select-none">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Architectural Room Dividers & Zones */}
        {/* Zone 1: Quiet Reading Room */}
        <div className="absolute top-4 left-4 w-[48%] h-[56%] border border-slate-300 rounded-xl bg-white/70 p-3 pointer-events-none shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            <span>제1열람실 (집중 정숙석)</span>
          </div>
          <div className="text-[10px] text-slate-400">책장 및 개별 독서등 비치 구역</div>
        </div>

        {/* Zone 2: Laptop Commons */}
        <div className="absolute top-4 right-4 w-[42%] h-[56%] border border-sky-200 rounded-xl bg-sky-50/30 p-3 pointer-events-none shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
            <Monitor className="w-3.5 h-3.5 text-sky-600" />
            <span>노트북 존 (타이핑 허용)</span>
          </div>
          <div className="text-[10px] text-sky-700/60">초고속 Wi-Fi & 모니터 구비</div>
        </div>

        {/* Zone 3: Group Study Rooms */}
        <div className="absolute bottom-16 left-4 right-4 h-[25%] border border-emerald-200 rounded-xl bg-emerald-50/30 p-3 pointer-events-none shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>그룹 스터디룸 및 세미나실 (방음벽 시공)</span>
          </div>
          <div className="text-[10px] text-emerald-700/60">4인~8인실 회의용 스마트 TV 완비</div>
        </div>

        {/* Bottom Entrance, Desk, and Amenities */}
        <div className="absolute bottom-3 left-6 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700">
            <DoorOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>출입구 (스피드게이트)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>도서 대출·반납 데스크</span>
          </div>
        </div>

        <div className="absolute bottom-3 right-6 flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-800">
          <Coffee className="w-3.5 h-3.5 text-amber-700" />
          <span>북카페 & 휴게 라운지</span>
        </div>

        {/* Interactive Seats */}
        {seats.map((seat) => {
          const bookings = getSeatBookings(seat.id);
          const hasBookings = bookings.length > 0;
          const isHovered = hoveredSeat?.id === seat.id;

          return (
            <button
              key={seat.id}
              type="button"
              onClick={() => onSelectSeat(seat)}
              onMouseEnter={() => setHoveredSeat(seat)}
              onMouseLeave={() => setHoveredSeat(null)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-xl text-xs font-bold transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center ${
                hasBookings
                  ? 'bg-slate-700 text-white hover:bg-slate-800'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:ring-4 hover:ring-emerald-200'
              } ${isHovered ? 'scale-125 z-30 shadow-lg' : 'scale-100 z-10'} ${
                seat.type === 'study_room' ? 'px-3 py-2 text-xs' : 'w-8 h-8 sm:w-9 sm:h-9 text-[11px]'
              }`}
              style={{
                left: `${seat.x ?? 50}%`,
                top: `${seat.y ?? 50}%`,
              }}
              title={`${seat.name} (${hasBookings ? '일부 시간 예약됨' : '예약 가능'})`}
            >
              <span>{seat.id}</span>
            </button>
          );
        })}

        {/* Hover Seat Floating Tooltip */}
        {hoveredSeat && (
          <div
            className="absolute z-40 bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs w-56 pointer-events-none transform -translate-x-1/2"
            style={{
              left: `${hoveredSeat.x ?? 50}%`,
              top: `${Math.max(10, (hoveredSeat.y ?? 50) - 18)}%`,
            }}
          >
            <div className="font-bold text-emerald-400">{hoveredSeat.name}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">{hoveredSeat.zone}</div>
            <div className="text-[10px] text-slate-400 mt-1">
              시설: {(hoveredSeat.features || []).join(', ')}
            </div>
            <div className="text-[10px] text-amber-300 mt-1 font-semibold">
              터치하여 바로 예약하기
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
