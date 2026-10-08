// Cùng định dạng dữ liệu với bản đầu tiên, nên chuyến đi cũ trên Firestore vẫn mở được.
export type CategoryKey = 'food' | 'transport' | 'stay' | 'fun' | 'shop' | 'other';
export type SplitMode = 'equal' | 'perHead' | 'custom';

export interface Member {
  id: string;
  name: string;
  /** Số người trong "hộ". 1 = cá nhân */
  people: number;
  note: string;
  identityClaimed?: boolean;
  verification?: {
    question: string;
    answerHash: string;
  };
}

export interface Payer {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: CategoryKey;
  /** 'YYYY-MM-DDTHH:mm' theo giờ địa phương */
  datetime: string;
  payers: Payer[];
  participants: string[];
  mode: SplitMode;
  custom: Record<string, number>;
  note: string;
  hasPhoto: boolean;
}

export interface Payment {
  id: string;
  from: string;
  to: string;
  amount: number;
  datetime: string;
}

export interface HistoryItem {
  ts: number;
  text: string;
}

export interface Trip {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** SHA-256 của khóa chỉnh sửa */
  editHash: string;
  /** Ảnh nền đã căn chỉnh (data URL, tỉ lệ 16:9) */
  bg: string;
  members: Member[];
  expenses: Expense[];
  payments: Payment[];
  history: HistoryItem[];
}

export const CATEGORIES: Record<CategoryKey, string> = {
  food: '🍜',
  transport: '🚗',
  stay: '🏨',
  fun: '🎡',
  shop: '🛍️',
  other: '📌',
};
