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


## v0.9.30
- 메뉴 하단 4자리 기기 데이터 로드 키 추가
- 키는 10분 유효, 1회 사용, 생성/오입력 시도 제한
- 진행 세이브/메타/랭킹 ID/PVP 프로필 이전
- 직업별 영구 성장: 노말 정상엔딩 3회당 전 능력치 +1(노말 최대 +2)
- 하드 정상엔딩 1회당 전 능력치 +1, 직업 최종 영구 보너스 최대 +3
- BAD END 및 bad:true 엔딩은 직업 성장 카운트에서 완전 제외
