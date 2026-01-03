# 데이터베이스 스키마 (Drizzle ORM)

- `users` 테이블: id (PK, USER_ID env에서), name (로그인에서, 세션에 저장), created_at, updated_at
  - **비밀번호 필드 없음** - 이름만으로 로그인
  - **user_id는 `.env.local`의 USER_ID 변수에서 가져옴**
  - **name은 세션에 저장되어 표시용, 데이터 구분에는 사용 안 함**
  - **빗썸 API 키는 DB에 저장하지 않음**
- `sessions` 테이블: session_id (PK), user_id (FK -> users.id), created_at, expires_at
- `trade_history` 테이블: id (PK), user_id (FK -> users.id), datetime, decision, reason, fear_and_greed, krw_balance, btc_balance, action_result, created_at

## 쿼리 종속성

- `sessions`는 `users`에 의존 (user_id 외래키)
- `trade_history`는 `users`에 의존 (user_id 외래키)
- 항상 trade_history를 user_id로 필터링하여 개인화된 데이터 제공
- 사용자별 데이터 접근 전 세션 검증 필수

