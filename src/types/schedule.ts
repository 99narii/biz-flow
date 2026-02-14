// 일정 카테고리
export interface ScheduleCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 금액 카테고리
export interface FinanceCategory {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense" | "savings";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 금액 타입
export type FinanceType = "income" | "expense" | "savings";

// 스케줄
export interface Schedule {
  id: string;
  user_id: string;
  title: string;
  schedule_date: string;
  schedule_time: string;
  schedule_category_id: string;
  has_finance: boolean;
  finance_type: FinanceType | null;
  amount: number | null;
  finance_category_id: string | null;
  payment_method_id: string | null;
  card_id: string | null;
  account_id: string | null;
  is_receivable: boolean;
  is_received: boolean;
  received_at: string | null;
  memo: string | null;
  recurring_group_id: string | null;
  created_at: string;
  updated_at: string;
}

// 스케줄 + 조인된 카테고리 정보
export interface ScheduleWithCategories extends Schedule {
  schedule_category: Pick<ScheduleCategory, "name" | "color"> | null;
  finance_category: Pick<FinanceCategory, "name" | "type"> | null;
}

// react-big-calendar 이벤트 형식
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    schedule: ScheduleWithCategories;
    color: string;
    amount: number | null;
    financeType: FinanceType | null;
  };
}
