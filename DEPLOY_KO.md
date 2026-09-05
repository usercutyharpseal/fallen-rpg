# v0.9.19 배포

기존 Render + Supabase 구성을 그대로 사용합니다. 새 SQL은 필요 없습니다.

`package.json`에 socket.io가 추가되었으므로 Render는 다음 배포에서 `npm install`로 자동 설치합니다.

Termux 로컬 실행도 패치 스크립트가 npm install을 실행합니다.

공개판 갱신:
```bash
cd ~/textrpg
git add .
git commit -m "Normal story PVP v0.9.19"
git push
```
