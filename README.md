# Lagohalddaesalggeol (라느라고 할때 살걸)

"라느라고 할때 살걸"은 과거의 투자 결정을 돌아보고 유명 투자자, 기관, 또는 가상의 시나리오에 따라 내 자산이 어떻게 변했을지 시뮬레이션해 볼 수 있는 웹 서비스입니다. 국민연금(NPS) 포트폴리오 시뮬레이션을 포함하여 다양한 자산 배분 전략을 과거 데이터를 기반으로 테스트하고 분석할 수 있습니다.

## 🚀 기술 스택 (Tech Stack)

### Frontend
- **React.js & Vite**: 빠르고 효율적인 웹 UI 개발 및 빌드
- **Recharts**: 투자 성과 및 차트 데이터 시각화
- **Lucide React**: 깔끔하고 모던한 UI 아이콘

### Backend & Database
- **Node.js & Express**: API 서버 및 백엔드 로직 처리
- **Prisma ORM**: 직관적이고 타입 안전한 데이터베이스 제어
- **Supabase (PostgreSQL)**: 클라우드 기반의 안정적인 관계형 데이터베이스
- **SQLite**: 로컬 환경 개발 및 데이터 테스트용

### External APIs
- **Yahoo Finance API (yahoo-finance2)**: 실시간 및 과거 시장 데이터(주식, 환율 등) 수집
- **OpenAI API**: 투자 결과 분석 및 스마트 인공지능 해설 제공
- **Twitter API V2**: 트위터 소셜 데이터 수집 및 연동 (예정/선택사항)

---

## 💻 로컬 개발 환경 설정 (Getting Started)

### 1. 프로젝트 원격 환경으로 가져오기 (Clone)
```bash
git clone https://github.com/Kimjaeseop/lagohalddaesalggeol.git
cd lagohalddaesalggeol
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 환경 변수(.env) 설정
보안상 Git에 올라가지 않은 환경변수 파일(`.env`)을 설정해야 합니다.
```bash
# .env.example 파일을 복사하여 .env 생성
copy .env.example .env  # (Windows)
cp .env.example .env    # (Mac/Linux)
```
생성된 `.env` 파일을 열고 사용할 Database 세부 정보 및 외부 서비스 API Keys (Supabase DB URL, OpenAI Key 등)를 입력해 주세요.

### 4. 데이터베이스 연동 및 마이그레이션 (Prisma)
Prisma 스키마를 데이터베이스에 반영하여 테이블 구조를 생성합니다.
```bash
npx prisma generate
npx prisma db push
```

### 5. 개발 서버 실행
웹 애플리케이션을 로컬 서버에서 실행합니다.
```bash
npm run dev
```
기본적으로 `http://localhost:5173` 등 Vite가 제공하는 주소로 접속할 수 있습니다.

---

## 🔒 보안 주의사항 (Security Notice)
이 프로젝트는 Prisma ORM과 외부 API들을 사용합니다. 
항상 **`.env` 파일이 Git에 커밋되지 않도록(`.gitignore` 확인) 주의**하시고, 절대 원격 저장소에 실제 DB 접속 비밀번호나 API Key를 올리지 마세요.
