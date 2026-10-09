export type SeatType = 'Desk' | 'Laptop' | 'Room' | 'general' | 'laptop' | 'study_room';

export interface Seat {
  id: string;
  name: string;
  type: SeatType;
  status?: string; // 'Available' | 'Reserved' | 'Maintenance'
  zone?: string;
  capacity?: number;
  features?: string[];
  floor?: number;
  x?: number; // percentage in floor map (0-100)
  y?: number; // percentage in floor map (0-100)
  description?: string;
}

export interface Reservation {
  id: string;
  seatId: string;
  seatName?: string;
  userName: string;
  userPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:00
  endTime: string; // HH:00
  createdAt?: string;
  status?: 'CONFIRMED' | 'CANCELLED';
}

export interface CreateReservationPayload {
  seatId: string;
  userName: string;
  userPhone: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  reservationId?: string;
  reservations?: Reservation[];
  seats?: Seat[];
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
