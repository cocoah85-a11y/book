import { Seat } from '../types';

// 구글 스프레드시트와 1:1 완벽 일치하는 실시간 좌석 목록
export const DEFAULT_SEATS: Seat[] = [
  {
    id: 'S01',
    name: '1번 일반 열람석',
    type: 'Desk',
    status: 'Available',
    zone: '제1열람실 (집중 정숙)',
    capacity: 1,
    features: ['개별 LED 스탠드', '220V 콘센트 1구', '독서대 비치', '프라이빗 칸막이'],
    floor: 2,
    x: 28,
    y: 35,
    description: '구글 시트 연동: 1번 일반 열람석 (Desk, Available)'
  },
  {
    id: 'S02',
    name: '2번 노트북 열람석',
    type: 'Laptop',
    status: 'Available',
    zone: '노트북 존 (타이핑 가능)',
    capacity: 1,
    features: ['초고속 Wi-Fi 6', '듀얼 콘센트 2구', '무소음 마우스 패드'],
    floor: 2,
    x: 65,
    y: 35,
    description: '구글 시트 연동: 2번 노트북 열람석 (Laptop, Available)'
  },
  {
    id: 'R01',
    name: '1번 스터디룸 (4인)',
    type: 'Room',
    status: 'Available',
    zone: '그룹 미팅룸 구역',
    capacity: 4,
    features: ['방음벽 시공', '55인치 4K 스마트 TV', '대형 자석 화이트보드', '개별 냉난방'],
    floor: 2,
    x: 46,
    y: 75,
    description: '구글 시트 연동: 1번 스터디룸 4인 (Room, Available)'
  }
];

export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

export const START_TIME_OPTIONS = TIME_SLOTS.slice(0, -1); // 09:00 ~ 21:00
export const END_TIME_OPTIONS = TIME_SLOTS.slice(1); // 10:00 ~ 22:00
