# OELA Official Website — Deploy Ready

OELA 공식 사이트의 **배포 직전 버전**입니다.

## 포함 기능

- HOME
- RECORDS
  - 대회별
  - 시즌별
  - 득점 / 어시스트 / 옐로카드 / 레드카드
- REGULATIONS
  - 대회별
  - 시즌별
  - 규정 검색
- ADMIN
  - 관리자 로그인
  - 협회명 / 홈페이지 제목 / 현재 시즌 수정
  - 대회 추가 / 삭제
  - 시즌 추가
  - 선수 기록 추가 / 수정 / 삭제
  - 규정 추가 / 수정 / 삭제
- Supabase 연동
- 관리자 계정은 Supabase Auth 사용
- 공개 방문자는 데이터 읽기만 가능
- 모바일 반응형

## 중요한 점

현재 `config.js`는 `DEMO_MODE: true`입니다.
이 상태에서는 브라우저 localStorage로만 동작합니다.

실제 사이트로 운영하려면:

1. Supabase 프로젝트 생성
2. `schema.sql` 전체 실행
3. Supabase Authentication에서 관리자 이메일/비밀번호 계정 생성
4. `schema.sql` 안의 `ADMIN_EMAIL_HERE`를 실제 관리자 이메일로 변경하여 해당 `is_admin()` 함수 부분을 다시 실행
5. `config.js`에 Supabase URL과 anon/public key 입력
6. `DEMO_MODE: false`로 변경
7. GitHub에 업로드
8. Vercel에서 GitHub 저장소 Import
9. Deploy
10. Supabase Authentication → URL Configuration에서 배포된 사이트 URL을 Site URL / Redirect URL로 설정

### 보안

- `anon/public key`는 프론트엔드에 들어가도 되는 키입니다.
- `service_role` 키는 절대 `config.js`나 GitHub에 넣으면 안 됩니다.
- 실제 데이터 수정은 Supabase RLS + 관리자 이메일 검사를 통과한 인증 사용자만 가능합니다.

## 현재 데모 데이터

현재 들어 있는 Henry / Ødegaard / Saka 기록과 일부 규정은 **사이트 작동 확인용 예시 데이터**입니다.
실제 공식 기록/규정으로 사용하기 전에 관리자 페이지에서 교체하세요.

## 파일

- `index.html` — 사이트 화면
- `styles.css` — 디자인
- `app.js` — 기능 / Supabase 연동
- `config.js` — Supabase 연결 설정
- `schema.sql` — DB + RLS 정책
- `README.md` — 배포 방법
- `vercel.json` — Vercel 설정
- `netlify.toml` — Netlify 설정
