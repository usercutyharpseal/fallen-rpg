# v0.9.5 배포

기존 Render/Supabase를 그대로 사용합니다. 새 SQL은 필요 없습니다.

Termux에서 패치를 적용한 뒤:

```bash
cd ~/textrpg
git add .
git commit -m "Run ranking and special endings v0.9.5"
git push
```

Render 자동 배포 후 메인 화면에 `NORMAL MODE · v0.9.5`가 표시되는지 확인하세요.

랭킹은 이제 개인 최고와 개별 플레이 기록을 분리합니다. 낮은 점수도 플레이 기록으로 영구 저장됩니다.
