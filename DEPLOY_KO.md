# 몰락자 v0.9.4 공개 배포

이 프로젝트는 로컬 Termux에서도 실행되고, Node.js 웹 호스팅에 올리면 다른 사람이 링크만 눌러 플레이할 수 있습니다.

## 1. 영구 랭킹 DB 만들기 (Supabase)
1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase_setup.sql` 전체를 한 번 실행합니다.
3. 프로젝트의 Connect / API Keys 화면에서 다음 두 값을 확인합니다.
   - Project URL -> `SUPABASE_URL`
   - Secret key (`sb_secret_...`) -> `SUPABASE_SECRET_KEY`
4. Secret key는 절대 HTML, game.js, GitHub 코드에 넣지 마세요. 서버 환경변수에만 넣습니다.

구형 프로젝트라 Secret key 대신 legacy `service_role` 키만 있다면 `SUPABASE_SERVICE_ROLE_KEY` 환경변수도 호환됩니다.

## 2. 공개 서버 올리기 (Render 예시)
1. 이 폴더의 파일들을 GitHub 저장소에 올립니다.
2. Render에서 새 Web Service를 만들고 해당 저장소를 연결합니다.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment에 아래 값을 추가합니다.
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
6. 배포가 끝나면 발급된 공개 URL을 친구에게 보내면 됩니다.

`render.yaml`도 포함되어 있어서 Blueprint 방식으로 사용할 수 있습니다.

## 3. 정상 연결 확인
공개 주소 뒤에 `/api/storage`를 붙여 열었을 때 아래처럼 나오면 랭킹이 영구 DB에 저장됩니다.

```json
{"ok":true,"mode":"cloud","permanent":true}
```

게임 메인 화면에도 `● 영구 랭킹 DB 연결됨`이라고 표시됩니다.

## 주의
- DB 환경변수를 설정하지 않은 로컬 Termux 실행은 `scores.json` 백업 저장을 사용합니다.
- 공개 랭킹을 장기간 경쟁 콘텐츠로 운영하려면 이후 서버 권위형 진행 검증/로그 검증을 추가하는 것이 좋습니다. 현재 서버는 점수를 서버에서 다시 계산하고 값 범위를 제한하지만 완전한 안티치트 구조는 아닙니다.
