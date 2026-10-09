import { ApiResponse, CreateReservationPayload, Reservation, Seat } from '../types';
import { DEFAULT_SEATS } from '../data/defaultSeats';

export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbxty6hr1P8vQRKV_UcVmbpef_aGFHO-OYCO8ayc-saHvmgwkIxpMXWEXDn79ZQgLjyvDg/exec';

const STORAGE_KEY_RESERVATIONS = 'lib_reservations_v1';
const STORAGE_KEY_GAS_URL = 'lib_gas_api_url';
const STORAGE_KEY_SEATS = 'lib_custom_seats_v1';

export function getStoredApiUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_GAS_URL) || DEFAULT_GAS_URL;
  } catch {
    return DEFAULT_GAS_URL;
  }
}

export function saveApiUrl(url: string) {
  try {
    localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
  } catch (e) {
    console.error('Failed to save API URL:', e);
  }
}

export function getStoredSeats(): Seat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SEATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(e);
  }
  return DEFAULT_SEATS;
}

export function saveStoredSeats(seats: Seat[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SEATS, JSON.stringify(seats));
  } catch (e) {
    console.error(e);
  }
}

function parseSeatFromRaw(item: any, index: number): Seat {
  let id = '';
  let name = '';
  let type: any = 'Desk';
  let status = 'Available';

  if (Array.isArray(item)) {
    id = String(item[0] || '').trim();
    name = String(item[1] || id).trim();
    type = String(item[2] || 'Desk').trim();
    status = String(item[3] || 'Available').trim();
  } else if (typeof item === 'object' && item !== null) {
    id = String(item.id || item.seatId || item.SeatId || '').trim();
    name = String(item.name || item.Name || id).trim();
    type = String(item.type || item.Type || 'Desk').trim();
    status = String(item.status || item.Status || 'Available').trim();
  }

  // Normalize type
  const tLower = type.toLowerCase();
  let normalizedType: any = 'Desk';
  let zone = '제1열람실 (집중 정숙)';
  let capacity = 1;
  let features = ['개별 LED 스탠드', '220V 콘센트 1구'];

  if (tLower.includes('laptop') || tLower.includes('노트북')) {
    normalizedType = 'Laptop';
    zone = '노트북 존 (타이핑 가능)';
    features = ['초고속 Wi-Fi 6', '듀얼 콘센트 2구', '무소음 마우스 패드'];
  } else if (tLower.includes('room') || tLower.includes('룸') || tLower.includes('study')) {
    normalizedType = 'Room';
    zone = '그룹 미팅룸 구역';
    capacity = 4;
    features = ['방음벽 시공', '55인치 4K 스마트 TV', '대형 화이트보드'];
  }

  // Find default seat coordinates if available
  const def = DEFAULT_SEATS.find(s => s.id === id);

  return {
    id: id || `S${index + 1}`,
    name: name || `${id} 좌석`,
    type: normalizedType,
    status: status || 'Available',
    zone: def?.zone || zone,
    capacity: def?.capacity || capacity,
    features: def?.features || features,
    floor: def?.floor || 2,
    x: def?.x ?? (15 + (index % 6) * 14),
    y: def?.y ?? (20 + Math.floor(index / 6) * 16),
    description: `구글 시트 연동 좌석: ${name} (${type}, ${status})`
  };
}

// Initial sample reservations for immediate realistic preview
const INITIAL_SAMPLE_RESERVATIONS: Reservation[] = [
  {
    id: 'RES_20261009_S01_7124',
    seatId: 'S01',
    seatName: '일반석 S01',
    userName: '김민준',
    userPhone: '010-3456-7890',
    date: '2026-10-09',
    startTime: '10:00',
    endTime: '13:00',
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'RES_20261009_L03_4491',
    seatId: 'L03',
    seatName: '노트북석 L03',
    userName: '이지원',
    userPhone: '010-8765-4321',
    date: '2026-10-09',
    startTime: '14:00',
    endTime: '18:00',
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'RES_20261009_R01_9921',
    seatId: 'R01',
    seatName: '스터디룸 1 (4인실)',
    userName: '박서현',
    userPhone: '010-5555-8888',
    date: '2026-10-09',
    startTime: '13:00',
    endTime: '16:00',
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  }
];

function getLocalReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESERVATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(INITIAL_SAMPLE_RESERVATIONS));
      return INITIAL_SAMPLE_RESERVATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_RESERVATIONS;
  }
}

function saveLocalReservations(reservations: Reservation[]) {
  try {
    localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(reservations));
  } catch (e) {
    console.error('Failed to save local reservations', e);
  }
}

export interface ApiStatus {
  connected: boolean;
  isFallback: boolean;
  lastChecked: string;
  errorMessage?: string;
}

class GasClient {
  public status: ApiStatus = {
    connected: false,
    isFallback: false,
    lastChecked: new Date().toISOString()
  };

  /**
   * 1. 좌석 목록 가져오기: GET ${API_URL}?action=getSeats
   */
  async getSeats(): Promise<{ seats: Seat[]; isFallback: boolean; error?: string }> {
    const apiUrl = getStoredApiUrl();
    try {
      const targetUrl = `${apiUrl}?action=getSeats&t=${Date.now()}`;
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as ApiResponse<Seat[]>;

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        this.status = {
          connected: true,
          isFallback: false,
          lastChecked: new Date().toISOString()
        };
        const parsedSeats = json.data.map((item, idx) => parseSeatFromRaw(item, idx));
        saveStoredSeats(parsedSeats);
        return { seats: parsedSeats, isFallback: false };
      }

      // If GAS returned success: false or unexpected format
      const errMsg = json.message || 'GAS backend returned uninitialized dataset';
      this.status = {
        connected: false,
        isFallback: true,
        lastChecked: new Date().toISOString(),
        errorMessage: errMsg
      };
      return { seats: getStoredSeats(), isFallback: true, error: errMsg };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.status = {
        connected: false,
        isFallback: true,
        lastChecked: new Date().toISOString(),
        errorMessage: msg
      };
      return { seats: getStoredSeats(), isFallback: true, error: msg };
    }
  }

  /**
   * 2. 특정 날짜 예약 현황 가져오기: GET ${API_URL}?action=getReservations&date=YYYY-MM-DD
   */
  async getReservations(date: string): Promise<{ reservations: Reservation[]; isFallback: boolean; error?: string }> {
    const apiUrl = getStoredApiUrl();
    try {
      const targetUrl = `${apiUrl}?action=getReservations&date=${encodeURIComponent(date)}&t=${Date.now()}`;
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as ApiResponse<Reservation[]>;

      if (json.success) {
        const remoteReservations = json.data || json.reservations || [];
        this.status = {
          connected: true,
          isFallback: false,
          lastChecked: new Date().toISOString()
        };

        // Also merge local reservations for this date so test bookings are never lost
        const local = getLocalReservations().filter(r => r.date === date && r.status !== 'CANCELLED');
        const idSet = new Set(remoteReservations.map(r => r.id));
        const combined = [...remoteReservations];
        for (const loc of local) {
          if (!idSet.has(loc.id)) {
            combined.push(loc);
          }
        }

        return { reservations: combined, isFallback: false };
      }

      const errMsg = json.message || 'Failed to fetch reservations';
      const local = getLocalReservations().filter(r => r.date === date && r.status !== 'CANCELLED');
      return { reservations: local, isFallback: true, error: errMsg };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const local = getLocalReservations().filter(r => r.date === date && r.status !== 'CANCELLED');
      return { reservations: local, isFallback: true, error: msg };
    }
  }

  /**
   * 3. 예약 생성: POST ${API_URL}
   * Body (JSON):
   * {
   *   "action": "createReservation",
   *   "data": {
   *     "seatId": "S01",
   *     "userName": "홍길동",
   *     "userPhone": "010-0000-0000",
   *     "date": "2026-10-10",
   *     "startTime": "09:00",
   *     "endTime": "12:00"
   *   }
   * }
   */
  async createReservation(data: CreateReservationPayload): Promise<{
    success: boolean;
    reservationId: string;
    reservation: Reservation;
    isFallback: boolean;
    message?: string;
  }> {
    const apiUrl = getStoredApiUrl();
    const cleanPhone = data.userPhone.trim();
    const fallbackId = `RES_${data.date.replace(/-/g, '')}_${data.seatId}_${Math.floor(1000 + Math.random() * 9000)}`;

    const seat = DEFAULT_SEATS.find(s => s.id === data.seatId);
    const seatName = seat ? seat.name : data.seatId;

    const newReservation: Reservation = {
      id: fallbackId,
      seatId: data.seatId,
      seatName,
      userName: data.userName,
      userPhone: cleanPhone,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED'
    };

    const payload = {
      action: 'createReservation',
      data: {
        seatId: data.seatId,
        userName: data.userName,
        userPhone: cleanPhone,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime
      }
    };

    // Always record locally first to ensure instant client feedback and zero data loss
    const local = getLocalReservations();
    local.unshift(newReservation);
    saveLocalReservations(local);

    try {
      // For GAS Web Apps, text/plain prevents CORS preflight OPTIONS failure
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as ApiResponse;

      if (json.success) {
        const assignedId = json.reservationId || json.data?.toString() || fallbackId;
        newReservation.id = assignedId;
        // update local id if remote gave another
        const updatedLocal = getLocalReservations().map(r => r.id === fallbackId ? { ...r, id: assignedId } : r);
        saveLocalReservations(updatedLocal);

        return {
          success: true,
          reservationId: assignedId,
          reservation: newReservation,
          isFallback: false,
          message: json.message || '예약이 성공적으로 완료되었습니다.'
        };
      }

      // If backend failed (e.g. backend sheet error)
      return {
        success: true,
        reservationId: fallbackId,
        reservation: newReservation,
        isFallback: true,
        message: json.message ? `GAS 응답 알림: ${json.message} (로컬 예약 완료)` : '예약이 완료되었습니다 (로컬 세션 저장).'
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: true,
        reservationId: fallbackId,
        reservation: newReservation,
        isFallback: true,
        message: `네트워크/CORS 우회 로컬 저장 모드로 예약이 정상 확정되었습니다. (${msg})`
      };
    }
  }

  /**
   * 4. 예약 취소: POST ${API_URL}
   * Body (JSON):
   * {
   *   "action": "cancelReservation",
   *   "reservationId": "RES_..."
   * }
   */
  async cancelReservation(reservationId: string): Promise<{ success: boolean; message: string; isFallback: boolean }> {
    const apiUrl = getStoredApiUrl();

    // Mark cancelled in local storage
    const local = getLocalReservations();
    const updated = local.map(r => r.id === reservationId ? { ...r, status: 'CANCELLED' as const } : r);
    saveLocalReservations(updated);

    const payload = {
      action: 'cancelReservation',
      reservationId
    };

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as ApiResponse;

      if (json.success) {
        return {
          success: true,
          message: json.message || '예약이 정상적으로 취소되었습니다.',
          isFallback: false
        };
      }

      return {
        success: true,
        message: json.message || '예약이 취소되었습니다 (로컬 반영).',
        isFallback: true
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: true,
        message: `예약이 취소되었습니다 (로컬 반영됨, GAS: ${msg}).`,
        isFallback: true
      };
    }
  }

  /**
   * Search all reservations for user (by phone or reservationId)
   */
  getUserReservations(query: string): Reservation[] {
    const clean = query.trim().replace(/-/g, '').toLowerCase();
    if (!clean) return [];

    const list = getLocalReservations();
    return list.filter(r => {
      const phoneClean = r.userPhone.replace(/-/g, '').toLowerCase();
      const idClean = r.id.toLowerCase();
      return phoneClean.includes(clean) || idClean.includes(clean);
    });
  }

  getAllLocalReservations(): Reservation[] {
    return getLocalReservations();
  }
}

export const gasClient = new GasClient();
