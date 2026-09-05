# v0.9.26 배포

Termux에서 기존 `~/textrpg` v0.9.25에 패치 파일을 적용합니다.

```bash
bash ~/storage/downloads/fallen_patch_v0926.sh
```

적용 후 Git 배포:

```bash
cd ~/textrpg
git add .
git commit -m "Lord Algon detail + unified ranking v0.9.26"
git push
```

확인 포인트:
- 메인 화면 `THE FALLEN · v0.9.26`
- HARD SOLO 시작 골드 30
- 하드 프롤로그 직후 북부 경계 장터
- 최후의 기사 / 데몬 알터닐은 프리뷰 유지
- 통합 랭킹에 NORMAL/HARD 기록이 함께 표시
