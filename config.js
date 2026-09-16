/*
  OELA 배포 설정
  1) Supabase 프로젝트를 만든다.
  2) Project Settings → API에서 URL과 anon/public key를 복사한다.
  3) 아래 두 값을 입력한다.
  4) 파일을 저장한 뒤 Vercel/Netlify/GitHub Pages에 배포한다.

  주의: anon/public key는 브라우저에 노출되는 것을 전제로 한 키다.
  service_role 키는 절대로 이 파일에 넣지 않는다.
*/

window.OELA_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  DEMO_MODE: true
};
