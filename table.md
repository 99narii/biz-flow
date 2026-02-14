
## 1. schedule_categories (일정 카테고리)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK (auth.users) |
| name | VARCHAR(50) | 카테고리명 (사업, 개인, 부업, 프리) |
| color | VARCHAR(7) | HEX 컬러 (#6366F1) |
| sort_order | INT | 정렬 순서 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

---

## 2. finance_categories (금액 카테고리)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK (auth.users) |
| name | VARCHAR(50) | 카테고리명 (식비, 주유비 등) |
| type | VARCHAR(10) | 'income' / 'expense' / 'savings' |
| sort_order | INT | 정렬 순서 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

---

## 3. payment_methods (지불 방식)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK (auth.users) |
| name | VARCHAR(50) | 지불방식명 (현금, 카드) |
| sort_order | INT | 정렬 순서 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

---

## 4. cards (카드)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK (auth.users) |
| name | VARCHAR(50) | 카드명 (국민, 신한, 우리) |
| sort_order | INT | 정렬 순서 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

---

## 5. accounts (계좌)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK (auth.users) |
| bank_name | VARCHAR(50) | 은행명 (국민은행, 카카오뱅크) |
| account_number | VARCHAR(50) | 계좌번호 (메모용) |
| sort_order | INT | 정렬 순서 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

---

## 6. recurring_groups (반복 스케줄 그룹)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK (auth.users) |
| recurrence_type | VARCHAR(10) | '1week', '2weeks', '1month', '2months', '3months', '1year' |
| max_occurrences | INT | 최대 반복 횟수 (NULL이면 무제한, 최대 50) |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

---

## 7. schedules (스케줄) ⭐ 핵심 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK (auth.users) |
| **title** | VARCHAR(200) | 일정명 (필수) |
| **schedule_date** | DATE | 날짜 (필수) |
| **schedule_time** | TIME | 시간 (필수) |
| **schedule_category_id** | UUID | FK (schedule_categories) 필수 |
| has_finance | BOOLEAN | 금액 정보 포함 여부 |
| finance_type | VARCHAR(10) | 'income' / 'expense' / 'savings' |
| amount | DECIMAL(15, 0) | 금액 |
| finance_category_id | UUID | FK (finance_categories) |
| payment_method_id | UUID | FK (payment_methods) |
| card_id | UUID | FK (cards) - 카드 지출일 때 |
| account_id | UUID | FK (accounts) - 수입일 때 |
| is_receivable | BOOLEAN | 미수금 여부 |
| is_received | BOOLEAN | 수금 완료 여부 |
| received_at | TIMESTAMPTZ | 수금 일시 |
| memo | TEXT | 메모 |
| recurring_group_id | UUID | FK (recurring_groups) |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

---

## 8. todos (투두리스트)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK (auth.users) |
| title | VARCHAR(300) | 투두 제목 |
| is_completed | BOOLEAN | 완료 여부 |
| due_date | DATE | 마감일 (선택) |
| sort_order | INT | 정렬 순서 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

---

## 9. memos (메모장)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK (auth.users) |
| title | VARCHAR(200) | 메모 제목 |
| content | TEXT | 메모 내용 |
| is_pinned | BOOLEAN | 상단 고정 여부 |
| sort_order | INT | 정렬 순서 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

---

## 10. user_settings (유저 설정)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK (auth.users) UNIQUE |
| theme | VARCHAR(10) | 'light' / 'dark' |
| accent_color | VARCHAR(20) | 포인트 컬러 (indigo, blue, emerald 등) |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

---

## 관계도 요약

```
auth.users (Supabase Auth)
    └─ user_id로 모든 테이블과 연결

schedules (핵심)
    ├─ schedule_category_id → schedule_categories
    ├─ finance_category_id → finance_categories
    ├─ payment_method_id → payment_methods
    ├─ card_id → cards
    ├─ account_id → accounts
    └─ recurring_group_id → recurring_groups
```