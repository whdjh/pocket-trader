# Pocket Trader - 자동 매매봇 프로젝트

## 프로젝트 개요
- **프론트엔드**: Next.js 16.1.1 + React 19.2.3 + TypeScript
- **백엔드 로직**: Python 3.9+ (uv 패키지 관리자 사용)
- **데이터베이스**: Supabase (PostgreSQL) + Drizzle ORM
- **거래소**: 빗썸(Bithumb), 업비트(Upbit)
- **AI**: OpenAI API
- **스타일링**: Tailwind CSS 4

## 기술 스택

### 프론트엔드
- Next.js 16.1.1 (App Router)
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- Radix UI 컴포넌트
- TanStack Query (React Query)
- Lucide React (아이콘)

### 백엔드
- Python 3.9+
- uv (패키지 관리자)
- python-dotenv (환경 변수)
- openai (OpenAI API)
- python-bithumb (빗썸 API)
- pyupbit (업비트 API)
- plotly (차트 시각화)

### 데이터베이스
- Supabase (PostgreSQL)
- Drizzle ORM
- Drizzle Kit

## 프로젝트 구조

```
pocket-trader/
├── src/                    # Next.js 소스 코드
│   ├── app/                # App Router 페이지 및 API 라우트
│   ├── components/         # React 컴포넌트
│   │   ├── ui/            # 재사용 가능한 UI 컴포넌트
│   │   └── providers/     # Context Providers
│   ├── lib/               # 유틸리티 및 비즈니스 로직
│   │   ├── db/           # 데이터베이스 관련
│   │   ├── hooks/        # 커스텀 훅
│   │   └── utils/        # 유틸리티 함수
│   └── types/            # TypeScript 타입 정의
├── main.py                # Python 메인 진입점
├── pyproject.toml         # Python 의존성 관리
├── package.json           # Node.js 의존성 관리
└── .env*                  # 환경 변수 (gitignore됨)
```

## 코딩 규칙

### TypeScript/React
- 함수형 컴포넌트 사용
- TypeScript strict 모드 준수
- 컴포넌트는 PascalCase, 함수는 camelCase
- 파일명은 kebab-case (컴포넌트는 PascalCase.tsx)
- API 라우트는 `src/app/api/` 디렉토리에 위치
- 환경 변수는 `.env.local`에 저장 (절대 커밋하지 않음)

### Python
- PEP 8 스타일 가이드 준수
- 타입 힌트 사용 권장
- 모듈화된 구조 유지
- 환경 변수는 `python-dotenv`로 관리
- 거래소별 인터페이스 추상화 (빗썸, 업비트)

### 데이터베이스
- Drizzle ORM 사용
- 스키마는 `src/lib/db/` 디렉토리에 정의
- 마이그레이션은 `drizzle-kit` 사용

## 보안 규칙
- API 키는 절대 코드에 하드코딩하지 않음
- 환경 변수로 관리 (`BITHUMB_API_KEY`, `UPBIT_ACCESS_KEY`, `OPENAI_API_KEY` 등)
- `.env*` 파일은 `.gitignore`에 포함
- 민감한 정보는 Supabase 환경 변수 또는 안전한 저장소 사용

## 거래소 연동
- 빗썸: `python-bithumb` 라이브러리 사용
- 업비트: `pyupbit` 라이브러리 사용
- 거래소별 공통 인터페이스 구현 권장
- API 호출 시 에러 핸들링 필수
- Rate limiting 고려

## 패키지 관리
- Node.js 패키지: `npm` 또는 `pnpm` 사용
- Python 패키지: `uv` 사용
  - 설치: `uv add <package>`
  - 실행: `uv run python <script.py>`

## API 라우트 규칙
- Next.js API 라우트는 `src/app/api/` 디렉토리
- RESTful API 설계 원칙 준수
- 에러 응답은 일관된 형식으로 반환
- 인증/인가 미들웨어 적용

## 컴포넌트 규칙
- UI 컴포넌트는 `src/components/ui/`에 위치
- 비즈니스 로직 컴포넌트는 `src/components/`에 위치
- 재사용 가능한 컴포넌트는 props로 확장 가능하게 설계
- Radix UI 기반 컴포넌트 사용

## 스타일링
- Tailwind CSS 4 사용
- `src/lib/utils.ts`의 `cn()` 함수로 클래스 병합
- 반응형 디자인 고려 (mobile-first)
- 다크모드 지원 고려

## 테스트
- 중요한 로직은 테스트 작성 권장
- Python 로직은 pytest 고려
- 프론트엔드 컴포넌트는 React Testing Library 고려

## Git 규칙
- 의미 있는 커밋 메시지 작성
- `.venv/`, `__pycache__/`, `node_modules/` 등은 gitignore
- 환경 변수 파일은 절대 커밋하지 않음

## 개발 워크플로우
1. 환경 변수 설정 (`.env.local` 생성)
2. 의존성 설치:
   - Node.js: `npm install` 또는 `pnpm install`
   - Python: `uv sync`
3. 개발 서버 실행: `npm run dev`
4. Python 스크립트 실행: `uv run python main.py`

## 주의사항
- 실제 거래 전 충분한 테스트 필수
- API 키 보안 관리 철저히
- Rate limiting 및 에러 핸들링 구현
- 로깅 및 모니터링 고려

