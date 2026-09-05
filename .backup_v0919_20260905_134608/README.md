# 몰락자 v0.9.17

## 이번 버전
- 새 게임: 직업 선택 후 `노말 / 하드` 모드 선택
- 하드 모드: `솔로 / PVP` 선택 화면까지 제공, 이후 고품질 개발 중 화면
- 외설/욕설 닉네임 필터 강화 (클라이언트 + 서버 2중 검증)
- 기존 노말 모드/세이브/랭킹 로직 유지

## 확장 구조
`public/game.js`의 `GAME_MODES`에 항목을 추가하면 상위 모드 카드가 자동 생성됩니다.
`HARD_VARIANTS`에 항목을 추가하면 하드 세부 모드 카드가 자동 생성됩니다.

하드 세부모드를 실제 개발할 때는 해당 항목의 `developmentOnly`를 `false`로 바꾸고 `enter()` 함수를 연결하면 됩니다. 모드 버튼용 클릭 이벤트를 별도로 추가할 필요가 없습니다.

노말 시작 시 세이브에 `flags.gameMode = 'normal'`, `flags.gameVariant = 'story'`가 기록되므로 향후 하드 솔로/PVP 세이브를 분리하기 쉽습니다.

닉네임 검열은 `NICK_BLOCK_CONTAINS`, `NICK_BLOCK_EXACT`, `NICK_JAMO_CONTAINS`, `NICK_BLOCK_CONTEXT`로 나뉘어 있어 규칙을 추가하기 쉽습니다. 서버와 클라이언트 규칙은 반드시 함께 수정하세요.
