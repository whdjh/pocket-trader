# 코드 구조

## Hooks: 상태 관리 필요에 따라 분리

- 위치: `src/lib/hooks/`
- **Query Hooks** (`src/lib/hooks/queries/`): 데이터 페칭 캐싱 훅 (React Query, SWR 등)
- **Common Hooks** (`src/lib/hooks/common/`): 재사용 가능한 UI/UX 훅
- **Business Hooks** (`src/lib/hooks/business/`): 비즈니스 로직 훅 (트레이딩, 인증 등)

## Utils: 상태 없는 순수 함수

- 위치: `src/lib/utils/`
- 헬퍼 함수, 포맷터, 검증 함수
- React 훅 없음, 상태 관리 없음

## Lib: 비즈니스 로직 및 서비스

- 위치: `src/lib/`
- API 클라이언트, 서비스, 비즈니스 로직
- Hooks도 lib 내부에 포함 (`src/lib/hooks/`)

