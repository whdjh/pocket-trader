# 프로젝트 구조

- Next.js 16 + TypeScript
- Drizzle ORM + Supabase (PostgreSQL)
- 페이지 2개: `/login`, `/` (메인)
- 메인 페이지는 사용자별 개인화
- 단계별로 간단하게 구현

## 필수 라이브러리

### 프레임워크 & 코어
- `next` - Next.js 프레임워크
- `react`, `react-dom` - React
- `typescript` - TypeScript

### 데이터베이스 & ORM
- `drizzle-orm` - Drizzle ORM
- `drizzle-kit` - Drizzle 마이그레이션 도구
- `@supabase/supabase-js` - Supabase 클라이언트

### 데이터 페칭 & 캐싱 (쿼리 훅용)
- `@tanstack/react-query` - React Query (쿼리 훅용, 추천)

### HTTP 클라이언트
- `axios` - HTTP 요청

### 인증 & 보안
- `bcrypt` - 비밀번호 해싱 (현재는 사용 안 하지만 구조상 포함)

### AI & 외부 API
- `openai` - OpenAI API 클라이언트

### UI 컴포넌트
- `@radix-ui/*` - Radix UI 컴포넌트 (label, separator, slot)
- `lucide-react` - 아이콘
- `class-variance-authority` - 클래스 변형 관리
- `clsx` - 클래스 유틸리티
- `tailwind-merge` - Tailwind 클래스 병합

### 스타일링
- `tailwindcss` - Tailwind CSS
- `@tailwindcss/postcss` - Tailwind PostCSS

### 유틸리티
- `date-fns` - 날짜 포맷팅
- `technicalindicators` - 기술적 지표 계산
- `crypto` - 암호화 (Node.js 내장, 타입만 필요)

### 개발 도구
- `tsx` - TypeScript 실행
- `eslint`, `eslint-config-next` - 린팅
- `@types/*` - TypeScript 타입 정의

