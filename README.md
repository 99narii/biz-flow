This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# BizFlow

프리랜서 / 소규모 사업자를 위한 **일정 + 재무 통합 관리 웹앱**

하나의 스케줄에 일정과 금액 정보를 함께 기록하고, 캘린더에서 한눈에 확인하며, 수입/지출/적금 통계까지 볼 수 있는 서비스입니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | Next.js 15 (App Router), TypeScript, SCSS Modules |
| 상태관리 | Zustand |
| 백엔드 / DB | Supabase (PostgreSQL + Auth + RLS) |
| 배포 | Vercel |
| 폰트 | Pretendard Variable |
| 기타 | PWA (standalone), 모바일 퍼스트 (max-width: 1024px) |

---

## 디자인 시스템

- **디자인 토큰 기반**: 컬러, 폰트 사이즈, 스페이싱을 SCSS 변수 + CSS 변수로 관리
- **테마 전환**: `data-theme="light|dark"` 속성으로 다크모드 전환
- **포인트 컬러**: `--color-primary` CSS 변수를 동적으로 교체 (indigo, blue, emerald, rose, amber, violet)
- **반응형 브레이크포인트**: 480px / 768px / 1024px (min-width 기반, 모바일 퍼스트)
- **스페이싱**: 4px 베이스 시스템 (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

---

## 주요 기능

### 1. 통합 캘린더

- 월간 캘린더 뷰에 `스케줄 시간 + 일정명 + 금액` 노출
- 필터: 일정만 보기 / 금액 포함 보기

### 2. 스케줄 CRUD

**필수 입력**: 날짜, 시간, 일정명, 일정 카테고리

**추가 입력 (금액)**:
- 수입 / 지출 / 적금 선택
- 금액, 금액 카테고리
- 지출 시: 지불 방식 (현금/카드), 카드 선택
- 수입 시: 입금 계좌 선택, 미수금 여부 체크

**추가 입력 (기타)**: 메모

**반복 스케줄**:
- 반복 주기: 1주 / 2주 / 1개월 / 2개월 / 3개월 / 1년
- 각 스케줄은 독립 ID를 가지며, `recurring_group_id`로 그룹 연결
- 공유 필드 (제목, 시간, 카테고리, 메모) 변경 → 그룹 전체 반영
- 개별 필드 (금액, 미수 체크) 변경 → 해당 스케줄만 반영
- 종료 조건: n회 반복 / 종료일 없음 (최대 50개 생성)

**날짜 선택 시**: 시간대별 스케줄 정렬 + 당일 투두리스트 노출

### 3. 투두리스트

- 스케줄과 독립된 CRUD
- 날짜별 뷰에서 당일 투두 함께 노출

### 4. 통계

- 수입 / 지출 / 적금 통계
- 일정 카테고리별 통계 (사업 / 개인 / 부업 / 프리)
- 세부 카테고리 교차 통계 (예: 사업 → 운영비)
- 순수익 계산: 사업 총 매출 - 사업 총 지출 (적금은 자산이동으로 제외)
- 미수금 리스트 (수금 처리 가능)
- 카드별 예상 결제 금액

### 5. 메모장

- 메모 CRUD
- 상단 고정 기능

### 6. 설정

- 다크모드 / 라이트모드 전환
- 포인트 컬러 테마 변경
- 카테고리 관리 (일정 / 금액 / 지불방식 / 카드 / 계좌)

---

## DB 구조

```
schedule_categories    ─┐
finance_categories     ─┤
payment_methods        ─┤──→  schedules (핵심 테이블)
cards                  ─┤
accounts               ─┤
recurring_groups       ─┘

todos                  (독립)
memos                  (독립)
user_settings          (독립, 회원가입 시 자동 생성)
```

- 총 **10개 테이블**, 모든 테이블에 **RLS (Row Level Security)** 적용
- 인증: Supabase Auth 이메일 방식
- 개인 전용 서비스 (user_id 기반 데이터 격리)

---
