const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "200kb" }));

const PORT = 3000;
const SCORE_FILE = path.join(__dirname, "scores.json");

function loadScores() {
  try {
    if (!fs.existsSync(SCORE_FILE)) return [];
    return JSON.parse(fs.readFileSync(SCORE_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveScores(scores) {
  fs.writeFileSync(SCORE_FILE, JSON.stringify(scores, null, 2));
}

function calcScore(s) {
  let score = 0;

  score += Math.max(0, Number(s.progress || 0)) * 120;
  score += Math.max(0, Number(s.goldEarned || 0)) * 3;
  score += Math.max(0, Number(s.kills || 0)) * 180;
  score += Math.max(0, Number(s.talkSolved || 0)) * 160;
  score += Math.max(0, Number(s.socialSuccess || 0)) * 170;
  score += Math.max(0, Number(s.runSuccess || 0)) * 80;
  score += Math.max(0, Number(s.eliteKills || 0)) * 900;

  const bonuses = {
    "BAD END": 0,
    "명예 회복": 5000,
    "반란": 10000,
    "모두와 친구": 12000,
    "지배자": 15000
  };

  score += bonuses[s.ending] || 0;
  return Math.floor(score);
}

app.get("/api/leaderboard", (req, res) => {
  const scores = loadScores()
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  res.json(scores);
});

app.post("/api/score", (req, res) => {
  const body = req.body || {};
  const stats = body.stats || {};

  const nickname = String(body.nickname || "익명")
    .trim()
    .slice(0, 12) || "익명";

  const score = calcScore(stats);

  const entry = {
    nickname,
    className: String(body.className || "?").slice(0, 12),
    ending: String(stats.ending || "BAD END").slice(0, 20),
    score,
    kills: Math.max(0, Number(stats.kills || 0)),
    gold: Math.max(0, Number(stats.goldEarned || 0)),
    time: Date.now()
  };

  const scores = loadScores();
  scores.push(entry);

  scores.sort((a, b) => b.score - a.score);

  saveScores(scores.slice(0, 200));

  res.json({
    ok: true,
    score,
    rank: scores.findIndex(x => x === entry) + 1
  });
});

app.get("/", (req, res) => {
res.type("html").send(`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>몰락자</title>

<style>
*{box-sizing:border-box}
html,body{
  margin:0;
  min-height:100%;
  background:#090b0e;
  color:#e8e4dc;
  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif
}
body{
  min-height:100vh;
  background:
    radial-gradient(circle at 50% -20%,#25222a 0,#101217 38%,#08090c 75%);
}
button{font:inherit}
#app{
  width:min(100%,560px);
  min-height:100vh;
  margin:auto;
  position:relative;
  padding:18px 14px 28px
}
.screen{display:none}
.screen.active{display:block}
.logo{
  text-align:center;
  margin-top:10vh;
  font-family:serif;
  font-size:48px;
  letter-spacing:8px;
  font-weight:800
}
.subtitle{
  text-align:center;
  color:#89858a;
  margin:9px 0 46px;
  font-size:13px;
  letter-spacing:3px
}
.menu{
  display:grid;
  gap:12px
}
.bigbtn,.action,.choice,.shopBtn{
  border:1px solid #393b43;
  background:linear-gradient(#191b21,#111318);
  color:#eee9df;
  border-radius:10px;
  padding:15px;
  cursor:pointer;
  box-shadow:0 6px 18px #0005
}
.bigbtn:active,.action:active,.choice:active,.shopBtn:active{
  transform:translateY(1px);
  background:#22252c
}
.bigbtn.primary{
  border-color:#786c55;
  background:linear-gradient(#2c271f,#171510)
}
.small{
  font-size:12px;
  color:#99969c
}
.titlebar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:14px
}
.back{
  border:0;
  background:none;
  color:#aaa;
  font-size:26px
}
.classGrid{
  display:grid;
  gap:11px
}
.classCard{
  border:1px solid #333741;
  background:#12151a;
  border-radius:13px;
  padding:15px
}
.classCard.locked{
  opacity:.48;
  filter:saturate(.4)
}
.classTop{
  display:flex;
  justify-content:space-between;
  align-items:center
}
.className{
  font-size:22px;
  font-weight:800
}
.stats{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:7px;
  margin:12px 0
}
.stat{
  background:#0b0d11;
  border:1px solid #262930;
  padding:8px 4px;
  border-radius:8px;
  text-align:center;
  font-size:12px
}
.stat b{
  display:block;
  font-size:17px;
  margin-top:2px
}
.passive{
  font-size:13px;
  color:#c9c3b7;
  line-height:1.5
}
.selectClass{
  width:100%;
  margin-top:12px
}
.hud{
  display:grid;
  grid-template-columns:1fr auto;
  align-items:center;
  gap:9px;
  margin-bottom:11px
}
.playerName{
  font-size:14px;
  font-weight:800
}
.gold{
  font-size:14px;
  color:#e1c276
}
.hpOuter{
  height:10px;
  background:#22242a;
  border-radius:30px;
  overflow:hidden;
  margin-top:5px
}
.hpInner{
  height:100%;
  background:linear-gradient(90deg,#7d2225,#c94845);
  transition:.25s
}
.gameStats{
  color:#8e9096;
  font-size:11px;
  margin-top:5px
}
.scene{
  min-height:385px;
  border:1px solid #2c3038;
  background:
    linear-gradient(#101318e8,#0b0d11f2),
    radial-gradient(circle at 50% 20%,#343943,#101116 65%);
  border-radius:15px;
  padding:22px 18px;
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
  box-shadow:0 20px 50px #0008
}
.location{
  color:#8c8f97;
  font-size:11px;
  letter-spacing:2px;
  margin-bottom:auto
}
.enemyName{
  font-size:24px;
  font-family:serif;
  font-weight:800;
  margin-bottom:6px
}
.enemyStats{
  font-size:11px;
  color:#a4a6aa;
  margin-bottom:18px
}
.story{
  white-space:pre-line;
  line-height:1.68;
  font-family:serif;
  font-size:17px;
  min-height:110px
}
.message{
  margin-top:13px;
  padding:10px 12px;
  border-left:2px solid #70654e;
  color:#c8c1b4;
  background:#0a0b0e88;
  font-size:13px;
  min-height:39px
}
.actions{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:9px;
  margin-top:12px
}
.action{
  min-height:65px;
  text-align:left;
  padding:11px 13px
}
.action b{
  display:block;
  font-size:15px
}
.action span{
  color:#878b92;
  font-size:10px
}
.action.disabled{
  opacity:.35;
  pointer-events:none
}
.specialChoices{
  display:grid;
  gap:8px;
  margin-top:12px
}
.choice{
  text-align:left;
}
.overlay{
  position:fixed;
  inset:0;
  background:#050608e8;
  z-index:20;
  display:none;
  align-items:center;
  justify-content:center;
  padding:18px
}
.overlay.show{display:flex}
.modal{
  width:min(100%,500px);
  max-height:90vh;
  overflow:auto;
  background:#101217;
  border:1px solid #383b44;
  border-radius:16px;
  padding:20px
}
.modal h2{margin-top:0}
.shopRow{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  padding:12px 0;
  border-bottom:1px solid #272a31
}
.shopBtn{
  padding:8px 11px
}
.rankRow{
  display:grid;
  grid-template-columns:35px 1fr auto;
  gap:8px;
  padding:10px 4px;
  border-bottom:1px solid #24272d;
  font-size:13px
}
.endTitle{
  text-align:center;
  font-family:serif;
  font-size:38px;
  letter-spacing:4px;
  margin-top:15vh
}
.score{
  text-align:center;
  font-size:45px;
  font-weight:900;
  margin:25px 0
}
.resultBox{
  border:1px solid #30333b;
  border-radius:12px;
  padding:14px;
  line-height:1.9;
  font-size:13px
}
input{
  width:100%;
  background:#090b0e;
  border:1px solid #373a43;
  color:white;
  border-radius:9px;
  padding:13px;
  margin:8px 0 10px
}
.tag{
  font-size:10px;
  border:1px solid #4b4e57;
  border-radius:999px;
  padding:3px 8px;
  color:#aaa
}
</style>
</head>

<body>
<div id="app">

<section id="menuScreen" class="screen active">
  <div class="logo">몰락자</div>
  <div class="subtitle">THE FALLEN</div>

  <div class="menu">
    <button class="bigbtn primary" onclick="newGame()">새 게임</button>
    <button class="bigbtn" onclick="continueGame()">이어하기</button>
    <button class="bigbtn" onclick="showLeaderboard()">노말 모드 랭킹</button>
  </div>
</section>

<section id="classScreen" class="screen">
  <div class="titlebar">
    <button class="back" onclick="showScreen('menuScreen')">‹</button>
    <b>직업 선택</b>
    <span></span>
  </div>
  <div id="classGrid" class="classGrid"></div>
</section>

<section id="gameScreen" class="screen">
  <div class="hud">
    <div>
      <div class="playerName" id="hudClass"></div>
      <div class="hpOuter"><div id="hpBar" class="hpInner"></div></div>
      <div class="gameStats" id="hudStats"></div>
    </div>
    <div class="gold" id="hudGold"></div>
  </div>

  <div class="scene">
    <div class="location" id="location"></div>
    <div id="enemyBlock">
      <div class="enemyName" id="enemyName"></div>
      <div class="enemyStats" id="enemyStats"></div>
    </div>
    <div class="story" id="story"></div>
    <div class="message" id="message"></div>
  </div>

  <div id="specialChoices" class="specialChoices"></div>

  <div id="actions" class="actions">
    <button class="action" id="talkBtn" onclick="act('talk')">
      <b>💬 대화</b><span id="talkInfo">상대와 이야기한다</span>
    </button>

    <button class="action" id="attackBtn" onclick="act('attack')">
      <b>⚔ 공격</b><span id="attackInfo"></span>
    </button>

    <button class="action" id="socialBtn" onclick="act('social')">
      <b>🎭 처세</b><span id="socialInfo"></span>
    </button>

    <button class="action" id="runBtn" onclick="act('run')">
      <b>➜ 도망</b><span id="runInfo"></span>
    </button>
  </div>
</section>

<section id="endScreen" class="screen">
  <div id="endTitle" class="endTitle"></div>
  <div class="score" id="endScore"></div>
  <div class="resultBox" id="endStats"></div>

  <input id="nickname" maxlength="12" placeholder="랭킹에 사용할 이름">
  <button class="bigbtn primary" style="width:100%" onclick="submitScore()">기록 등록</button>
  <button class="bigbtn" style="width:100%;margin-top:8px" onclick="goMenu()">메인으로</button>
</section>

</div>

<div id="modalOverlay" class="overlay">
  <div id="modal" class="modal"></div>
</div>

<script>
const CLASSES = {
  knight:{
    name:"기사",
    hp:10, atk:8, social:2, speed:5,
    passive:"용감하지 못하면 죽음뿐",
    desc:"처세 또는 도망으로 해결하지 않은 사건을 넘길 때마다 공격력이 영구적으로 증가한다.",
    unlocked:true
  },
  noble:{
    name:"귀족",
    hp:4, atk:6, social:8, speed:7,
    passive:"잠깐 멈춰서 생각해보자고",
    desc:"처세 성공률이 높고 처세로 획득하는 골드 보상이 증가한다.",
    unlocked:true
  },
  thief:{
    name:"도둑",
    hp:3, atk:3, social:6, speed:10,
    passive:"잡을 수 있다면 잡아봐",
    desc:"상대보다 느려도 일정 확률로 도망칠 수 있다.",
    unlocked:true
  },
  spellsword:{
    name:"마검사",
    hp:6, atk:10, social:0, speed:8,
    passive:"파괴만을 위한 생명",
    desc:"아직 잠겨 있다.",
    unlocked:false
  },
  necromancer:{
    name:"망령사",
    hp:4, atk:4, social:4, speed:4,
    passive:"죽은 자들이여 일어나라",
    desc:"아직 잠겨 있다.",
    unlocked:false
  },
  dictator:{
    name:"독재자",
    hp:2, atk:8, social:8, speed:2,
    passive:"끝없는 격차",
    desc:"아직 잠겨 있다.",
    unlocked:false
  }
};

const ENEMIES = {
  gangster:{name:"거리의 깡패",hp:7,atk:5,social:5,speed:5,gold:20},
  guard:{name:"왕국 경비병",hp:9,atk:7,social:6,speed:6,gold:32},
  merchant:{name:"떠돌이 상인",hp:5,atk:3,social:9,speed:5,gold:45},
  banditScout:{name:"도적단 정찰병",hp:7,atk:6,social:5,speed:8,gold:28}
};

const state = {
  classId:null,
  p:null,
  scene:"intro",
  flags:{},
  inventory:[],
  stats:null,
  message:""
};

function baseStats(){
  return {
    progress:0,
    goldEarned:0,
    kills:0,
    talkSolved:0,
    socialSuccess:0,
    runSuccess:0,
    eliteKills:0,
    ending:""
  };
}

const SCENES = {
  intro:{
    location:"프롤로그 · 추방",
    text:
\`당신에게는 한때 이름이 있었다.

그러나 이제 당신이 돌아갈 곳은 없다.
소속되었던 곳에서 쫓겨난 당신은,
낯선 빈민가의 골목에서 눈을 뜬다.

누군가 당신의 옷자락을 잡아당긴다.\`,
    noEnemy:true,
    choices:[
      ["눈을 뜬다",()=>goto("beggars")]
    ]
  },

  beggars:{
    location:"빈민가",
    text:
\`누더기를 걸친 거지 셋이 당신을 둘러싼다.

“살아 있었군.”
“보아하니 당신도 갈 데 없는 사람 같은데.”

그들은 근처의 깡패가 자신들을 괴롭힌다며
도와달라고 부탁한다.\`,
    noEnemy:true,
    choices:[
      ["거지들과 대화한다",()=>{
        state.stats.talkSolved++;
        state.message="대화는 정보를 얻거나 사건의 다른 면을 발견할 수 있다.";
        save();
        goto("gangster");
      }],
      ["그냥 따라간다",()=>goto("gangster")]
    ]
  },

  gangster:{
    location:"빈민가 · 뒷골목",
    enemy:"gangster",
    text:
\`덩치 큰 남자가 길을 막는다.

“또 너희냐?”

거지들은 당신 뒤로 숨는다.

“저놈이에요. 매일 우릴 괴롭혀요!”\`,
    talk(){
      if(!state.flags.gangsterTruth){
        state.flags.gangsterTruth=true;
        state.message=
          "깡패: “괴롭혀? 저놈들이 내 돈주머니를 세 번이나 훔쳤어.”\\n" +
          "거지들의 표정이 굳는다. 사건의 진실을 알게 되었다.";
      }else{
        state.message="깡패: “내 돈만 돌려받으면 끝낼 생각이다.”";
      }
      save();
      render();
    },
    socialSuccess(){
      state.flags.gangsterPeace=true;
      gainGold(8);
      state.stats.talkSolved++;
      state.message="당신은 양쪽을 중재했다. 거지들은 훔친 돈 일부를 돌려주고 깡패는 물러났다.";
      resolvePeacefully("shop");
    },
    attackWin(){
      gainGold(20);
      state.flags.gangsterKilled=true;
      state.message="깡패는 쓰러졌다. 거지들은 환호했지만, 진실은 조금 찜찜하게 남았다.";
      resolveKill("shop");
    },
    runSuccess(){
      state.message="당신은 거지들과 깡패를 뒤로하고 골목을 빠져나왔다.";
      resolveRun("shop");
    }
  },

  shop:{
    location:"길가의 상점",
    text:
\`작은 상점 하나가 보인다.

지금 가진 돈으로 물건을 준비한 뒤,
왕국으로 향할지 숲으로 들어갈지 정해야 한다.\`,
    noEnemy:true,
    onEnter(){
      openShop(true);
    },
    choices:[
      ["왕국으로 향한다",()=>goto("kingdomGate")],
      ["숲으로 들어간다",()=>goto("forestMerchant")]
    ]
  },

  kingdomGate:{
    location:"왕국 · 성문",
    enemy:"guard",
    text:
\`높은 성벽 아래 경비병이 창을 세운다.

“멈춰. 왕국에 들어오려면 신분과 목적을 밝혀라.”

성문 너머로 수많은 시민들의 소리가 들린다.\`,
    talk(){
      state.message="경비병: “최근 도적단 때문에 검문이 강화됐다. 이상한 짓만 하지 마라.”";
      state.flags.guardTalked=true;
      save();
      render();
    },
    socialSuccess(){
      state.flags.kingdomFriendly=true;
      state.message="경비병은 당신의 말을 납득하고 성문을 열어준다.";
      resolvePeacefully("kingdomStub");
    },
    attackWin(){
      state.flags.guardKilled=true;
      state.flags.kingdomHostile=true;
      gainGold(32);
      state.message="경비병이 쓰러졌다. 왕국 안쪽에서 경종이 울리기 시작한다.";
      resolveKill("kingdomStub");
    },
    runSuccess(){
      state.message="왕국 진입을 포기하고 숲 쪽으로 몸을 돌렸다.";
      resolveRun("forestMerchant");
    }
  },

  kingdomStub:{
    location:"왕국 · 중앙가",
    text:
\`왕국의 중앙가에 들어섰다.

시민, 상점, 친위대, 그리고 도적단에 대한 소문.
당신의 선택은 이제 왕국 전체에 영향을 미치게 된다.

[다음 패치에서 왕국 본편이 이어집니다.]\`,
    noEnemy:true,
    choices:[
      ["현재 기록 저장",()=>{
        state.message="저장 완료. 다음 패치에서 이 지점부터 이어갈 수 있다.";
        save();
        render();
      }],
      ["메인으로",()=>goMenu()]
    ]
  },

  forestMerchant:{
    location:"숲 · 초입",
    enemy:"merchant",
    text:
\`숲길 한복판에서 짐수레를 끌던 상인이 당신을 발견한다.

“이 시간에 혼자 숲으로?”
“물건이 필요하다면 돈부터 보여줘.”

그는 경계하고 있지만 적대적이지는 않다.\`,
    talk(){
      state.flags.merchantAlive=true;
      state.message="상인: “이 앞엔 도적단이 돌아다녀. 특히 간부들은 건드리지 않는 게 좋아.”";
      save();
      render();
    },
    socialSuccess(){
      state.flags.merchantAlive=true;
      addItem("고급 붕대");
      state.message="상인은 당신의 말솜씨에 넘어가 고급 붕대 하나를 건넸다.";
      resolvePeacefully("forestStub");
    },
    attackWin(){
      state.flags.merchantKilled=true;
      gainGold(45);
      addItem("상인의 물약");
      state.message="상인의 짐을 뒤졌다. 돈과 물약을 얻었지만 이 일은 누군가의 귀에 들어갈 것이다.";
      resolveKill("forestStub");
    },
    runSuccess(){
      state.flags.merchantAlive=true;
      state.message="상인을 지나쳐 숲 안쪽으로 들어갔다.";
      resolveRun("forestStub");
    }
  },

  forestStub:{
    location:"숲 · 깊은 길",
    text:
\`숲은 생각보다 깊다.

멀리서 여러 사람의 발소리와,
누군가 도움을 요청하는 소리가 희미하게 들려온다.

[다음 패치에서 상인 납치 / 도적단 간부 루트가 이어집니다.]\`,
    noEnemy:true,
    choices:[
      ["현재 기록 저장",()=>{
        state.message="저장 완료. 다음 패치에서 이 지점부터 이어갈 수 있다.";
        save();
        render();
      }],
      ["메인으로",()=>goMenu()]
    ]
  }
};

function showScreen(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function newGame(){
  renderClasses();
  showScreen("classScreen");
}

function renderClasses(){
  const root=document.getElementById("classGrid");
  root.innerHTML="";

  Object.entries(CLASSES).forEach(([id,c])=>{
    const el=document.createElement("div");
    el.className="classCard"+(c.unlocked?"":" locked");

    el.innerHTML=\`
      <div class="classTop">
        <div class="className">\${c.unlocked?"":"🔒 "}\${c.name}</div>
        <span class="tag">\${c.unlocked?"선택 가능":"잠김"}</span>
      </div>

      <div class="stats">
        <div class="stat">체력<b>\${c.hp}</b></div>
        <div class="stat">공격<b>\${c.atk}</b></div>
        <div class="stat">처세<b>\${c.social}</b></div>
        <div class="stat">속도<b>\${c.speed}</b></div>
      </div>

      <div class="passive">
        <b>\${c.passive}</b><br>
        \${c.desc}
      </div>

      <button class="bigbtn selectClass"
        \${c.unlocked?"":"disabled"}
        onclick="selectClass('\${id}')">
        \${c.unlocked?"이 직업으로 시작":"해금되지 않음"}
      </button>
    \`;

    root.appendChild(el);
  });
}

function selectClass(id){
  const c=CLASSES[id];
  if(!c || !c.unlocked)return;

  state.classId=id;
  state.p={
    className:c.name,
    maxHp:c.hp,
    hp:c.hp,
    atk:c.atk,
    social:c.social,
    speed:c.speed,
    gold:10
  };
  state.scene="intro";
  state.flags={};
  state.inventory=[];
  state.stats=baseStats();
  state.message="";
  save();
  showScreen("gameScreen");
  enterScene("intro");
}

function currentScene(){
  return SCENES[state.scene];
}

function currentEnemy(){
  const s=currentScene();
  return s && s.enemy ? ENEMIES[s.enemy] : null;
}

function attackChance(enemy){
  if(!enemy)return 0;
  const mine=Math.max(1,state.p.hp*state.p.atk);
  const theirs=Math.max(1,enemy.hp*enemy.atk);
  return clamp(Math.round(mine/(mine+theirs)*100),5,95);
}

function socialChance(enemy){
  if(!enemy)return 0;

  const mine=Math.max(0,state.p.social);
  const theirs=Math.max(1,enemy.social);

  let chance=Math.round((mine/(mine+theirs))*100);

  if(state.classId==="noble") chance+=15;
  if(state.flags.gangsterTruth && state.scene==="gangster") chance+=18;

  return clamp(chance,5,95);
}

function thiefRunChance(enemy){
  if(state.p.speed>enemy.speed)return 100;

  const ratio=state.p.speed/Math.max(1,enemy.speed);
  return clamp(Math.round(33+(Math.min(1,ratio)*17)),33,50);
}

function runChance(enemy){
  if(!enemy)return 100;
  if(state.p.speed>enemy.speed)return 100;
  if(state.classId==="thief")return thiefRunChance(enemy);
  return 0;
}

function act(type){
  const scene=currentScene();
  const enemy=currentEnemy();
  if(!enemy)return;

  if(type==="talk"){
    if(scene.talk)scene.talk();
    else{
      state.message="상대는 별다른 말을 하지 않는다.";
      render();
    }
    return;
  }

  if(type==="attack"){
    const chance=attackChance(enemy);

    if(Math.random()*100<chance){
      const damage=Math.min(
        Math.max(0,Math.floor(enemy.atk*(0.15+Math.random()*0.2))),
        Math.max(0,state.p.hp-1)
      );

      state.p.hp-=damage;

      if(scene.attackWin)scene.attackWin();
      return;
    }

    die(enemy.name+"과의 전투에서 패배했다.");
    return;
  }

  if(type==="social"){
    const chance=socialChance(enemy);

    if(Math.random()*100<chance){
      state.stats.socialSuccess++;

      if(state.classId==="noble"){
        const bonus=Math.max(2,Math.round((enemy.gold||10)*0.25));
        gainGold(bonus);
      }

      if(scene.socialSuccess)scene.socialSuccess();
      return;
    }

    state.message="처세에 실패했다. 상대의 경계가 더욱 심해졌다.";
    state.flags.socialFailed=(state.flags.socialFailed||0)+1;
    save();
    render();
    return;
  }

  if(type==="run"){
    const chance=runChance(enemy);

    if(chance<=0){
      state.message="상대의 속도가 당신과 같거나 더 빠르다. 도망칠 수 없다.";
      render();
      return;
    }

    if(chance===100 || Math.random()*100<chance){
      state.stats.runSuccess++;
      if(scene.runSuccess)scene.runSuccess();
    }else{
      state.message="도망치려 했지만 붙잡혔다.";
      const damage=Math.max(1,Math.floor(enemy.atk/2));
      state.p.hp-=damage;

      if(state.p.hp<=0){
        die("도망치다 붙잡혀 목숨을 잃었다.");
      }else{
        save();
        render();
      }
    }
  }
}

function resolveKill(next){
  state.stats.kills++;
  resolveEvent("attack");
  setTimeout(()=>goto(next),650);
}

function resolvePeacefully(next){
  resolveEvent("peace");
  setTimeout(()=>goto(next),650);
}

function resolveRun(next){
  resolveEvent("run");
  setTimeout(()=>goto(next),650);
}

function resolveEvent(method){
  state.stats.progress++;

  if(state.classId==="knight" && method!=="social" && method!=="run"){
    state.p.atk++;
    state.message += "\\n\\n[기사] 신조를 지켰다. 공격력 +1";
  }

  save();
  render();
}

function goto(id){
  state.scene=id;
  state.stats.progress++;
  save();
  enterScene(id);
}

function enterScene(id){
  showScreen("gameScreen");
  const s=SCENES[id];

  if(s && s.onEnter && !state.flags["entered_"+id]){
    state.flags["entered_"+id]=true;
    save();
    setTimeout(()=>s.onEnter(),250);
  }

  render();
}

function render(){
  const s=currentScene();
  if(!s||!state.p)return;

  document.getElementById("hudClass").textContent=
    state.p.className+"  ·  공격 "+state.p.atk;

  document.getElementById("hudStats").textContent=
    "HP "+state.p.hp+"/"+state.p.maxHp+
    "   처세 "+state.p.social+
    "   속도 "+state.p.speed;

  document.getElementById("hudGold").textContent="◆ "+state.p.gold;

  document.getElementById("hpBar").style.width=
    Math.max(0,state.p.hp/state.p.maxHp*100)+"%";

  document.getElementById("location").textContent=s.location||"";
  document.getElementById("story").textContent=s.text||"";
  document.getElementById("message").textContent=state.message||"";

  const enemy=currentEnemy();
  const enemyBlock=document.getElementById("enemyBlock");
  const actions=document.getElementById("actions");
  const choices=document.getElementById("specialChoices");

  choices.innerHTML="";

  if(s.noEnemy){
    enemyBlock.style.display="none";
    actions.style.display="none";

    (s.choices||[]).forEach(([label,fn])=>{
      const b=document.createElement("button");
      b.className="choice";
      b.textContent=label;
      b.onclick=fn;
      choices.appendChild(b);
    });

    return;
  }

  enemyBlock.style.display="block";
  actions.style.display="grid";

  document.getElementById("enemyName").textContent=enemy.name;
  document.getElementById("enemyStats").textContent=
    "체력 "+enemy.hp+
    " · 공격 "+enemy.atk+
    " · 처세 "+enemy.social+
    " · 속도 "+enemy.speed;

  const atk=attackChance(enemy);
  const soc=socialChance(enemy);
  const run=runChance(enemy);

  document.getElementById("attackInfo").textContent="예상 승률 "+atk+"%";
  document.getElementById("socialInfo").textContent="성공률 "+soc+"%";

  document.getElementById("runInfo").textContent=
    run===100 ? "반드시 성공" :
    run===0 ? "도망 불가능" :
    "성공률 "+run+"%";

  document.getElementById("runBtn").classList.toggle("disabled",run===0);
}

function gainGold(amount){
  amount=Math.max(0,Math.floor(amount));
  state.p.gold+=amount;
  state.stats.goldEarned+=amount;
}

function addItem(name){
  state.inventory.push(name);
}

function openShop(firstTime=false){
  const overlay=document.getElementById("modalOverlay");
  const modal=document.getElementById("modal");

  modal.innerHTML=\`
    <h2>길가의 상점</h2>
    <div class="small">보유 골드: <b id="shopGold">\${state.p.gold}</b></div>

    <div class="shopRow">
      <div>
        <b>붕대</b>
        <div class="small">체력 2 회복</div>
      </div>
      <button class="shopBtn" onclick="buyHeal(8,2)">◆ 8</button>
    </div>

    <div class="shopRow">
      <div>
        <b>좋은 식사</b>
        <div class="small">최대 체력 +1, 즉시 회복</div>
      </div>
      <button class="shopBtn" onclick="buyMaxHp(18)">◆ 18</button>
    </div>

    <div class="shopRow">
      <div>
        <b>숫돌</b>
        <div class="small">공격력 +1</div>
      </div>
      <button class="shopBtn" onclick="buyAtk(24)">◆ 24</button>
    </div>

    <button class="bigbtn primary" style="width:100%;margin-top:16px"
      onclick="closeModal()">상점을 나간다</button>
  \`;

  overlay.classList.add("show");
}

function buyHeal(cost,amount){
  if(state.p.gold<cost)return alert("골드가 부족하다.");
  if(state.p.hp>=state.p.maxHp)return alert("이미 체력이 가득 차 있다.");

  state.p.gold-=cost;
  state.p.hp=Math.min(state.p.maxHp,state.p.hp+amount);
  save();
  openShop();
}

function buyMaxHp(cost){
  if(state.p.gold<cost)return alert("골드가 부족하다.");

  state.p.gold-=cost;
  state.p.maxHp++;
  state.p.hp++;
  save();
  openShop();
}

function buyAtk(cost){
  if(state.p.gold<cost)return alert("골드가 부족하다.");

  state.p.gold-=cost;
  state.p.atk++;
  save();
  openShop();
}

function closeModal(){
  document.getElementById("modalOverlay").classList.remove("show");
  render();
}

function continueGame(){
  const raw=localStorage.getItem("fallen_save");

  if(!raw){
    alert("저장된 게임이 없다.");
    return;
  }

  try{
    const data=JSON.parse(raw);
    Object.assign(state,data);

    if(!state.p||!state.scene)throw new Error();

    enterScene(state.scene);
  }catch{
    alert("저장 데이터를 불러오지 못했다.");
  }
}

function save(){
  localStorage.setItem("fallen_save",JSON.stringify(state));
}

function die(reason){
  state.p.hp=0;
  state.stats.ending="BAD END";
  state.message=reason;
  finishRun("BAD END",reason);
}

function clientScore(){
  const s=state.stats;
  let score=0;

  score+=Number(s.progress||0)*120;
  score+=Number(s.goldEarned||0)*3;
  score+=Number(s.kills||0)*180;
  score+=Number(s.talkSolved||0)*160;
  score+=Number(s.socialSuccess||0)*170;
  score+=Number(s.runSuccess||0)*80;
  score+=Number(s.eliteKills||0)*900;

  const b={
    "BAD END":0,
    "명예 회복":5000,
    "반란":10000,
    "모두와 친구":12000,
    "지배자":15000
  };

  score+=b[s.ending]||0;
  return Math.floor(score);
}

function finishRun(ending,reason=""){
  state.stats.ending=ending;
  save();

  document.getElementById("endTitle").textContent=ending;
  document.getElementById("endScore").textContent=
    clientScore().toLocaleString();

  document.getElementById("endStats").innerHTML=
    (reason?reason+"<br><br>":"")+
    "진행도: "+state.stats.progress+"<br>"+
    "처치: "+state.stats.kills+"<br>"+
    "대화 해결: "+state.stats.talkSolved+"<br>"+
    "처세 성공: "+state.stats.socialSuccess+"<br>"+
    "도망 성공: "+state.stats.runSuccess+"<br>"+
    "획득 골드: "+state.stats.goldEarned;

  showScreen("endScreen");
}

async function submitScore(){
  const nickname=document.getElementById("nickname").value.trim()||"익명";

  try{
    const res=await fetch("/api/score",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        nickname,
        className:state.p.className,
        stats:state.stats
      })
    });

    const data=await res.json();
    alert("기록 등록 완료! 점수 "+data.score.toLocaleString());
  }catch{
    const pending=JSON.parse(localStorage.getItem("pending_scores")||"[]");
    pending.push({
      nickname,
      className:state.p.className,
      stats:state.stats
    });
    localStorage.setItem("pending_scores",JSON.stringify(pending));
    alert("오프라인 상태라 기록을 기기에 보관했다.");
  }
}

async function flushPending(){
  const pending=JSON.parse(localStorage.getItem("pending_scores")||"[]");
  if(!pending.length)return;

  const remain=[];

  for(const p of pending){
    try{
      const r=await fetch("/api/score",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(p)
      });

      if(!r.ok)remain.push(p);
    }catch{
      remain.push(p);
    }
  }

  localStorage.setItem("pending_scores",JSON.stringify(remain));
}

async function showLeaderboard(){
  const overlay=document.getElementById("modalOverlay");
  const modal=document.getElementById("modal");

  modal.innerHTML="<h2>노말 모드 랭킹</h2><div class='small'>불러오는 중...</div>";
  overlay.classList.add("show");

  try{
    const res=await fetch("/api/leaderboard");
    const rows=await res.json();

    modal.innerHTML=
      "<h2>노말 모드 랭킹</h2>"+
      (rows.length?rows.map((x,i)=>\`
        <div class="rankRow">
          <b>\${i+1}</b>
          <div>
            <b>\${escapeHtml(x.nickname)}</b>
            <div class="small">\${escapeHtml(x.className)} · \${escapeHtml(x.ending)}</div>
          </div>
          <b>\${Number(x.score).toLocaleString()}</b>
        </div>
      \`).join(""):"<p class='small'>아직 등록된 기록이 없다.</p>")+
      "<button class='bigbtn' style='width:100%;margin-top:15px' onclick='closeModal()'>닫기</button>";

  }catch{
    modal.innerHTML=
      "<h2>노말 모드 랭킹</h2>"+
      "<p class='small'>서버에 연결하지 못했다.</p>"+
      "<button class='bigbtn' style='width:100%' onclick='closeModal()'>닫기</button>";
  }
}

function escapeHtml(v){
  return String(v)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function goMenu(){
  closeModal();
  showScreen("menuScreen");
}

function clamp(v,min,max){
  return Math.max(min,Math.min(max,v));
}

flushPending();
</script>
</body>
</html>`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("================================");
  console.log(" 몰락자 - Normal Prototype");
  console.log(" http://localhost:" + PORT);
  console.log("================================");
  console.log("");
});
