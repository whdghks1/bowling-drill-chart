# Bowling Drill Chart · Fit Studio

볼러별 지공차트, 볼 미리보기, A4 지공 작업표를 제공하는 Netlify + Neon 웹앱입니다.

- 관리자: 차트 등록·수정, 클럽 공개 여부 지정, 인쇄/PDF 저장
- 클럽원: 공용 비밀번호로 로그인해 **공유된 차트만 읽기 전용 조회**
- 로그아웃 상태: 차트 API 접근 불가
- 스팬, 브리지, 홀 규격, 피치, 인서트, 엄지 타원, PAP 및 레이아웃 기록
- `4 3/8`, `7/8`, `1/64` 및 소수 치수 입력. 빈칸과 0을 구분

## 1. Netlify에 연결

Netlify에서 **Add new project → Import an existing project → GitHub**를 선택하고 이 저장소를 연결합니다. Netlify GitHub 앱이 이 저장소에 접근할 수 있어야 합니다.

`netlify.toml`에 다음 설정이 포함되어 있습니다.

| 항목 | 값 |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |
| Node.js | 22 |

## 2. 기존 Neon DB 연결 및 테이블 준비

새 DB를 자동 생성하지 않습니다. 이미 사용하는 Neon 프로젝트의 연결 주소를 사용하세요.

Netlify에 기존 Neon extension이 연결되어 있고 **`NETLIFY_DATABASE_URL`**이 제공된다면 그대로 사용합니다. 그렇지 않으면 Neon의 **Connect**에서 연결 문자열을 확인해 Netlify 환경변수 **`DATABASE_URL`**로 설정하세요. 두 값이 모두 있으면 `DATABASE_URL`이 우선합니다. DB 주소는 서버에서만 읽고 브라우저에 전달하지 않습니다.

Neon의 SQL Editor에서 [`sql/001-bowling-fit.sql`](sql/001-bowling-fit.sql)을 한 번 실행하세요. 전용 테이블 `bowling_fit_charts`, `bowling_fit_auth_attempts`만 추가하며 기존 다른 서비스의 테이블은 수정하지 않습니다. 같은 SQL을 다시 실행해도 기존 차트는 삭제되지 않습니다.

또는 로컬 `.env`에 연결 문자열을 설정한 후:

```bash
npm ci
npm run db:setup
```

기존 ChatGPT Sites의 저장 데이터는 별도 DB에 있으므로 이 코드 업로드만으로 Neon으로 이전되지 않습니다. 이 저장소에는 실제 회원 데이터나 DB 비밀번호가 포함되지 않습니다.

## 3. Netlify 환경변수 설정

프로젝트의 **Environment variables**에서 다음 값을 설정합니다. 범위를 선택할 수 있다면 **Functions**를 포함하세요. 값에 `VITE_` 접두사를 붙이지 마세요.

| 변수 | 설정 |
| --- | --- |
| `DATABASE_URL` 또는 `NETLIFY_DATABASE_URL` | 기존 Neon 연결 주소. 연동으로 이미 제공되면 중복 입력 불필요 |
| `ADMIN_PASSWORD` | 관리자 전용 비밀번호. 최소 12자 |
| `CLUB_PASSWORD` | 클럽에 전달할 공용 비밀번호. 최소 8자, 관리자 비밀번호와 다른 값 |
| `SESSION_SECRET` | 무작위 문자열. 최소 32자 |

세션 비밀키는 본인 컴퓨터에서 아래 명령으로 만들 수 있습니다.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

비밀번호·연결 문자열·세션 비밀키를 GitHub 파일, 이슈, 채팅에 올리지 마세요. 설정 후 Netlify에서 재배포하세요. 환경변수가 누락된 상태에서는 로그인과 데이터 접근이 차단되고 설정 안내가 표시됩니다.

## 4. 사용

1. 배포 주소에서 **관리자** 탭으로 로그인합니다.
2. 실측 지공값을 입력하고 저장합니다.
3. 클럽에 보여줄 차트에서 **클럽원에게 이 차트 공유**를 체크하고 다시 저장합니다.
4. 클럽원에게 배포 주소와 **클럽 공용 비밀번호**를 전달합니다.
5. 클럽원은 **클럽원 조회**로 로그인하고 공유된 작업표를 조회·인쇄합니다.

공유된 차트는 이름과 작업 메모를 포함해 전체 작업표를 클럽원이 함께 볼 수 있습니다. 사람별 개별 권한 기능은 없습니다. 공유 체크를 해제하고 저장하면 이후 조회 요청에서 제외됩니다. 이미 인쇄·다운로드한 사본은 회수되지 않습니다.

비밀번호를 변경하면 해당 역할의 기존 세션도 무효화됩니다. 세션은 최대 12시간 유지됩니다. 같은 IP와 역할에서 15분 동안 10회를 초과한 로그인 시도는 제한됩니다. 카운터는 DB에 유지됩니다. 공용 비밀번호 방식이므로 클럽원별 신원 확인은 제공하지 않습니다.

## 작업표의 범위

Jayhawk 프로숍 차트 항목을 참고한 **수치 작업표**입니다. 그림은 축척 없는 위치도이고 1:1 가공 템플릿이나 지공기 X/Y 좌표를 생성하지 않습니다. 작업표의 수치를 실측값·사용 게이지·지공기 기준과 대조해 사용하세요.

- [Jayhawk 차트](https://www.jayhawkbowling.com/Pro_s_Corner/Pro_Shop_Forms/balllayout.jpg.pdf)
- [Edge Gauge 측정 안내](https://www.jayhawkbowling.com/Pro_Shop_Manuals/jpegmanual.pdf)

## 로컬 실행과 검증

```bash
npm ci
cp .env.example .env
# .env에 본인의 설정 입력
npm run db:setup
npx netlify dev
```

`npm run dev`는 프런트엔드만 실행하므로 로그인·DB 기능까지 쓰려면 `netlify dev`를 사용하세요.

```bash
npm test
npm run build
```

테스트는 분수 정밀도, 데이터 변환, 세션 위조/만료/비밀번호 변경, 미로그인 접근 차단, 클럽원 쓰기 차단, 비공개 차트 제외, 로그인 제한, 인쇄용 데이터 검증을 포함합니다. API 테스트는 테스트용 저장소를 사용하므로 실제 Neon 접속/Netlify 배포 검증을 대신하지 않습니다.

## 구조

- `app/`: 관리자 편집 화면, 클럽 조회 화면, 인쇄용 작업표
- `lib/drill-chart.ts`: 입력값 변환과 검증
- `server/`: 세션·권한 검사, Neon 쿼리, API 처리
- `netlify/functions/api.mts`: 서버 함수 진입점
- `sql/001-bowling-fit.sql`: 최초 테이블 준비

## 호스팅 문서

- [Netlify Functions](https://docs.netlify.com/build/functions/get-started/)
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)
