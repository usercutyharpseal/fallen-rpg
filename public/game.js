'use strict';

const SAVE_KEY = 'fallen_normal_v08';
const PLAYER_ID_KEY = 'fallen_player_id';
const PENDING_KEY = 'fallen_pending_scores';

const CLASSES = {
  knight: {
    name: '기사', hp: 10, atk: 8, social: 2, speed: 5, unlocked: true,
    passive: '용감하지 못하면 죽음뿐',
    desc: '처세나 도망으로 사건을 끝내지 않을 때마다 공격력이 1 오른다.'
  },
  noble: {
    name: '귀족', hp: 4, atk: 6, social: 8, speed: 7, unlocked: true,
    passive: '잠깐 멈춰서 생각해보자고',
    desc: '처세 성공률이 상승하고 처세로 얻는 보상이 더 커진다.'
  },
  thief: {
    name: '도둑', hp: 3, atk: 3, social: 6, speed: 10, unlocked: true,
    passive: '잡을 수 있다면 잡아봐',
    desc: '상대보다 느려도 33~50% 확률로 도망칠 수 있다.'
  },
  spellsword: {
    name: '마검사', hp: 6, atk: 10, social: 0, speed: 8, unlocked: false,
    passive: '파괴만을 위한 생명', desc: '???'
  },
  necromancer: {
    name: '망령사', hp: 4, atk: 4, social: 4, speed: 4, unlocked: false,
    passive: '죽은 자들이여 일어나라', desc: '???'
  },
  dictator: {
    name: '독재자', hp: 2, atk: 8, social: 8, speed: 2, unlocked: false,
    passive: '끝없는 격차', desc: '???'
  }
};

const ENEMIES = {
  gangster: { name:'거리의 깡패', hp:7, atk:5, social:5, speed:5, gold:20, rank:'보통' },
  gateGuard: { name:'왕국 경비병', hp:9, atk:7, social:7, speed:6, gold:30, rank:'보통' },
  citizen: { name:'왕국 시민', hp:3, atk:1, social:6, speed:4, gold:12, rank:'약함' },
  alarmGuard: { name:'출동한 경비병', hp:11, atk:9, social:11, speed:7, gold:36, rank:'강함' },
  captain: { name:'친위대장 레오른', hp:18, atk:14, social:18, speed:9, gold:80, rank:'매우 강함', elite:true },
  oldGuard: { name:'늙은 노인', hp:28, atk:20, social:24, speed:8, gold:150, rank:'전설', elite:true },
  banditScout: { name:'도적단 정찰병', hp:7, atk:6, social:6, speed:8, gold:24, rank:'보통' },
  banditOfficer1: { name:'도적단 간부 · 갈고리', hp:12, atk:9, social:10, speed:8, gold:48, rank:'강함', elite:true },
  banditOfficer2: { name:'도적단 간부 · 붉은 모자', hp:13, atk:10, social:11, speed:9, gold:52, rank:'강함', elite:true },
  noviceKnight: { name:'상인협회 초급 기사', hp:10, atk:8, social:9, speed:7, gold:42, rank:'보통' },
  midKnight: { name:'상인협회 중급 기사', hp:21, atk:16, social:23, speed:9, gold:95, rank:'매우 강함', elite:true },
  banditBoss: { name:'도적단 두목 세리아', hp:17, atk:12, social:17, speed:10, gold:110, rank:'두목', elite:true },
  king: { name:'격분한 왕 에드란', hp:22, atk:17, social:25, speed:9, gold:180, rank:'왕', elite:true }
};

const ENDINGS = {
  'BAD END': { icon:'†', kind:'BAD END', bonus:0, epilogue:'당신의 여정은 여기서 끝났다.\n하지만 실패조차 하나의 기록으로 남는다.' },
  '명예 회복': { icon:'⚜', kind:'NORMAL END', bonus:5000, epilogue:'도적단의 깃발이 쓰러졌다.\n한때 쫓겨났던 당신의 이름은 다시 사람들의 입에 오르기 시작했다.' },
  '반란': { icon:'⚔', kind:'HARD END', bonus:10000, epilogue:'왕의 분노도 왕국의 성벽도 끝내 당신들을 막지 못했다.\n새로운 질서가 피와 함성 속에서 시작된다.' },
  '모두와 친구': { icon:'◇', kind:'SECRET END', bonus:12000, epilogue:'칼을 뽑지 않고도 바뀌는 것이 있었다.\n왕국과 도적단, 상인들은 불편한 평화를 받아들였다. 그리고 그 중심에 당신이 있었다.' },
  '지배자': { icon:'♛', kind:'LEGEND END', bonus:15000, epilogue:'전설마저 쓰러졌다.\n왕좌를 지킬 자도, 당신에게 명령할 자도 더는 남지 않았다.' }
};

function freshState() {
  return {
    version: 91,
    classId: null,
    p: null,
    sceneId: 'intro',
    flags: {},
    relation: { kingdom:0, bandits:0, merchants:0 },
    inventory: [],
    socialUsed: {},
    runUsed: {},
    escapeAttempted: false,
    escapeSerial: 0,
    talkCount: {},
    encounterMods: {},
    entered: {},
    lastToast: '',
    pending: null,
    ended: false,
    stats: {
      progress:0, goldEarned:0, goldSpent:0, kills:0, eliteKills:0, riskyWins:0,
      talkSolved:0, socialSuccess:0, socialFail:0, runSuccess:0, secrets:0,
      survivors:0, growths:0, comebackWins:0, talkInteractions:0, itemsUsed:0, ending:'', maxAttackChanceBeaten:100
    }
  };
}

let state = freshState();

function scene(id, data) { return { id, ...data }; }

const SCENES = {
  intro: scene('intro', {
    chapter:'PROLOGUE', location:'추방된 길', art:'exile',
    text:`당신에게는 한때 이름이 있었다.\n\n당신이 속했던 곳도, 돌아갈 자리도 있었다.\n그러나 몰락은 짧았고 추방은 빨랐다.\n\n비가 그친 새벽, 당신은 빈민가 끝자락에서 눈을 뜬다.`,
    choices:() => [
      c('몸을 일으킨다', '빈민가 쪽에서 누군가 다가온다.', () => go('beggars'))
    ]
  }),

  beggars: scene('beggars', {
    chapter:'CHAPTER 1', location:'빈민가 · 무너진 골목', art:'beggars',
    text:`누더기를 걸친 거지 셋이 당신을 둘러싼다.\n\n“살아 있었군.”\n“보아하니 당신도 갈 데 없는 사람 같네.”\n\n그들은 자신들을 괴롭히는 깡패를 혼내 달라고 부탁한다.`,
    choices:() => [
      c('거지들의 이야기를 더 듣는다', '대화는 정보와 숨겨진 선택을 만든다.', () => {
        state.stats.talkSolved++; queueOutcome('거지들은 깡패가 있는 골목과 그가 주로 나타나는 시간을 알려준다.\n\n그들 중 늙은 거지가 출발하기 전에 잠깐 쉬어가라고 손짓한다.', 'beggarCamp');
      }),
      c('곧바로 나갈 준비를 한다', '거지들의 임시 거처를 지나 깡패를 찾아간다.', () => go('beggarCamp'))
    ]
  }),

  gangster: scene('gangster', {
    chapter:'CHAPTER 1', location:'빈민가 · 뒷골목', art:'gangster', enemy:'gangster',
    text:`덩치 큰 남자가 벽에서 등을 떼고 일어난다.\n\n“또 너희냐?”\n\n거지들은 당신 뒤로 숨는다.\n“저놈이에요. 매일 우릴 괴롭혀요!”`,
    talk() {
      const n = bumpTalk('gangster');
      if (n === 1) {
        state.flags.gangsterTruth = true; state.stats.secrets++;
        toast('진실 발견 · 거지들이 먼저 돈을 훔쳤다.', 'good');
      } else toast('깡패는 훔친 돈만 돌려받으면 된다고 말한다.');
      render(); save();
    },
    choices() {
      if (!state.flags.gangsterTruth) return [];
      return [
        c('거지들에게 돈을 돌려주라고 한다', '싸움 없이 오해를 푼다.', () => {
          state.flags.gangsterPeace = true; state.relation.kingdom += 0;
          state.stats.talkSolved++; gainGold(8); resolve('talk', 'roadsideAftermath', '오해를 풀었다. 깡패는 물러났고 거지들은 마지못해 돈을 돌려줬다.');
        })
      ];
    },
    socialSuccess() {
      state.flags.gangsterPeace = true; gainGold(state.classId === 'noble' ? 14 : 9);
      resolve('social', 'roadsideAftermath', '당신은 양쪽을 체면 상하지 않게 갈라놓았다.');
    },
    socialFail() {
      state.flags.gangsterAngry = true;
      damagePlayer(1, false); go('gangsterAngry', '처세 실패 · 깡패가 당신을 밀쳐냈다. HP -1');
    },
    attackWin() {
      state.flags.gangsterKilled = true; gainGold(20);
      resolve('attack', 'roadsideAftermath', '깡패가 골목 바닥에 쓰러졌다. 거지들은 환호한다.');
    },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  gangsterAngry: scene('gangsterAngry', {
    chapter:'CHAPTER 1', location:'빈민가 · 뒷골목', art:'gangster', enemy:'gangster',
    text:`“말장난은 그만하지.”\n\n깡패가 한 걸음 다가온다.\n이미 한 번 속이려 든 탓에 분위기는 더 나빠졌다.`,
    socialDisabled:true,
    talk() { toast('“훔친 돈부터 내놔. 아니면 비켜.”'); },
    attackWin(){ state.flags.gangsterKilled=true; gainGold(20); resolve('attack','roadsideAftermath','결국 주먹과 칼로 끝났다.'); },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  shop: scene('shop', {
    chapter:'CHAPTER 2', location:'갈림길의 상점', art:'shop',
    text:`빈민가를 벗어나자 낡은 상점 하나가 길목을 지키고 있다.\n\n앞으로는 두 길이다.\n성벽과 사람이 있는 왕국, 혹은 소문만 무성한 깊은 숲.`,
    onFirstEnter() { setTimeout(() => openShop(), 260); },
    choices:() => [
      c('상점에 들어간다', '골드로 생존력을 준비한다.', openShop),
      c('왕국으로 향한다', '성문과 경비병이 기다린다.', () => go('kingdomGate')),
      c('숲으로 들어간다', '상인과 도적단의 흔적이 있는 길.', () => go('forestMerchant'))
    ]
  }),

  kingdomGate: scene('kingdomGate', {
    chapter:'CHAPTER 3A', location:'왕국 · 동문', art:'gate', enemy:'gateGuard',
    text:`높은 성벽 아래, 경비병이 창끝으로 길을 막는다.\n\n“멈춰. 신분과 목적을 밝혀라.”\n\n성문 너머에서는 시장의 소음과 종소리가 겹쳐 들린다.`,
    talk() {
      const n=bumpTalk('kingdomGate');
      if(n===1){ state.flags.banditRumor=true; toast('경비병 · “도적단 때문에 검문이 강화됐다.”','good'); }
      else toast('경비병은 더 할 말이 없다는 듯 창을 고쳐 잡는다.');
      render(); save();
    },
    socialSuccess(){ state.flags.kingdomFriendly=true; state.relation.kingdom+=2; resolve('social','cityEntry','경비병은 당신을 믿고 성문을 열었다.'); },
    socialFail(){ state.flags.gateSuspicious=true; go('gateSuspicious','처세 실패 · 경비병이 통행세 8골드를 요구한다.'); },
    attackWin(){ state.flags.guardKilled=true; state.flags.kingdomHostile=true; state.relation.kingdom-=4; gainGold(30); resolve('attack','cityAlarm','경종이 울린다. 당신은 피 묻은 채 성문을 넘었다.'); },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  gateSuspicious: scene('gateSuspicious', {
    chapter:'CHAPTER 3A', location:'왕국 · 동문', art:'gate', enemy:'gateGuard', socialDisabled:true,
    text:`“신분도 애매하고 말도 수상하군.”\n\n경비병이 손을 내민다.\n“8골드. 내고 들어가든가, 돌아가.”`,
    choices:() => state.p.gold >= 8 ? [c('통행세 8골드를 낸다','골드를 잃지만 싸움은 피한다.',()=>{spendGold(8);state.relation.kingdom+=1;resolve('talk','cityEntry','경비병이 길을 비켜준다.');})] : [],
    talk(){ toast('“8골드. 더 할 말 없다.”'); },
    attackWin(){ state.flags.guardKilled=true;state.flags.kingdomHostile=true;state.relation.kingdom-=4;gainGold(30);resolve('attack','cityAlarm','경비병을 쓰러뜨리고 강제로 진입했다.'); },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  citySquare: scene('citySquare', {
    chapter:'CHAPTER 4A', location:'왕국 · 중앙가', art:'city',
    text:`왕국의 중앙가는 생각보다 평범하다.\n상인들은 값을 외치고, 시민들은 전쟁과 세금과 도적단을 이야기한다.\n\n당신이 무엇을 하느냐에 따라 이 평범함은 오래가지 않을 수도 있다.`,
    choices:() => [
      c('시민에게 말을 건다','도적단과 왕국의 사정을 들을 수 있다.',()=>go('citizen')),
      c('시장 사람들을 둘러본다','상인, 행상인, 소매치기와 작은 사건들이 있다.',()=>go('marketCrowd')),
      c('허름한 주점에 들어간다','여행자와 병사들의 소문을 듣는다.',()=>go('tavernExtras')),
      c('공용 훈련장을 찾아간다','한 번만 능력치를 성장시킬 수 있다.',()=>go('trainingYard')),
      c('거리 치료소를 돕는다','한 번만 체력 성장 기회를 얻는다.',()=>go('streetClinic')),
      c('전령소 앞의 소동을 본다','추격에 참여하면 속도 성장 기회가 있다.',()=>go('courierJob')),
      c('친위대 모집소를 찾아간다','도적단 토벌에 지원한다.',()=>go('enlist')),
      c('왕국 상점을 이용한다','장비와 회복품을 산다.',openShop),
      c('숲으로 나간다','도적단을 직접 찾아본다.',()=>go('forestMerchant'))
    ]
  }),

  citizen: scene('citizen', {
    chapter:'CHAPTER 4A', location:'왕국 · 시장 골목', art:'citizen', enemy:'citizen',
    text:`빵을 든 시민 하나가 당신을 힐끗 본다.\n\n“처음 보는 얼굴이네. 요즘 같은 때엔 낯선 사람도 무섭다니까.”`,
    talk(){
      state.flags.banditRumor=true; state.relation.kingdom++; state.stats.talkSolved++;
      queueOutcome('시민 · “도적단이 왕국을 노린대. 친위대도 사람을 모으고 있어.”\n\n시장의 소문 속에서 친위대 모집 이야기를 확인했다.', 'citySquare');
    },
    socialSuccess(){ state.relation.kingdom+=2; gainGold(state.classId==='noble'?10:5); resolve('social','citySquare','시민은 당신을 믿고 작은 도움까지 건넸다.'); },
    socialFail(){ state.relation.kingdom--; go('citizenSuspicious','처세 실패 · 시민이 큰 소리로 경비를 부르려 한다.'); },
    attackWin(){ state.flags.citizenKilled=true;state.flags.kingdomHostile=true;state.relation.kingdom-=6;gainGold(12);resolve('attack','guardResponse','시민이 쓰러지자 비명이 시장을 가른다.'); },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  citizenSuspicious: scene('citizenSuspicious', {
    chapter:'CHAPTER 4A', location:'왕국 · 시장 골목', art:'city', enemy:'citizen', socialDisabled:true,
    text:`“경비! 여기 수상한 사람이—”\n\n시민이 뒤로 물러난다. 처세는 이미 실패했다.`,
    talk(){ state.flags.citizenEscaped=true; queueOutcome('말을 붙잡는 사이 시민이 경비 초소로 달려갔다.\n\n당신을 향한 경비의 발소리가 가까워진다.', 'guardResponse'); },
    attackWin(){ state.flags.citizenKilled=true;state.flags.kingdomHostile=true;state.relation.kingdom-=6;resolve('attack','guardResponse','목격자는 사라졌지만 이미 늦었다. 경비가 달려온다.'); },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  cityAlarm: scene('cityAlarm', {
    chapter:'HOSTILE ROUTE', location:'왕국 · 경종 아래', art:'alarm',
    text:`성문 경비의 시체가 발견됐다.\n경종이 세 번 울리고 시민들은 문을 닫아건다.\n\n당신을 찾는 발소리가 가까워진다.`,
    choices:() => [c('다가오는 경비를 맞는다','이제 말로 풀기는 어렵다.',()=>go('guardResponse'))]
  }),

  guardResponse: scene('guardResponse', {
    chapter:'HOSTILE ROUTE', location:'왕국 · 중앙가', art:'alarm', enemy:'alarmGuard',
    text:`무장한 경비가 사람들을 밀쳐내며 달려온다.\n\n“무기를 버려!”`,
    talk(){ toast('경비는 이미 명령을 받았다. “무기를 버려!”'); },
    socialSuccess(){ state.relation.kingdom-=1; resolve('social','citySquare','간신히 다른 사람을 범인으로 몰았다. 하지만 의심은 남았다.'); },
    socialFail(){ state.flags.kingdomHostile=true; state.relation.kingdom-=2; go('guardFurious','처세 실패 · 경비가 즉시 검을 뽑았다.'); },
    attackWin(){ state.flags.guardResponseKilled=true;state.flags.kingdomHostile=true;state.relation.kingdom-=4;gainGold(36);resolve('attack','captainEnraged','경비까지 쓰러졌다. 이제 친위대장이 직접 움직인다.'); },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  guardFurious: scene('guardFurious', {
    chapter:'HOSTILE ROUTE', location:'왕국 · 중앙가', art:'alarm', enemy:'alarmGuard', socialDisabled:true,
    text:`“입은 그만 놀려.”\n경비가 검을 뽑아 당신의 퇴로를 압박한다.`,
    talk(){ toast('대답 대신 검끝이 움직였다.'); },
    attackWin(){ state.flags.guardResponseKilled=true;state.flags.kingdomHostile=true;gainGold(36);resolve('attack','captainEnraged','경비가 쓰러지자 더 무거운 발소리가 들려온다.'); },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  captainEnraged: scene('captainEnraged', {
    chapter:'HOSTILE ROUTE', location:'왕궁 앞 대로', art:'captain', enemy:'captain', socialPenalty:20,
    text:`은빛 갑옷의 남자가 홀로 길을 막는다.\n친위대장 레오른.\n\n그는 당신 뒤의 시체들을 한 번 보고는 얼굴을 굳힌다.\n“네가 죽인 사람들의 얼굴을 하나라도 기억하나?”`,
    talk(){
      state.flags.captainTalkPenalty=(state.flags.captainTalkPenalty||0)+2;
      toast('“입 닥쳐.” · 친위대장의 공격력이 상승했다.','bad'); render(); save();
    },
    enemyMod(e){ e.atk += state.flags.captainTalkPenalty||0; return e; },
    socialSuccess(){ resolve('social','oldVeteran','그는 당신을 용서하지 않았다. 다만 더 큰 판단을 위해 검을 잠시 거뒀다.'); },
    socialFail(){ state.flags.captainTalkPenalty=(state.flags.captainTalkPenalty||0)+2; toast('처세 실패 · 친위대장의 분노가 더 커졌다. 공격력 +2','bad'); render(); save(); },
    attackWin(){ state.flags.captainKilled=true;state.relation.kingdom-=8;gainGold(80);resolve('attack','lootRoyalShop','친위대장마저 쓰러졌다. 왕궁으로 향하는 길이 열렸다.'); },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  lootRoyalShop: scene('lootRoyalShop', {
    chapter:'HOSTILE ROUTE', location:'봉쇄된 왕국 상점', art:'shop',
    text:`상점가는 이미 비었다.\n닫힌 문을 부수자 주인 없는 금화와 물자가 나온다.\n\n당신을 막으러 오는 군인은 더 이상 보이지 않는다.`,
    onFirstEnter(){ gainGold(70); addItem('고급 붕대',2); toast('약탈 · 골드 +70 / 고급 붕대 +2','good'); },
    choices:() => [c('왕궁으로 향한다','길모퉁이에서 늙은 노인이 기다리고 있다.',()=>go('oldVeteran'))]
  }),

  oldVeteran: scene('oldVeteran', {
    chapter:'LEGEND', location:'왕궁으로 향하는 돌계단', art:'oldguard', enemy:'oldGuard', socialPenalty:10,
    text:`허름한 외투를 입은 늙은 노인이 계단 중앙에 서 있다.\n\n“여기까지 왔으면, 네가 뭘 원하는지는 들어봐야겠지.”\n\n그의 자세는 이상할 정도로 빈틈이 없다.`,
    talk(){
      if(!state.flags.oldGuardIdentity){ state.flags.oldGuardIdentity=true; state.stats.secrets++; toast('전설의 정체 · 은퇴한 전 친위대장 아르벤','good'); }
      else toast('아르벤 · “왕을 만나고 싶다면 검부터 내려놓게.”');
      render(); save();
    },
    choices(){
      return state.flags.oldGuardIdentity ? [c('검을 내리고 왕을 만나게 해달라고 한다','전설과 싸우지 않는 길.',()=>{state.stats.talkSolved++;resolve('talk','kingAudience','아르벤은 한참 당신을 보다가 왕궁 문을 열어준다.');})] : [];
    },
    socialSuccess(){ resolve('social','kingAudience','아르벤은 당신에게 마지막 기회를 주기로 한다.'); },
    socialFail(){ state.flags.oldGuardBuff=(state.flags.oldGuardBuff||0)+3; toast('처세 실패 · 아르벤이 당신의 수를 읽었다. 공격력 +3','bad'); render();save(); },
    enemyMod(e){ e.atk += state.flags.oldGuardBuff||0; return e; },
    attackWin(){ state.flags.oldGuardKilled=true;gainGold(150);resolve('attack',null,'전설이 무릎을 꿇었다.\n\n왕궁을 지킬 마지막 칼이 사라졌다. 노인은 마지막 숨을 내쉬며 왕궁 쪽을 바라본다.', '지배자'); },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  kingAudience: scene('kingAudience', {
    chapter:'ROYAL AUDIENCE', location:'왕궁 · 알현실', art:'king',
    text:`왕 에드란은 텅 빈 알현실에서 당신을 내려다본다.\n\n“네가 무슨 짓을 했는지는 알고 있다.”\n“그래도 도적단을 무너뜨릴 힘이 있다면, 한 번은 쓸 수 있겠지.”`,
    choices:() => [
      c('도적단 토벌을 받아들인다','명예를 되찾을 마지막 기회.',()=>{state.relation.kingdom+=1;go('royalSupply');}),
      c('왕에게 칼을 겨눈다','왕은 즉시 격분한다.',()=>go('kingEnraged'))
    ]
  }),

  enlist: scene('enlist', {
    chapter:'ROYAL ROUTE', location:'친위대 모집소', art:'barracks',
    text:`모집소의 장교는 당신의 몰락한 신분을 오래 들여다본다.\n\n“과거가 어떻든 상관없다. 지금 필요한 건 도적단을 막을 칼이야.”`,
    choices:() => [
      c('도적단 토벌에 지원한다','가장 정석적인 명예 회복 루트.',()=>{state.flags.enlisted=true;state.relation.kingdom+=3;go('barracksTraining');}),
      c('생각을 바꿔 중앙가로 돌아간다','아직 다른 선택을 할 수 있다.',()=>go('citySquare'))
    ]
  }),

  banditScoutRoyal: scene('banditScoutRoyal', {
    chapter:'ROYAL ROUTE', location:'왕국 외곽 · 목책길', art:'bandits', enemy:'banditScout',
    text:`정찰 도중 도적 하나가 나무 위에서 내려온다.\n\n“왕국 개가 또 왔네.”`,
    talk(){ state.flags.heardBanditSide=true; state.relation.bandits++; toast('도적은 왕국의 세금과 강제 징발 이야기를 꺼낸다.','good'); render();save(); },
    choices(){ return state.flags.heardBanditSide ? [c('도적들의 사정을 더 듣는다','왕국 편을 버릴 수도 있다.',()=>go('banditOffer'))] : []; },
    socialSuccess(){ state.relation.bandits++; resolve('social','royalSupply','싸움을 피하면서 도적단의 위치를 알아냈다.'); },
    socialFail(){ go('banditScoutCornered','처세 실패 · 정찰병이 지원 신호를 보내려 한다.'); },
    attackWin(){ gainGold(24);resolve('attack','royalSupply','정찰병을 제거하고 도적단의 흔적을 확보했다.'); },
    runSuccess(){ handleEscapeSuccess(); }
  }),

  banditScoutCornered: scene('banditScoutCornered', {
    chapter:'ROYAL ROUTE', location:'왕국 외곽 · 목책길', art:'bandits', enemy:'banditScout', socialDisabled:true,
    text:`도적이 손가락을 입에 가져간다.\n지원 신호가 울리기 전에 결정을 내려야 한다.`,
    talk(){ toast('대화할 시간은 끝났다.'); },
    attackWin(){gainGold(24);resolve('attack','royalSupply','지원 신호가 울리기 전에 정찰병을 쓰러뜨렸다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  royalSupply: scene('royalSupply', {
    chapter:'ROYAL ROUTE', location:'친위대 임시 보급소', art:'camp',
    text:`도적단 본거지로 들어가기 전 마지막 보급소다.\n친위대원들은 당신을 아직 완전히 믿지는 않지만, 필요한 물자는 건넨다.`,
    onFirstEnter(){ addItem('고급 붕대',1);addItem('강심제',1);addItem('행운의 동전',1); heal(2,false); toast('보급 · 고급 붕대 +1 / 강심제 +1 / 행운의 동전 +1 / 체력 일부 회복','good'); },
    choices:() => [
      c('보급 상점을 이용한다','마지막 준비.',openShop),
      c('도적단 본거지로 진입한다','출발 전 야영지에서 마지막 밤을 보낸다.',()=>go('campNight'))
    ]
  }),

  banditOffer: scene('banditOffer', {
    chapter:'CROSSROAD', location:'숲 · 숨겨진 야영지', art:'banditcamp',
    text:`도적들은 당신을 죽이지 않았다.\n대신 왕국이 외면한 사람들의 이야기를 들려준다.\n\n“명예를 되찾고 싶어서 저들의 칼이 될 거야?”\n“아니면 우리와 같이 판을 뒤집을래?”`,
    choices:() => [
      c('왕국 편으로 돌아간다','도적단 두목을 처치한다.',()=>go('banditBossRoyal')),
      c('도적단에 합류한다','왕국에 반란을 일으킨다.',()=>{state.relation.bandits+=3;state.flags.rebel=true;go('rebelMarch');})
    ]
  }),

  banditBossRoyal: scene('banditBossRoyal', {
    chapter:'ROYAL ROUTE · BOSS', location:'도적단 본거지', art:'boss', enemy:'banditBoss',
    text:`붉은 천막 앞에 세리아가 서 있다.\n\n“왕국에서 명예를 되찾겠다고 여기까지 왔어?”\n“그럼 네 명예가 몇 명의 목숨 값인지 보여줘.”`,
    talk(){ state.flags.bossTalked=true;state.relation.bandits++;toast('세리아의 사정을 들었다. 반란에 합류할 선택이 열렸다.','good');render();save(); },
    choices(){ return state.flags.bossTalked ? [c('세리아의 제안을 받아들인다','왕국을 공격한다.',()=>{state.flags.rebel=true;state.relation.bandits+=2;go('rebelMarch');})] : []; },
    socialSuccess(){
      state.relation.bandits+=2;
      if(canFriendEnding()) finish('모두와 친구');
      else resolve('social','banditTruce','세리아는 당신과의 싸움을 미뤘다. 아직 왕국과의 관계를 정리해야 한다.');
    },
    socialFail(){ state.flags.bossAngry=true;go('banditBossAngry','처세 실패 · 세리아가 칼을 뽑았다. 다시 속일 기회는 없다.'); },
    attackWin(){state.flags.banditBossKilled=true;gainGold(110);resolve('attack',null,'세리아가 쓰러졌다.\n\n도적단의 깃발이 내려가고, 왕국으로 돌아갈 길만 남았다.', '명예 회복');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  banditBossAngry: scene('banditBossAngry', {
    chapter:'BOSS', location:'도적단 본거지', art:'boss', enemy:'banditBoss', socialDisabled:true,
    text:`“말로 시간을 벌 생각은 버려.”\n세리아가 칼을 뽑는다.`,
    talk(){toast('세리아는 더 이상 대답하지 않는다.');},
    attackWin(){state.flags.banditBossKilled=true;gainGold(110);resolve('attack',null,'두목을 쓰러뜨렸다.\n\n남은 도적들은 무기를 버리거나 숲으로 흩어진다.', '명예 회복');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  banditTruce: scene('banditTruce', {
    chapter:'TRUCE', location:'숲과 왕국 사이', art:'crossroad',
    text:`도적단과의 싸움은 피했지만 왕국과의 갈등은 남았다.\n양쪽을 모두 설득할 수 있다면, 피를 흘리지 않고 끝낼 가능성도 있다.`,
    choices:() => [
      c('왕국으로 돌아가 중재를 시도한다','왕국과 도적단 모두의 신뢰가 필요하다.',()=>{
        if(canFriendEnding()) finish('모두와 친구');
        else go('kingdomGate');
      }),
      !state.flags.rebellionRetreated && c('도적단과 왕국을 공격한다','반란 루트로 전환.',()=>{state.flags.rebel=true;go('rebelMarch');})
    ].filter(Boolean)
  }),

  rebelMarch: scene('rebelMarch', {
    chapter:'REBELLION', location:'왕국 앞 평원', art:'rebel',
    text:`도적단의 깃발이 숲을 빠져나온다.\n왕국의 성문은 닫히고 성벽 위로 궁수들이 늘어선다.\n\n친위대장 레오른이 직접 성문 앞에 선다.`,
    choices:() => [c('반란군과 함께 진격한다','친위대장과의 전투.',()=>go('captainRebel'))]
  }),

  captainRebel: scene('captainRebel', {
    chapter:'REBELLION', location:'왕국 · 부서진 성문', art:'captain', enemy:'captain', socialPenalty:15,
    text:`레오른은 뒤에 선 시민들을 한 번 돌아본 뒤 검을 뽑는다.\n\n“여기서부터는 한 발도 못 간다.”`,
    talk(){toast('친위대장은 투항 외의 대답을 듣지 않는다.');},
    socialSuccess(){ state.flags.captainWeakened=true; toast('처세 성공 · 친위대 일부가 동요했다. 친위대장의 공격력 -3','good');render();save(); },
    socialFail(){ state.flags.captainRebelBuff=(state.flags.captainRebelBuff||0)+2;toast('처세 실패 · 친위대의 사기가 올랐다. 공격력 +2','bad');render();save(); },
    enemyMod(e){ e.atk += (state.flags.captainRebelBuff||0); if(state.flags.captainWeakened)e.atk=Math.max(1,e.atk-3);return e;},
    attackWin(){state.flags.captainKilled=true;gainGold(80);resolve('attack','kingEnraged','친위대장이 쓰러진다. 왕이 직접 전장으로 내려온다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  kingEnraged: scene('kingEnraged', {
    chapter:'REBELLION · FINAL', location:'왕궁 앞', art:'kingrage', enemy:'king', socialPenalty:25,
    text:`왕 에드란이 피 묻은 망토를 끌며 계단을 내려온다.\n\n“내 병사와 백성을 죽이고도 말이 필요하다고 생각하느냐?”\n\n분노한 왕에게 남은 것은 결판뿐이다.`,
    talk(){state.flags.kingBuff=(state.flags.kingBuff||0)+2;toast('왕의 분노만 키웠다. 공격력 +2','bad');render();save();},
    socialSuccess(){state.flags.kingShaken=true;toast('처세 성공 · 왕의 판단이 흔들렸다. 공격력 -2','good');render();save();},
    socialFail(){state.flags.kingBuff=(state.flags.kingBuff||0)+3;toast('처세 실패 · 왕의 공격력 +3','bad');render();save();},
    enemyMod(e){e.atk+=(state.flags.kingBuff||0);if(state.flags.kingShaken)e.atk=Math.max(1,e.atk-2);return e;},
    attackWin(){gainGold(180);resolve('attack',null,'왕이 쓰러졌다.\n\n성문 위의 깃발이 천천히 내려가고, 반란군의 함성이 왕궁을 덮는다.', '반란');},
    runSuccess(){ handleEscapeSuccess(); }
  }),


  kingdomEscape: scene('kingdomEscape', {
    chapter:'ESCAPE', location:'왕국 외곽 · 폐쇄된 수로', art:'crossroad',
    text:()=>`성벽의 경종이 멀어질 때까지 달렸다.\n\n왕국 안으로 돌아가는 길은 당분간 위험하다. 뒤에서는 수색대의 횃불이 움직이고, 앞에는 숲으로 이어지는 오래된 수로와 버려진 길만 남아 있다.\n\n이번 도주는 이전 사건을 되돌리지 않는다. 이미 지나온 인물과 사건은 그대로 지나온 것으로 남는다.`,
    choices:() => [
      c('숲의 우회로로 빠진다','현재 진행도에 맞는 숲 구간으로 이어진다.',()=>go(forestProgressScene(true))),
      (state.relation.bandits>=2 || state.flags.banditTruce || state.flags.rebel) && c('도적단 쪽 연락망을 찾는다','도적단과 접점이 있다면 휴전 지점으로 향한다.',()=>go('banditTruce'))
    ].filter(Boolean)
  }),

  rebelRetreat: scene('rebelRetreat', {
    chapter:'REBELLION · RETREAT', location:'왕국과 숲 사이 · 후퇴로', art:'crossroad',
    text:()=>`전장의 함성은 뒤로 멀어진다.\n\n당신은 결판을 포기하고 살아남는 쪽을 택했다. 반란군도 왕국군도 지금의 당신을 완전히 믿지 않는다. 같은 전투로 곧장 되돌아가 다시 도망치는 일은 없다.\n\n남은 길은 칼을 거두고 양쪽 사이의 틈을 찾는 것뿐이다.`,
    choices:() => [
      c('도적단과 다시 접촉한다','재공격이 아니라 휴전과 협상 쪽으로 돌아간다.',()=>{state.flags.rebellionRetreated=true;go('banditTruce');}),
      c('숲 깊은 곳으로 몸을 숨긴다','후반 숲 진행 지점으로 빠져나간다.',()=>{state.flags.rebellionRetreated=true;go(forestProgressScene(true));})
    ]
  }),

  forestMerchant: scene('forestMerchant', {
    chapter:'CHAPTER 3B', location:'숲 · 초입', art:'merchant', enemy:'merchantDummy',
    text:`짐수레를 끌던 상인이 당신을 발견한다.\n\n“이 시간에 혼자 숲으로?”\n“물건이 필요하면 돈부터 보여줘.”\n\n그는 경계하지만 아직 적대적이지 않다.`,
    enemyOverride:{name:'떠돌이 상인 로벤',hp:5,atk:3,social:10,speed:5,gold:45,rank:'비전투원'},
    talk(){ state.flags.merchantAlive=true;state.relation.merchants+=2;state.stats.talkSolved++;queueOutcome('로벤 · “이 앞엔 도적단 간부들이 돌아다녀. 특히 둘은 건드리지 마.”\n\n그는 숲길의 지름길과 위험한 구역까지 알려준다.', 'forestRoad'); },
    socialSuccess(){state.flags.merchantAlive=true;state.relation.merchants+=1;addItem('상인의 물약',1);addItem('은빛 브로치',1);resolve('social','forestRoad','로벤은 혀를 차면서도 물약과 작은 브로치를 건넨다.\n\n상인의 물약 +1 / 은빛 브로치 +1. 다음 협상에서 쓸 만한 물건이다.');},
    socialFail(){state.flags.merchantAlive=true;state.relation.merchants-=1;go('merchantOffended','처세 실패 · 상인이 가격을 두 배로 부르며 등을 돌린다.');},
    attackWin(){state.flags.merchantKilled=true;state.relation.merchants-=6;gainGold(45);addItem('상인의 물약',1);resolve('attack','forestRoad','상인의 짐수레를 털었다. 이 일은 상인협회에 알려질 것이다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  merchantOffended: scene('merchantOffended', {
    chapter:'CHAPTER 3B', location:'숲 · 초입', art:'merchant',
    text:`“공짜로 뜯어낼 생각이면 다른 데 알아봐.”\n상인은 짐수레를 끌고 먼저 숲길을 떠났다.`,
    choices:() => [c('뒤늦게 숲 안쪽으로 향한다','상인과 다시 만날 수도 있다.',()=>go('forestRoad'))]
  }),

  forestRoad: scene('forestRoad', {
    chapter:'CHAPTER 4B', location:'숲 · 갈라진 길', art:'forest',
    text:`해가 나무 뒤로 기울 무렵, 앞쪽에서 짧은 비명과 수레가 넘어지는 소리가 들린다.`,
    choices:() => [
      !state.flags.hunterDone && c('사냥꾼의 작은 야영지에 들른다','전투나 발놀림을 배울 수 있다.',()=>go('hunterCamp')),
      !state.flags.herbalistDone && c('약초 냄새를 따라간다','숲의 약초꾼을 만난다.',()=>go('forestHerbalist')),
      !state.flags.travelerDone && c('길을 잃은 여행자를 돕는다','대화와 정보에 관한 작은 사건.',()=>go('lostTraveler')),
      c(state.flags.merchantAlive ? '비명이 난 곳으로 달려간다' : '도적단의 흔적을 따라간다', state.flags.merchantAlive?'상인이 도적단에게 붙잡힌 듯하다.':'숲 깊은 곳에 도적단이 있다.',()=>go('forestExtrasGate')),
      c('주변을 조사한다','숨겨진 보급품을 찾을 수도 있다.',()=>{
        if(!state.flags.forestCache){state.flags.forestCache=true;state.stats.secrets++;addItem('고급 붕대',1);addItem('관찰자의 렌즈',1);queueOutcome('낙엽 아래 방수포를 발견했다.\n\n고급 붕대 +1 / 관찰자의 렌즈 +1. 누군가 급히 버리고 간 정찰 보급품인 듯하다.',null);}
        else toast('더 찾을 것은 없다.');
      })
    ].filter(Boolean)
  }),

  merchantCaptured: scene('merchantCaptured', {
    chapter:'FOREST ROUTE', location:'숲 · 버려진 야영지', art:'capture', enemy:'banditOfficer1',
    text:`로벤이 나무에 묶여 있다.\n그 앞을 갈고리 모양 칼을 든 도적단 간부가 지킨다.\n\n“상인 하나 때문에 목숨 걸 생각은 아니겠지?”`,
    talk(){state.relation.bandits++;toast('간부는 상인협회가 도적단의 거래를 끊었다고 말한다.','good');render();save();},
    socialSuccess(){state.flags.officer1Allied=true;state.relation.bandits+=2;state.flags.merchantAbandoned=true;resolve('social','officer2','상인을 두고 가는 조건으로 도적단과의 충돌을 피했다.');},
    socialFail(){state.flags.officer1Angry=true;go('officer1Angry','처세 실패 · 간부가 로벤을 다치게 하고 칼을 겨눈다.');},
    attackWin(){state.flags.officer1Killed=true;state.relation.bandits-=3;gainGold(48);state.relation.merchants+=3;addItem('철제 부적',1);resolve('attack','officer2','간부를 쓰러뜨리고 로벤을 구했다. 상인은 철제 부적을 보상으로 건넸다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  officer1Angry: scene('officer1Angry', {
    chapter:'FOREST ROUTE', location:'숲 · 버려진 야영지', art:'capture', enemy:'banditOfficer1', socialDisabled:true,
    text:`로벤이 신음한다.\n“이제 거래는 끝났어.”`,
    talk(){toast('간부는 더 이상 협상하지 않는다.');},
    attackWin(){state.flags.officer1Killed=true;state.relation.bandits-=3;state.relation.merchants+=2;gainGold(48);resolve('attack','officer2','간부를 쓰러뜨리고 상인을 풀어줬다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  officer2: scene('officer2', {
    chapter:'FOREST ROUTE', location:'숲 · 돌다리', art:'officer', enemy:'banditOfficer2',
    text:`돌다리 위에서 붉은 모자를 쓴 여자가 손을 들어 길을 막는다.\n\n“갈고리를 만났지? 살아서 여기 왔다는 건 어느 쪽이든 재미있네.”`,
    talk(){state.flags.officer2Talked=true;state.relation.bandits++;toast('그녀는 두목 세리아가 왕국과 전쟁을 준비 중이라고 알려준다.','good');render();save();},
    choices(){return state.flags.officer2Talked?[c('도적단과 협력하겠다고 한다','세리아를 만나기 위한 길.',()=>{state.flags.officer2Allied=true;state.relation.bandits+=2;resolve('talk','banditCampLife','붉은 모자가 길을 비켜준다.');})]:[];},
    socialSuccess(){state.flags.officer2Allied=true;state.relation.bandits+=2;resolve('social','banditCampLife','당신은 적이 아니라는 인상을 심는 데 성공했다.');},
    socialFail(){state.flags.officer2Angry=true;go('officer2Angry','처세 실패 · 붉은 모자가 웃으며 칼을 뽑는다.');},
    attackWin(){state.flags.officer2Killed=true;state.relation.bandits-=3;gainGold(52);resolve('attack','banditCampLife','두 번째 간부도 쓰러졌다. 세리아의 본거지가 가까워진다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  officer2Angry: scene('officer2Angry', {
    chapter:'FOREST ROUTE', location:'숲 · 돌다리', art:'officer', enemy:'banditOfficer2', socialDisabled:true,
    text:`“그럴듯했는데 아쉽네.”\n붉은 모자가 칼날을 낮게 세운다.`,
    talk(){toast('그녀는 웃기만 한다.');},
    attackWin(){state.flags.officer2Killed=true;state.relation.bandits-=3;gainGold(52);resolve('attack','banditCampLife','두 번째 간부가 쓰러졌다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  guildNovice: scene('guildNovice', {
    chapter:'MERCHANT GUILD', location:'숲 · 교역로', art:'guild', enemy:'noviceKnight',
    text:`상인협회의 문장이 새겨진 작은 방패가 길을 막는다.\n초급 기사 한 명이 당신과 도적들을 번갈아 본다.\n\n“도적단과 함께 있는 이유를 설명해.”`,
    talk(){toast('기사는 도적단과 손을 끊으면 보내주겠다고 한다.');},
    socialSuccess(){state.relation.merchants++;resolve('social','forestBeforeBoss','당신은 임시 협력자일 뿐이라고 둘러댔다.');},
    socialFail(){state.relation.merchants--;go('guildNoviceAngry','처세 실패 · 기사가 협회에 신호를 보냈다.');},
    attackWin(){state.flags.noviceKilled=true;state.relation.merchants-=5;gainGold(42);resolve('attack','forestBeforeBoss','초급 기사가 쓰러졌다. 이 죽음은 나중에 대가를 요구할 것이다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  guildNoviceAngry: scene('guildNoviceAngry', {
    chapter:'MERCHANT GUILD', location:'숲 · 교역로', art:'guild', enemy:'noviceKnight', socialDisabled:true,
    text:`“협회에 보고했다.”\n초급 기사가 검을 뽑는다.`,
    talk(){toast('설명할 기회는 끝났다.');},
    attackWin(){state.flags.noviceKilled=true;state.relation.merchants-=5;gainGold(42);resolve('attack','forestBeforeBoss','기사를 쓰러뜨렸다. 상인협회가 반드시 움직일 것이다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  forestBeforeBoss: scene('forestBeforeBoss', {
    chapter:'FOREST ROUTE', location:'도적단 본거지 외곽', art:'banditcamp',
    text:`도적단 본거지의 횃불이 나무 사이로 보인다.\n여기서부터는 세리아의 영역이다.`,
    choices:() => [
      c('잠시 장비를 점검한다','가방과 회복품을 확인한다.',openBag),
      c('본거지로 들어간다', state.flags.noviceKilled?'상인협회의 추격자가 먼저 기다린다.':'도적단 두목을 만난다.',()=>go(state.flags.noviceKilled?'midKnight':'banditBossForest'))
    ]
  }),

  midKnight: scene('midKnight', {
    chapter:'MERCHANT GUILD · PURSUER', location:'도적단 본거지 앞', art:'midknight', enemy:'midKnight', socialDisabled:true,
    text:`검은 망토의 기사가 길 한가운데 서 있다.\n방패에는 상인협회의 은빛 문장이 박혀 있다.\n\n“초급 기사를 죽인 자가 너구나.”`,
    talk(){state.flags.midKnightBuff=(state.flags.midKnightBuff||0)+3;toast('대화를 시도한 틈을 읽혔다. 중급 기사 공격력 +3','bad');render();save();},
    enemyMod(e){e.atk+=(state.flags.midKnightBuff||0);return e;},
    attackWin(){state.flags.midKnightKilled=true;state.relation.merchants-=4;gainGold(95);resolve('attack','banditBossForest','중급 기사까지 쓰러졌다. 상인협회와의 관계는 돌이킬 수 없다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  banditBossForest: scene('banditBossForest', {
    chapter:'FOREST ROUTE · FINAL', location:'도적단 본거지', art:'boss', enemy:'banditBoss',
    text:`세리아가 지도 위에 꽂힌 단검을 뽑는다.\n\n“내 간부들을 죽였든, 친구가 됐든 결국 여기까지 왔네.”\n“그래서 넌 어느 편이지?”`,
    talk(){state.flags.bossTalked=true;state.relation.bandits++;toast('세리아는 왕국을 공격할 계획과 그 이유를 모두 털어놓는다.','good');render();save();},
    choices(){
      const arr=[];
      if(state.flags.bossTalked) arr.push(c('세리아를 도와 왕국을 공격한다','반란 엔딩으로 향한다.',()=>{state.flags.rebel=true;state.relation.bandits+=2;go('rebelMarch');}));
      return arr;
    },
    socialSuccess(){
      state.relation.bandits+=3;
      if(canFriendEnding()) finish('모두와 친구');
      else { state.flags.banditTruce=true; resolve('social','friendBridge','세리아와의 싸움을 피했다. 이제 왕국과의 관계까지 이어야 한다.'); }
    },
    socialFail(){go('banditBossAngryForest','처세 실패 · 세리아는 당신이 어느 편도 아니라고 판단했다.');},
    attackWin(){state.flags.banditBossKilled=true;state.relation.bandits-=5;gainGold(110);resolve('attack',null,'세리아를 쓰러뜨렸다.\n\n왕국은 당신의 공을 인정할 수밖에 없다.', '명예 회복');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  banditBossAngryForest: scene('banditBossAngryForest', {
    chapter:'FOREST ROUTE · FINAL', location:'도적단 본거지', art:'boss', enemy:'banditBoss', socialDisabled:true,
    text:`“그만. 넌 네 입으로 네 편을 정했어.”\n세리아가 단검을 든다.`,
    talk(){toast('더 이상 대화는 통하지 않는다.');},
    attackWin(){state.flags.banditBossKilled=true;gainGold(110);resolve('attack',null,'세리아가 쓰러졌다.\n\n본거지의 소란이 잦아들고 살아남은 자들이 무기를 버린다.', '명예 회복');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  friendBridge: scene('friendBridge', {
    chapter:'FINAL CROSSROAD', location:'왕국과 숲 사이의 오래된 다리', art:'crossroad',
    text:`숲도 왕국도 등 뒤에 있다.\n당신은 어느 한쪽을 완전히 무너뜨리지 않았다.\n\n남은 것은 서로에게 칼을 겨누는 이유를 멈추게 하는 일이다.`,
    choices:() => [
      c('왕국과 도적단의 협상을 주선한다','관계와 생존한 인물에 따라 결과가 달라진다.',()=>{
        if(canFriendEnding(true)) finish('모두와 친구');
        else go('kingdomGate');
      }),
      !state.flags.rebellionRetreated && c('도적단에 돌아가 왕국을 공격한다','반란으로 끝을 본다.',()=>{state.flags.rebel=true;go('rebelMarch');})
    ].filter(Boolean)
  }),

  beggarCamp: scene('beggarCamp', {
    chapter:'CHAPTER 1 · EXTRA', location:'빈민가 · 천막촌', art:'beggars',
    text:`깡패를 만나러 가기 전, 거지들의 임시 거처를 지난다.

불 위에는 묽은 수프가 끓고 있다. 한쪽에서는 다친 노인이 물통을 옮기려 애쓰고, 어린아이는 찢어진 신발끈을 묶는다.

누구도 당신에게 영웅이 되어 달라고 하진 않는다. 하지만 잠깐 손을 보탤 수는 있다.`,
    choices:() => [
      c('노인의 물통을 대신 옮긴다','고된 일을 하며 몸을 다시 깨운다. 최대 체력 +1',()=>takeGrowth('beggarHp','hp','무너진 골목을 몇 번이나 오가며 물통을 나른다.\n\n숨은 차지만 몸에 힘이 돌아온다. 최대 체력 +1','gangster')),
      c('거지들의 이야기를 끝까지 듣는다','사람의 말투와 눈치를 읽는다. 처세 +1',()=>takeGrowth('beggarSocial','social','서로 다른 세 사람의 말을 듣다 보니 거짓말과 진심의 차이가 조금 보이기 시작한다.\n\n처세 +1','gangster')),
      c('골목을 한 바퀴 뛰어 정찰한다','빈민가의 좁은 길에 익숙해진다. 속도 +1',()=>takeGrowth('beggarSpeed','speed','막힌 길과 낮은 담을 넘으며 깡패가 있는 골목까지 가장 빠른 길을 외웠다.\n\n속도 +1','gangster')),
      c('아무것도 하지 않고 출발한다','성장은 없지만 바로 사건으로 간다.',()=>go('gangster'))
    ]
  }),

  roadsideAftermath: scene('roadsideAftermath', {
    chapter:'CHAPTER 1 · AFTER', location:'빈민가 밖 · 버려진 마차', art:'crossroad',
    text:()=>`깡패 사건을 뒤로하고 빈민가를 벗어난다.

버려진 마차 옆에는 부러진 목검, 마른 빵 한 조각, 멀리 상점으로 이어지는 길이 보인다.
${state.flags.gangsterKilled?'뒤에서 거지들의 환호가 아직 희미하게 들린다.':'사건은 피를 덜 흘리고 끝났지만 머릿속에는 각자의 말이 남아 있다.'}`,
    choices:() => [
      !state.flags.roadGrowth && c('부러진 목검으로 자세를 점검한다','공격력 +1',()=>takeGrowth('roadGrowth','atk','짧은 시간이지만 몸이 기억하던 움직임을 되살린다.\n\n공격력 +1','shop')),
      !state.flags.roadGrowth && c('마른 빵을 먹고 쉰다','최대 체력 +1',()=>takeGrowth('roadGrowth','hp','딱딱한 빵과 짧은 휴식이 생각보다 큰 도움이 된다.\n\n최대 체력 +1','shop')),
      !state.flags.roadGrowth && c('상점까지 전력으로 달린다','속도 +1',()=>takeGrowth('roadGrowth','speed','숨이 턱까지 차오르도록 달린다. 발이 조금 더 가벼워졌다.\n\n속도 +1','shop')),
      c('바로 상점으로 향한다','성장을 건너뛴다.',()=>go('shop'))
    ].filter(Boolean)
  }),

  cityEntry: scene('cityEntry', {
    chapter:'CHAPTER 3A · EXTRA', location:'왕국 · 동문 안쪽', art:'city',
    text:`성문을 지나자 삶의 소음이 한꺼번에 밀려온다.

과일 상인이 넘어뜨린 상자를 주워 담고 있고, 어린 소매치기가 사람들 사이를 헤집으며 달아난다. 반대편에서는 짐꾼이 혼자 커다란 자루를 끌고 있다.

왕국은 거대한 이야기보다 이런 사소한 일들로 먼저 당신을 맞는다.`,
    choices:() => [
      c('넘어진 상자를 함께 정리한다','상인이 음식을 건넨다. 최대 체력 +1',()=>takeGrowth('cityEntryGrowth','hp','과일을 주워준 대가로 따뜻한 음식과 물을 얻었다.\n\n최대 체력 +1','citySquare')),
      c('소매치기를 쫓는다','복잡한 군중 속 추격. 속도 +1',()=>takeGrowth('cityEntryGrowth','speed','사람들 사이를 비집고 끝까지 추격했다. 소매치기는 놓쳤지만 발놀림은 한층 빨라졌다.\n\n속도 +1','citySquare')),
      c('짐꾼과 흥정해 일을 나눈다','말로 서로의 몫을 조율한다. 처세 +1',()=>takeGrowth('cityEntryGrowth','social','몇 마디 만에 서로 손해 보지 않는 방법을 찾아낸다.\n\n처세 +1','citySquare')),
      c('중앙가로 바로 들어간다','주변 일에는 신경 쓰지 않는다.',()=>go('citySquare'))
    ]
  }),

  marketCrowd: scene('marketCrowd', {
    chapter:'KINGDOM · EXTRA', location:'왕국 · 대시장', art:'city',
    text:`대시장은 소리로 가득하다.

생선 장수는 옆 가게와 가격을 두고 싸우고, 거리 악사는 동전 두 닢을 놓고 노래를 시작한다. 구석에서는 세금 징수원이 노점상과 언성을 높인다.

누구도 당신을 기다리진 않았지만, 끼어들 틈은 많다.`,
    choices:() => [
      !state.flags.marketGrowth && c('두 상인의 싸움을 중재한다','처세 +1 / 왕국 관계 소폭 상승',()=>{state.relation.kingdom++;takeGrowth('marketGrowth','social','양쪽의 체면을 세워주며 가격 문제를 정리했다. 주변 상인들이 당신을 기억한다.\n\n처세 +1','citySquare');}),
      !state.flags.marketGrowth && c('무거운 짐을 나르는 상인을 돕는다','최대 체력 +1',()=>takeGrowth('marketGrowth','hp','한참 동안 상자를 나르고 나니 팔과 허리에 힘이 붙은 느낌이다.\n\n최대 체력 +1','citySquare')),
      c('거리 악사의 노래를 듣는다','소문 하나와 작은 비밀을 얻는다.',()=>{if(!state.flags.marketRumor){state.flags.marketRumor=true;state.stats.secrets++;gainGold(4);queueOutcome('악사는 전 친위대장 아르벤이 아직 왕국 어딘가에 살아 있다는 오래된 노래를 부른다.\n\n비밀 발견 / 골드 +4','citySquare');}else go('citySquare');}),
      c('중앙가로 돌아간다','다른 곳을 둘러본다.',()=>go('citySquare'))
    ].filter(Boolean)
  }),

  tavernExtras: scene('tavernExtras', {
    chapter:'KINGDOM · EXTRA', location:'왕국 · 휘어진 사슴 주점', art:'shop',
    text:`낡은 간판 아래 주점은 낮부터 붐빈다.

퇴역병은 친위대장의 젊은 시절을 떠들고, 마차꾼은 숲길의 도적 이야기를 과장한다. 구석의 상인은 상인협회 기사들이 최근 숲으로 향했다고 중얼거린다.`,
    choices:() => [
      c('퇴역병 옆에 앉는다','전 친위대장에 대한 단서를 얻는다.',()=>{if(!state.flags.veteranRumor){state.flags.veteranRumor=true;state.stats.secrets++;queueOutcome('퇴역병: “현 대장 레오른도 강하지. 하지만 아르벤 전 대장은 달랐어. 그 노인이 검을 들면 열 명도 숨을 죽였지.”\n\n전설에 대한 단서를 얻었다.','citySquare');}else go('citySquare');}),
      c('마차꾼의 숲 지도를 본다','숲 정보를 얻고 속도 훈련 기회가 열린다.',()=>{state.flags.forestMap=true;queueOutcome('마차꾼이 위험한 늪과 지름길을 손가락으로 짚어준다.\n\n숲의 길을 조금 더 잘 알게 됐다.','citySquare');}),
      c('주점 주인을 잠깐 돕는다','작은 품삯을 받는다.',()=>{if(!state.flags.tavernWork){state.flags.tavernWork=true;gainGold(8);queueOutcome('빈 잔과 접시를 나르고 골드 8을 받았다.\n\n이런 사소한 돈도 여정에서는 목숨값이 된다.','citySquare');}else go('citySquare');}),
      c('주점을 나간다','중앙가로 돌아간다.',()=>go('citySquare'))
    ]
  }),

  trainingYard: scene('trainingYard', {
    chapter:'KINGDOM · GROWTH', location:'왕국 · 공용 훈련장', art:'barracks',
    text:`낡은 허수아비와 모래주머니가 놓인 작은 훈련장이다.

신참 병사 둘이 서로 자세를 봐주고 있다. 교관은 당신을 흘끗 보더니 “한 번만 끼어들 거면 방해는 하지 마.”라고 말한다.`,
    choices:() => [
      !state.flags.trainingYard && c('신참과 대련한다','공격력 +1',()=>takeGrowth('trainingYard','atk','목검이 몇 번이나 부딪힌다. 잊었던 거리감이 되살아난다.\n\n공격력 +1','citySquare')),
      !state.flags.trainingYard && c('모래주머니를 메고 달린다','속도 +1',()=>takeGrowth('trainingYard','speed','훈련장을 수십 바퀴 돈 끝에 다리가 떨린다. 다음 걸음은 전보다 가볍다.\n\n속도 +1','citySquare')),
      c('구경만 하고 돌아간다','성장 기회는 남아 있다.',()=>go('citySquare'))
    ].filter(Boolean)
  }),

  streetClinic: scene('streetClinic', {
    chapter:'KINGDOM · GROWTH', location:'왕국 · 거리 치료소', art:'citizen',
    text:`천막 아래 무료 치료소에는 부상자들이 줄을 서 있다.

젊은 약초사는 혼자 손이 모자라 보인다. 물을 끓이고 붕대를 자르는 일이라도 도울 수 있다.`,
    choices:() => [
      !state.flags.clinicGrowth && c('치료소 일을 돕는다','최대 체력 +1 / 붕대 +1',()=>{addItem('붕대');takeGrowth('clinicGrowth','hp','약초 냄새와 피 냄새 속에서 몇 시간이나 환자를 옮겼다. 약초사는 남은 붕대를 하나 챙겨준다.\n\n최대 체력 +1 / 붕대 +1','citySquare');}),
      !state.flags.clinicGrowth && c('약초사의 설명을 듣는다','처세 +1',()=>takeGrowth('clinicGrowth','social','상처보다 사람을 먼저 진정시키는 법을 배운다. 말 한마디가 몸을 묶는 것보다 빠를 때가 있다.\n\n처세 +1','citySquare')),
      c('치료소를 떠난다','다른 장소로 간다.',()=>go('citySquare'))
    ].filter(Boolean)
  }),

  courierJob: scene('courierJob', {
    chapter:'KINGDOM · GROWTH', location:'왕국 · 전령소 앞', art:'city',
    text:`전령 하나가 봉투를 떨어뜨린 채 소매치기를 쫓아가고 있다.

“저놈 잡아! 저 편지가 사라지면 내가 목이 날아가!”`,
    choices:() => [
      !state.flags.courierGrowth && c('지붕길로 앞질러 간다','속도 +1 / 골드 +5',()=>{gainGold(5);takeGrowth('courierGrowth','speed','낮은 지붕과 담장을 넘으며 소매치기의 앞을 막았다. 전령은 숨을 몰아쉬며 동전 몇 닢을 건넨다.\n\n속도 +1 / 골드 +5','citySquare');}),
      !state.flags.courierGrowth && c('사람들에게 길을 막으라고 외친다','처세 +1',()=>takeGrowth('courierGrowth','social','혼자 쫓는 대신 시장 사람들을 움직였다. 소매치기는 순식간에 포위된다.\n\n처세 +1','citySquare')),
      c('관여하지 않는다','전령은 욕설을 내뱉으며 골목으로 사라진다.',()=>go('citySquare'))
    ].filter(Boolean)
  }),

  barracksTraining: scene('barracksTraining', {
    chapter:'ROYAL ROUTE · GROWTH', location:'친위대 막사', art:'barracks',
    text:`정찰 임무 전, 신병들과 함께 짧은 훈련 시간이 주어진다.

교관은 당신의 과거에는 관심이 없다. “살아서 돌아올 능력이 있는지만 보여.”`,
    choices:() => [
      c('검술 훈련에 집중한다','공격력 +1',()=>takeGrowth('barracksGrowth','atk','수십 번 같은 동작을 반복한 끝에 칼끝의 흔들림이 줄었다.\n\n공격력 +1','banditScoutRoyal')),
      c('방패를 들고 버티기 훈련을 한다','최대 체력 +1',()=>takeGrowth('barracksGrowth','hp','팔이 저릴 때까지 충격을 받아낸다. 몸이 조금 더 버티는 법을 익혔다.\n\n최대 체력 +1','banditScoutRoyal')),
      c('정찰병의 이동법을 배운다','속도 +1',()=>takeGrowth('barracksGrowth','speed','소리를 줄이고 빠르게 이동하는 법을 반복한다.\n\n속도 +1','banditScoutRoyal'))
    ]
  }),

  campNight: scene('campNight', {
    chapter:'ROYAL ROUTE · NIGHT', location:'친위대 야영지 · 마지막 밤', art:'camp',
    text:`도적단 본거지를 코앞에 둔 밤.

젊은 병사는 칼을 갈고, 취사병은 남은 수프를 나누고, 지도 담당관은 내일의 진입로를 반복해서 확인한다.

전투 전 마지막으로 무엇을 준비할지 정할 수 있다.`,
    choices:() => [
      c('젊은 병사와 검을 맞춰본다','공격력 +1',()=>takeGrowth('campNightGrowth','atk','짧지만 진지한 대련을 끝낸다. 서로 말없이 고개를 끄덕인다.\n\n공격력 +1','banditBossRoyal')),
      c('취사병의 남은 식사를 먹는다','최대 체력 +1 / 체력 완전 회복',()=>{heal(999,false);takeGrowth('campNightGrowth','hp','따뜻한 음식을 배부르게 먹고 오래 쉰다. 내일 죽을 수도 있다는 생각 때문에 오히려 잠은 깊다.\n\n최대 체력 +1 / 체력 회복','banditBossRoyal');}),
      c('지도 담당관과 작전을 검토한다','처세 +1',()=>takeGrowth('campNightGrowth','social','병사들이 무엇을 두려워하고 무엇에 움직이는지 들으며 작전을 고친다.\n\n처세 +1','banditBossRoyal'))
    ]
  }),

  hunterCamp: scene('hunterCamp', {
    chapter:'FOREST · EXTRA', location:'숲 · 사냥꾼 야영지', art:'forest',
    text:`나무 사이 작은 불가에 사냥꾼 둘이 앉아 있다.

한 명은 짐승의 발자국을 읽고, 다른 한 명은 낡은 창끝을 갈고 있다. 당신을 경계하지만 쫓아내진 않는다.`,
    choices:() => [
      c('창 쓰는 법을 배운다','공격력 +1',()=>{state.flags.hunterDone=true;takeGrowth('hunterGrowth','atk','사냥꾼은 “힘보다 먼저 거리를 봐.”라고 말한다. 몇 번의 찌르기 끝에 감각을 익힌다.\n\n공격력 +1','forestRoad');}),
      c('발자국 추적을 배운다','속도 +1',()=>{state.flags.hunterDone=true;takeGrowth('hunterGrowth','speed','길을 찾는 시간이 줄면 결국 더 빨리 움직일 수 있다.\n\n속도 +1','forestRoad');}),
      c('불만 쬐고 떠난다','체력 2 회복',()=>{state.flags.hunterDone=true;heal(2);queueOutcome('불 옆에서 잠깐 몸을 녹였다. 체력 일부를 회복했다.','forestRoad');})
    ]
  }),

  forestHerbalist: scene('forestHerbalist', {
    chapter:'FOREST · EXTRA', location:'숲 · 약초밭', art:'forest',
    text:`허리를 굽힌 노파가 이끼 사이에서 약초를 캐고 있다.

“밟지 마. 네 발밑에 있는 게 도시에서는 은화 세 닢이야.”`,
    choices:() => [
      c('약초 채집을 돕는다','최대 체력 +1',()=>{state.flags.herbalistDone=true;takeGrowth('herbalGrowth','hp','독초와 약초를 구분하며 한참을 걸었다. 노파는 작은 약차를 내준다.\n\n최대 체력 +1','forestRoad');}),
      c('약초 가격을 흥정하며 배운다','처세 +1',()=>{state.flags.herbalistDone=true;takeGrowth('herbalGrowth','social','노파는 물건보다 사람을 상대하는 법을 더 많이 가르쳐준다.\n\n처세 +1','forestRoad');}),
      c('약초 한 묶음만 산다','골드 6 소모 / 붕대 +1',()=>{state.flags.herbalistDone=true;if(spendGold(6)){addItem('붕대');queueOutcome('골드 6을 내고 약초 묶음을 샀다. 붕대 +1','forestRoad');}else queueOutcome('돈이 부족하자 노파는 혀를 차며 길만 알려준다.','forestRoad');})
    ]
  }),

  lostTraveler: scene('lostTraveler', {
    chapter:'FOREST · EXTRA', location:'숲 · 뒤틀린 표지판', art:'forest',
    text:`짐을 잔뜩 멘 여행자가 같은 나무 주위를 세 번째 돌고 있다.

“혹시 왕국 가는 길이 어느 쪽인지 아시오?”
그가 들고 있는 지도는 거꾸로다.`,
    choices:() => [
      c('지도를 바로잡아 길을 알려준다','처세 +1 / 상인 관계 +1',()=>{state.flags.travelerDone=true;state.relation.merchants++;takeGrowth('travelerGrowth','social','당황한 사람에게 필요한 말을 골라 차근차근 설명한다. 여행자는 연신 고개를 숙인다.\n\n처세 +1','forestRoad');}),
      c('직접 안전한 길까지 데려다준다','속도 +1',()=>{state.flags.travelerDone=true;takeGrowth('travelerGrowth','speed','왕복으로 숲길을 빠르게 오가며 지형을 몸으로 익혔다.\n\n속도 +1','forestRoad');}),
      c('엉뚱한 길을 알려준다','골드 5를 슬쩍 챙긴다.',()=>{state.flags.travelerDone=true;gainGold(5);state.relation.merchants--;queueOutcome('여행자가 정신없는 틈에 떨어진 동전을 챙겼다.\n\n골드 +5 / 상인 관계 하락','forestRoad');})
    ]
  }),

  forestExtrasGate: scene('forestExtrasGate', {
    chapter:'FOREST · DEEP', location:'숲 · 오래된 경계목', art:'forest',
    text:`나무에 오래된 칼자국이 수십 개 새겨져 있다.

그 아래 앉은 외눈박이 나무꾼이 당신을 본다.
“저 선을 넘으면 도적들 영역이야. 들어갈 거면 적어도 숨 쉬는 법부터 다시 배워.”`,
    choices:() => [
      !state.flags.deepForestGrowth && c('무거운 장작을 메고 언덕을 오른다','최대 체력 +1',()=>takeGrowth('deepForestGrowth','hp','장작을 내려놓았을 때는 숨이 가쁘지만 몸은 한층 단단해져 있다.\n\n최대 체력 +1',state.flags.merchantAlive?'merchantCaptured':'officer2')),
      !state.flags.deepForestGrowth && c('나무 사이를 빠르게 통과하는 법을 배운다','속도 +1',()=>takeGrowth('deepForestGrowth','speed','낮은 가지와 뿌리를 피하는 법을 익힌다. 숲에서의 발이 빨라졌다.\n\n속도 +1',state.flags.merchantAlive?'merchantCaptured':'officer2')),
      c('경계목을 넘는다','도적단의 영역으로 들어간다.',()=>go(state.flags.merchantAlive?'merchantCaptured':'officer2'))
    ].filter(Boolean)
  }),

  banditCampLife: scene('banditCampLife', {
    chapter:'FOREST · EXTRA', location:'도적단 외곽 야영지', art:'banditcamp',
    text:()=>`도적단의 외곽 야영지에는 생각보다 평범한 사람들이 있다.

솥을 젓는 늙은 취사병, 다친 팔을 감싼 젊은 도적, 망을 보는 소녀가 각자의 일을 한다.
${state.flags.officer2Allied?'당신을 적으로 보지는 않지만 아직 완전히 믿는 눈치도 아니다.':'당신이 지나가자 대화가 잠시 끊긴다.'}`,
    choices:() => [
      !state.flags.banditCampGrowth && c('취사병의 장작 패기를 돕는다','공격력 +1',()=>takeGrowth('banditCampGrowth','atk','무거운 도끼를 반복해서 내리친다. 취사병은 “칼도 결국 같은 거야.”라며 웃는다.\n\n공격력 +1',state.flags.officer2Allied?'guildNovice':'forestBeforeBoss')),
      !state.flags.banditCampGrowth && c('망보는 소녀와 교대한다','속도 +1',()=>takeGrowth('banditCampGrowth','speed','나무를 오르고 내리며 주변 길을 외운다.\n\n속도 +1',state.flags.officer2Allied?'guildNovice':'forestBeforeBoss')),
      !state.flags.banditCampGrowth && c('부상한 도적의 이야기를 듣는다','처세 +1 / 도적 관계 +1',()=>{state.relation.bandits++;takeGrowth('banditCampGrowth','social','그가 도적이 된 이유를 듣고, 당신의 이야기도 조금 들려준다. 말의 거리가 전보다 가까워졌다.\n\n처세 +1',state.flags.officer2Allied?'guildNovice':'forestBeforeBoss');}),
      c('야영지를 지나간다','두목의 본거지 방향으로 이동한다.',()=>go(state.flags.officer2Allied?'guildNovice':'forestBeforeBoss'))
    ].filter(Boolean)
  })


};

// ---------- v0.9: richer scenes / multi-step dialogue ----------
const RICH_TEXT = {
  intro: () => `당신에게는 한때 이름이 있었다.\n\n그 이름을 부르면 문이 열렸고, 누군가는 고개를 숙였고, 누군가는 당신이 돌아오기를 기다렸다. 몰락은 그 모든 것을 한꺼번에 지워버렸다. 변명할 시간도, 짐을 챙길 시간도 없었다.\n\n비가 그친 새벽. 차가운 돌바닥의 습기가 옷 안쪽까지 스며든다. 멀리서 시장을 여는 종소리가 희미하게 들리지만 이 골목에는 빵 냄새보다 젖은 재와 썩은 나무 냄새가 짙다.\n\n당신은 빈민가 끝자락에서 눈을 뜬다. 가진 것은 몸 하나와, 아직 완전히 꺾이지 않은 습관뿐이다.`,
  beggars: () => `누더기를 걸친 세 사람이 당신을 빙 둘러싼다. 가장 늙은 자는 손에 찌그러진 양철잔을 들고 있고, 아이처럼 마른 청년은 끊임없이 골목 입구를 살핀다.\n\n“살아 있었군.”\n“보아하니 당신도 갈 데 없는 사람 같네.”\n\n그들은 며칠째 자신들을 괴롭히는 깡패가 있다고 말한다. 돈을 빼앗고, 잠자리를 걷어차고, 말을 듣지 않으면 때린다고 한다. 말은 빠르고 억울함은 충분해 보이지만 세 사람 모두 같은 부분에서 묘하게 시선을 피한다.\n\n당신이 어떤 사람인지 묻기도 전에 그들은 당신이 자기들 편일 거라 믿고 있다.`,
  gangster: () => `뒷골목 끝. 덩치 큰 남자가 벽에서 등을 떼고 천천히 일어난다. 낡은 외투 아래로 두꺼운 팔이 드러나고, 오른손에는 싸움에 익숙한 굳은살이 잡혀 있다.\n\n“또 너희냐?”\n\n거지들은 약속이라도 한 듯 당신 뒤로 물러선다.\n“저놈이에요. 매일 우릴 괴롭혀요!”\n\n남자의 시선이 거지들에게서 당신에게 옮겨온다. 그는 먼저 덤비지 않는다. 대신 당신이 왜 끼어들었는지 재려는 듯 턱을 조금 든다.${state.flags.gangsterTruth?'\n\n이제 당신은 안다. 이 싸움의 시작은 거지들이 그의 돈주머니에 손을 댄 일이었다.':''}`,
  kingdomGate: () => `왕국의 동문은 생각보다 높다. 사람 두세 명이 나란히 걸어도 남을 만큼 넓은 성벽 위로 활을 든 병사들이 오간다. 문 앞에는 장사꾼, 농부, 짐수레가 길게 줄을 서 있다.\n\n당신 차례가 되자 경비병 하나가 창을 가로로 세운다. 갑옷에는 먼지가 묻었고 눈 밑에는 옅은 피로가 내려앉아 있다.\n\n“멈춰. 신분과 목적을 밝혀라.”\n\n그의 말투는 거칠지만 개인적인 악의는 없다. 최근 무언가 때문에 검문이 강해진 모양이다. 성문 너머로는 시장의 고함, 대장간의 쇳소리, 멀리 왕궁의 종이 한꺼번에 섞여 들린다.`,
  citySquare: () => `왕국의 중앙가는 전쟁을 앞둔 도시답지 않게 바쁘고 평범하다. 빵집 앞에는 줄이 있고, 세탁물이 창문 사이에서 흔들리고, 장사꾼들은 오늘이 마지막 날이 아닌 것처럼 목청껏 값을 외친다.\n\n하지만 자세히 들으면 평범한 대화의 끝마다 같은 이름이 붙는다. 도적단. 세금. 징발. 친위대. 누군가는 왕국이 자신들을 지켜준다고 말하고, 누군가는 왕국이 먼저 사람들을 숲으로 내몰았다고 낮게 중얼거린다.\n\n${state.flags.gangsterPeace?'시장 한편에서 빈민가에서 보았던 깡패와 닮은 뒷모습이 스쳐 지나간다. 피를 보지 않고 끝낸 작은 사건이 이 넓은 도시 어딘가에도 이어져 있는 듯하다.':''}${state.flags.kingdomHostile?'\n\n그리고 지금은 사람들의 시선이 유난히 당신에게 오래 머문다. 왕국은 이미 당신을 위험한 사람으로 기억하기 시작했다.':''}`,
  captainEnraged: () => `왕궁 앞 대로가 비었다. 상인들은 문을 잠갔고 시민들은 창문을 닫았다. 멀리서 갑옷이 부딪히는 소리가 한 번 들린 뒤, 은빛 갑옷의 남자가 혼자 걸어 나온다.\n\n친위대장 레오른.\n\n그는 당신을 보기 전에 먼저 길 위의 흔적을 본다. 쓰러진 경비, 버려진 무기, 도망친 사람들의 자국. 그러고서야 당신에게 시선을 올린다.\n\n“네가 죽인 사람들의 얼굴을 하나라도 기억하나?”\n\n목소리는 크지 않다. 그래서 더 위험하다. 그의 검은 아직 칼집에 있지만, 손은 이미 손잡이에 놓여 있다.`,
  oldVeteran: () => `왕궁으로 오르는 오래된 돌계단 한가운데, 허름한 외투를 입은 노인이 서 있다. 왕궁을 지키는 병사도, 화려한 문장도 없다. 처음 보면 길을 잘못 든 노인처럼 보일 뿐이다.\n\n그러나 이상하다. 바람이 외투 자락을 흔들어도 그의 중심은 조금도 움직이지 않는다. 당신이 한 걸음 옮길 때마다 그의 시선은 발끝이 아니라 어깨와 허리를 따라간다.\n\n“여기까지 왔으면, 네가 뭘 원하는지는 들어봐야겠지.”\n\n노인은 웃지 않는다. 위협하지도 않는다. 그럴 필요가 없는 사람처럼 보인다.${state.flags.oldGuardIdentity?'\n\n당신은 이제 그의 이름을 안다. 아르벤. 오래전 왕국에서 전설처럼 불리던 전 친위대장.':''}`,
  kingAudience: () => `왕궁의 알현실은 생각보다 조용하다. 귀족도 시종도 보이지 않는다. 높은 창으로 들어온 빛이 긴 바닥을 반으로 가르고, 그 끝에 왕 에드란이 홀로 앉아 있다.\n\n“네가 무슨 짓을 했는지는 알고 있다.”\n\n왕은 당신을 꾸짖기보다 계산한다. 살려둘 가치와 죽일 위험을 같은 저울에 올리는 눈이다.\n\n“그래도 도적단을 무너뜨릴 힘이 있다면, 한 번은 쓸 수 있겠지.”\n\n명예를 되찾을 기회인지, 목숨을 대신 내놓으라는 명령인지 아직은 알 수 없다.`,
  enlist: () => `친위대 모집소의 책상 위에는 지원서보다 전사자 명단이 더 두껍다. 장교는 당신의 이름과 출신을 확인하다가 한 번 멈춘다. 몰락한 사람을 알아본 눈이다.\n\n하지만 그는 종이를 찢지도, 경비를 부르지도 않는다.\n“과거가 어떻든 상관없다. 지금 필요한 건 도적단을 막을 칼이야.”\n\n막사 안에서는 신병들이 목검을 부딪치고 있다. 어떤 얼굴은 겁에 질렸고, 어떤 얼굴은 전쟁을 아직 모험으로 착각한다. 이들과 함께 싸우면 당신의 이름은 다시 왕국 쪽 기록에 올라갈 것이다.`,
  forestMerchant: () => `숲 초입. 바퀴 하나가 진흙에 빠진 짐수레 옆에서 상인이 욕설을 중얼거린다. 당신을 발견하자 그는 재빨리 웃는 얼굴을 만들지만 손은 허리춤의 작은 칼에서 멀어지지 않는다.\n\n“이 시간에 혼자 숲으로?”\n“물건이 필요하면 돈부터 보여줘. 세상에서 말보다 믿을 만한 게 동전 소리거든.”\n\n수레에는 약품, 밧줄, 건조식량이 가지런히 묶여 있다. 도적이 자주 나온다는 길을 혼자 다니는 상인치고는 지나치게 침착하다. 이름은 로벤. 그는 숲길과 사람값을 모두 잘 아는 사람처럼 보인다.`,
  merchantCaptured: () => `해가 기울 무렵, 뒤집힌 짐수레와 부러진 바퀴가 먼저 보인다. 그 뒤 나무에는 로벤이 손이 묶인 채 기대어 있다. 입가에 피가 묻었지만 의식은 또렷하다.\n\n그 앞을 갈고리 모양의 칼을 든 도적단 간부가 지킨다. 주변에는 다른 도적이 없다. 혼자서도 충분하다고 생각하는 모양이다.\n\n“상인 하나 때문에 목숨 걸 생각은 아니겠지?”\n\n로벤은 당신을 보자 도움을 청하는 대신 아주 작게 고개를 젓는다. 덤비기 전에 생각하라는 뜻인지, 자신을 버리고 가라는 뜻인지는 알 수 없다.`,
  officer2: () => `숲을 가르는 돌다리 위. 붉은 모자를 쓴 여자가 난간에 걸터앉아 칼끝으로 돌을 두드리고 있다. 당신이 가까워지자 그녀는 피할 생각 없이 다리 한가운데로 내려선다.\n\n“갈고리를 만났지?”\n그녀의 눈이 당신의 옷과 무기, 상처를 빠르게 훑는다.\n“살아서 여기 왔다는 건 어느 쪽이든 재미있네.”\n\n말투는 가볍지만 위치 선정은 치밀하다. 뒤로 물러나면 좁은 다리, 앞으로 가면 그녀. 대화를 해볼 시간은 있지만 허튼소리를 여러 번 받아줄 사람은 아니다.`,
  guildNovice: () => `숲을 가로지르는 오래된 교역로에서 작은 방패 하나가 길을 막는다. 상인협회의 은빛 문장이 새겨져 있다. 방패 뒤에는 아직 얼굴에 소년 티가 남은 초급 기사가 서 있다.\n\n그는 당신과 도적단 쪽을 번갈아 보며 침을 삼킨다. 겁이 없는 것이 아니라, 겁을 감추는 훈련을 받은 사람이다.\n\n“도적단과 함께 있는 이유를 설명해.”\n\n목소리가 아주 조금 떨린다. 잘 말하면 지나갈 수 있을지도 모르지만, 궁지에 몰면 오히려 규칙대로 검을 뽑을 가능성이 커 보인다.`,
  midKnight: () => `도적단 본거지가 보이기 직전, 숲의 소리가 갑자기 끊긴다. 길 한가운데 검은 망토의 기사가 서 있다. 발밑에는 부러진 화살 몇 개가 떨어져 있고, 방패에는 상인협회의 은빛 문장이 깊게 새겨져 있다.\n\n“초급 기사를 죽인 자가 너구나.”\n\n그는 확인을 요구하지 않는다. 이미 결론을 내리고 여기까지 추적해 온 사람이다. 말할 때조차 시선은 당신의 입이 아니라 손과 발을 본다.\n\n이 사람에게 대화는 화해의 수단이 아니라 당신의 호흡과 습관을 읽을 시간일지도 모른다.`,
  banditBossForest: () => `도적단 본거지 가장 안쪽. 커다란 지도에는 왕국 성벽과 교역로, 세금 수송로가 붉은 실로 이어져 있다. 지도 한가운데 꽂혀 있던 단검을 여자가 뽑는다.\n\n세리아. 숲의 사람들이 두목이라고 부르던 이름이다.\n\n“내 간부들을 죽였든, 친구가 됐든 결국 여기까지 왔네.”\n\n그녀는 당신 뒤에 누가 살아남았는지 이미 알고 있는 눈치다. 단검을 바로 들지는 않는다. 먼저 당신이 어떤 이유로 여기까지 왔는지 알고 싶어 한다.\n\n“그래서 넌 어느 편이지?”`,
  friendBridge: () => `왕국과 숲 사이의 오래된 돌다리. 두 세력이 서로를 볼 수 있을 만큼 가깝지만, 아직 활이 닿기에는 먼 거리에서 멈춰 있다.\n\n당신 뒤에는 지금까지 살려둔 사람들의 말이 겹쳐 있다. 세금을 원망한 도적, 습격을 두려워한 시민, 길 하나가 막히면 가족이 굶는다고 했던 상인. 어느 한쪽의 말만 완전히 틀렸다고 하기엔 너무 많은 얼굴을 보았다.\n\n이곳에서 칼을 뽑는 것은 쉽다. 어려운 것은 서로 칼을 들 이유가 남아 있는데도 내려놓게 만드는 일이다.`,
  kingEnraged: () => `왕의 얼굴에서 마지막 계산이 사라진다. 남은 것은 분노다. 왕좌 옆에 세워둔 검을 직접 뽑는 순간, 알현실의 공기가 달라진다.\n\n“내 병사도, 내 백성도, 내 나라까지 네 선택의 장난감이었나?”\n\n에드란은 왕관을 벗어 왕좌 위에 던진다. 이제 앞에 선 사람은 왕의 권위로 싸우지 않는다. 자신이 잃었다고 믿는 모든 것을 대신해 싸운다.\n\n대화를 더 이어갈 수는 있다. 다만 잘못된 말 한마디는 그 분노에 칼날 하나를 더 얹을 것이다.`
};

const TALK_PROFILES = {
  gangster:{end:'남자는 같은 설명을 반복하지 않는다. 이제 선택할 차례다.',steps:[
    {text:`“괴롭혀?” 남자가 헛웃음을 친다. “저 셋이 내 돈주머니를 세 번이나 훔쳤어. 첫 두 번은 그냥 넘겼고.”\n\n뒤에서 거지 하나가 입술을 깨문다. 세 사람 모두 부정하지 못한다.\n\n당신은 사건의 시작이 들었던 이야기와 다르다는 걸 알아냈다.`,on(){if(!state.flags.gangsterTruth){state.flags.gangsterTruth=true;state.stats.secrets++;}encMod().socialPct+=14;}},
    {text:`남자는 자신이 시장 짐꾼이라고 말한다. 잃어버린 돈은 하루 품삯이 아니라 약값이었다.\n\n“난 저놈들을 죽이고 싶은 게 아냐. 그냥 내 걸 돌려받고 다시는 손 안 대게 하고 싶은 거지.”\n\n그의 목적이 복수보다 회수에 가깝다는 사실을 알았다.`,on(){encMod().socialPct+=10;state.flags.gangsterMotive=true;}},
    {text:`조금 더 말을 섞는 동안 그의 오른쪽 어깨가 왼쪽보다 늦게 움직인다는 걸 눈치챈다. 오래된 부상인지, 무거운 짐을 나르다 다친 흔적인지 모른다.\n\n싸우게 된다면 작은 틈이 될 수 있다.`,on(){encMod().attackPct+=10;state.flags.gangsterWeakness=true;}}
  ]},
  kingdomGate:{end:'경비병은 뒤의 줄을 가리킨다. 더 묻는다면 오히려 눈총만 살 것 같다.',steps:[
    {text:`“도적단 때문에 검문이 강화됐다.” 경비병이 턱으로 숲 방향을 가리킨다. “지난주엔 세금 수레가 통째로 사라졌어. 그래서 낯선 얼굴은 전부 확인한다.”\n\n당신 개인을 노리는 검문은 아닌 듯하다.`,on(){state.flags.banditRumor=true;encMod().socialPct+=10;}},
    {text:`당신이 근무 시간을 묻자 경비병이 피곤한 눈으로 웃는다. “해 뜨기 전부터 여기 있었어. 그러니 별일 만들지 마.”\n\n말은 거칠지만 피로가 깊다. 싸우게 된다면 반응이 아주 조금 늦을 수도 있다.`,on(){encMod().attackPct+=6;}}
  ]},
  citizen:{end:'시민은 장바구니를 고쳐 들고 이제 정말 갈 생각이다.',steps:[
    {text:`시민은 목소리를 낮춘다. “도적단이 왕국을 넘본대. 친위대도 사람을 모으고 있어. 다들 큰 전투가 난다고 수군거려.”\n\n그는 도적을 두려워하지만 왕국의 세금에도 불만이 있어 보인다.`,on(){state.flags.banditRumor=true;state.relation.kingdom+=1;encMod().socialPct+=8;}},
    {text:`“그래도 전쟁 나면 우리 같은 사람만 먼저 굶겠지.” 시민은 한숨을 쉰다. “왕이든 도적이든 시장 문 닫게 만드는 쪽은 싫어.”\n\n왕국의 평범한 사람들에게 중요한 것이 명분보다 일상이라는 걸 확인한다.`,on(){state.stats.talkSolved++;state.flags.citizenView=true;}}
  ]},
  captainEnraged:{end:'레오른의 눈에는 더 들을 말이 없다는 뜻이 분명하다.',steps:[
    {text:`“기억하냐고 물었다.” 레오른이 검 손잡이에 엄지를 건다. “이름을 몰라도 좋다. 적어도 몇 명이었는지는 기억하나?”\n\n말을 이어가는 동안 그의 발 간격과 검을 뽑는 방향을 읽는다.`,on(){encMod().attackPct+=5;encMod().enemyAtk+=1;}},
    {text:`당신이 이유를 꺼내자 그는 잘라 말한다. “이유가 사람을 살려주진 않아.”\n\n그러나 ‘아르벤’이라는 이름을 입에 올린 순간 아주 잠깐 시선이 흔들린다. 현 친위대장에게도 전임자는 특별한 존재인 듯하다.`,on(){state.flags.captainKnowsArven=true;encMod().attackPct+=4;}},
    {text:`“계속 시간을 끌 생각인가?”\n\n레오른의 분노가 처음으로 목소리 밖으로 새어 나온다. 더 많은 정보를 얻었지만 그만큼 상대를 몰아붙였다.`,on(){encMod().enemyAtk+=3;encMod().socialPct-=8;}},
    {text:`마지막으로 당신이 검을 내려놓을 가능성을 묻자 레오른은 한참 침묵한다.\n\n“내가 원하는 건 네 변명이 아니다. 여기서 더 죽이지 않겠다는 증거지.”\n\n설득할 틈이 아주 조금 생겼다.`,on(){encMod().socialPct+=16;state.flags.captainLastChance=true;}}
  ]},
  oldVeteran:{end:'아르벤은 이제 말 대신 당신의 선택을 기다린다.',steps:[
    {text:`노인은 당신의 자세를 보며 작은 한숨을 쉰다. “몰락한 사람은 둘 중 하나가 되지. 예전 이름에 매달리거나, 이름 없이도 서는 법을 배우거나.”\n\n말투보다 먼저, 당신은 그가 평범한 노인이 아니라는 확신을 얻는다.`,on(){encMod().socialPct+=5;}},
    {text:`당신이 왕국의 오래된 친위대 이야기를 꺼내자 노인의 눈매가 달라진다.\n\n“아르벤이라는 이름을 아직도 부르는 사람이 있나 보군.”\n\n전설의 정체가 드러난다.`,on(){if(!state.flags.oldGuardIdentity){state.flags.oldGuardIdentity=true;state.stats.secrets++;}encMod().socialPct+=8;}},
    {text:`아르벤은 전쟁 이야기를 길게 하지 않는다. 대신 “젊을 때 왼쪽 무릎 하나를 버렸지.”라고 무심하게 말한다.\n\n그가 왜 그 사실을 말해줬는지 알 수 없다. 시험인지, 경고인지. 싸운다면 분명한 단서다.`,on(){encMod().attackPct+=12;encMod().enemyAtk+=1;state.flags.oldGuardWeakness=true;}},
    {text:`“왕을 만나고 싶다면 검부터 내려놓게.”\n\n아르벤의 목소리는 처음보다 부드럽다. “여기서 이기는 것과 원하는 걸 얻는 건 같은 일이 아닐 수도 있어.”\n\n싸우지 않고 왕에게 갈 길이 완전히 열렸다.`,on(){encMod().socialPct+=15;state.flags.oldGuardParley=true;}}
  ]},
  forestMerchant:{end:'로벤은 “이제 정보도 상품이야.”라며 손바닥을 내민다.',steps:[
    {text:`“로벤이라고 해.” 상인은 수레 바퀴를 걷어차며 말한다. “이 앞엔 도적단 간부 둘이 돌아다녀. 갈고리 든 놈이랑 붉은 모자. 둘 다 성질이 달라서 상대법도 달라.”\n\n숲의 위험이 단순한 소문이 아니라 구체적인 얼굴을 갖기 시작한다.`,on(){state.flags.merchantAlive=true;state.relation.merchants+=1;encMod().socialPct+=8;}},
    {text:`로벤은 왕국과 도적단 사이를 오랫동안 오갔다고 한다. “왕국은 세금을 걷고, 도적은 통행료를 걷지. 상인 입장에선 이름만 달라.”\n\n그는 어느 편도 완전히 믿지 않는다. 그래서 살아남은 듯하다.`,on(){state.flags.merchantBalancedView=true;state.stats.secrets++;encMod().socialPct+=7;}},
    {text:`“정말 숲 깊이 갈 거면 이건 기억해. 붉은 모자는 말이 통하지만 자존심을 건드리면 끝이야. 그리고 상인협회 기사 앞에서는 도적 물건을 보이지 마.”\n\n후반 조우에 쓸 만한 구체적인 정보를 얻었다.`,on(){state.flags.merchantAdvice=true;encMod().attackPct+=3;}}
  ]},
  merchantCaptured:{end:'갈고리는 더 말하면 거래 대신 싸움이 될 거라고 경고한다.',steps:[
    {text:`갈고리는 로벤을 흘겨본다. “상인협회가 우리 거래선을 끊었어. 약도, 소금도, 겨울 식량도. 저 상인은 그쪽 사람이면서 우리한테도 팔았고.”\n\n단순한 납치라기보다 끊어진 거래의 보복에 가깝다.`,on(){state.relation.bandits+=1;encMod().socialPct+=8;}},
    {text:`로벤이 끼어든다. “난 누구 편도 아니야. 돈 내는 사람 편이지.”\n갈고리가 피식 웃는다. “그래서 아무도 널 믿지 않는 거고.”\n\n둘의 관계가 완전히 적대적이기만 한 것은 아니다. 협상의 틈이 있다.`,on(){encMod().socialPct+=12;state.flags.officer1DealGap=true;}}
  ]},
  officer2:{end:'붉은 모자는 칼끝을 난간에 두드리며 이제 결정을 요구한다.',steps:[
    {text:`“두목 이름은 세리아.” 붉은 모자가 아무렇지 않게 말한다. “왕국은 우릴 도적이라고 부르고, 우리는 걔들을 세금 도둑이라고 부르지. 이름 붙이기는 쉬워.”\n\n그녀는 당신이 어느 쪽 말에 반응하는지 살핀다.`,on(){state.flags.officer2Talked=true;state.relation.bandits+=1;encMod().socialPct+=7;}},
    {text:`당신이 갈고리 이야기를 꺼내자 그녀가 웃는다. “걔는 겁주는 건 잘해도 사람 죽이는 건 싫어해.”\n\n간부들조차 단순한 살인자 집단은 아닌 듯하다. 동시에 그녀가 허리를 돌릴 때 왼발을 먼저 디딘다는 습관이 보인다.`,on(){encMod().attackPct+=8;state.flags.officer2Habit=true;}},
    {text:`“세리아를 만나고 싶으면 거짓말은 적당히 해.” 붉은 모자가 다리 끝을 턱으로 가리킨다. “그 여자는 네가 한 말보다 네가 살려둔 사람을 더 믿거든.”\n\n지금까지의 선택이 두목과의 대화에 영향을 줄 것이라는 사실을 알게 된다.`,on(){encMod().socialPct+=10;state.flags.officer2AlliedDoor=true;}}
  ]},
  guildNovice:{end:'초급 기사는 떨리는 숨을 고르고 더는 설명을 듣지 않으려 한다.',steps:[
    {text:`“협회 수레가 세 번 털렸어.” 기사가 말한다. “죽은 호위도 있어. 그러니 ‘잠깐 같이 걷는 것뿐’이라는 말은 믿기 어렵다.”\n\n그의 적대감은 개인 감정보다 규정과 두려움에서 나온다.`,on(){encMod().socialPct+=7;}},
    {text:`당신이 로벤의 이름을 꺼내자 기사의 표정이 조금 풀린다. “그 상인이 살아 있다면… 적어도 네 말을 확인할 사람은 있겠군.”\n\n로벤을 살려뒀다면 설득의 여지가 커진다.`,on(){if(state.flags.merchantAlive&&!state.flags.merchantKilled)encMod().socialPct+=18;else encMod().socialPct+=3;}}
  ]},
  midKnight:{end:'중급 기사는 더 이상 대답하지 않는다. 이미 충분히 읽었다는 표정이다.',steps:[
    {text:`“설명할 필요 없다.” 기사는 당신이 말하는 동안 검끝을 아주 조금 낮춘다. 하지만 그것은 경계가 풀린 움직임이 아니다. 당신의 호흡에 맞춰 거리를 재는 동작이다.\n\n대화를 시도한 만큼 오히려 상대에게 정보를 줬다.`,on(){encMod().enemyAtk+=3;encMod().attackPct-=4;}},
    {text:`“초급 기사는 마지막까지 협회 신호를 보냈다.”\n\n그는 감정을 드러내지 않지만 두 번째 문장부터 공격 자세가 훨씬 정교해진다. 이 사람과는 말을 길게 할수록 불리하다.`,on(){encMod().enemyAtk+=3;encMod().attackPct-=5;state.flags.midKnightReadYou=true;}}
  ]},
  banditBossForest:{end:'세리아는 더 이상 설명하지 않는다. 이제 당신의 편을 선택하라고 한다.',steps:[
    {text:`세리아는 지도 위의 세금 수송로를 짚는다. “왕국은 숲 마을에서 곡식을 가져갔고 겨울에 돌려주지 않았어. 처음엔 돌려달라고 했고, 다음엔 훔쳐왔지. 그다음부터 우릴 도적이라고 불렀어.”\n\n그녀의 말이 모든 폭력을 정당화하지는 않지만 반란의 시작이 단순한 욕심만은 아니었다.`,on(){state.flags.bossTalked=true;state.relation.bandits+=1;encMod().socialPct+=9;}},
    {text:`“내 사람들도 잘못한 게 많아.” 세리아는 의외로 쉽게 인정한다. “배고프다는 이유로 아무 상인이나 턴 놈도 있고, 복수랍시고 사람을 죽인 놈도 있어.”\n\n두목은 자기 편을 완전히 미화하지 않는다. 그래서 오히려 말의 무게가 커진다.`,on(){encMod().socialPct+=10;state.flags.bossHonest=true;}},
    {text:`당신이 왕국 시민들의 두려움을 말하자 세리아는 한동안 침묵한다. “알아. 그래서 이 전쟁이 시작되기 전에 끝낼 방법이 있으면 듣고 있는 거고.”\n\n왕국과 도적단 사이를 잇는 협상의 가능성이 열린다.`,on(){encMod().socialPct+=14;state.flags.friendTalkOpen=true;}},
    {text:`세리아는 단검을 거꾸로 잡아 지도 위에 내려놓는다. “마지막으로 묻지. 내 옆에서 왕국을 칠래, 날 죽일래, 아니면 진짜로 둘 다 살릴 방법을 보여줄래?”\n\n그녀와의 대화는 끝났다. 이제 행동이 답이 된다.`,on(){state.flags.bossTalked=true;state.flags.rebelOfferReady=true;encMod().attackPct+=4;}}
  ]},
  kingEnraged:{end:'왕은 더 이상 말을 듣지 않는다. 검끝이 당신을 향한다.',steps:[
    {text:`“명예?” 에드란이 웃는다. “너는 명예를 찾으러 와서 내 백성을 시체로 만들었나?”\n\n그는 분노 때문에 크게 움직인다. 위험하지만 동작이 읽히는 순간도 있다.`,on(){encMod().attackPct+=5;encMod().enemyAtk+=2;}},
    {text:`당신이 도적단과 세금 이야기를 꺼내자 왕의 표정이 잠깐 굳는다. “왕국 하나를 유지하는 데는 곡식도, 병사도 필요하다. 내가 걷지 않으면 누가 성벽을 세우지?”\n\n그는 자신의 선택을 폭정이 아니라 유지비라고 믿고 있다.`,on(){state.flags.kingReason=true;encMod().socialPct+=5;}},
    {text:`“그래. 잘못한 것이 없다고는 하지 않겠다.” 왕이 검을 다시 세운다. “하지만 네가 지금 하는 일도 그 잘못 위에 시체를 하나 더 쌓는 것뿐이다.”\n\n마지막 말은 설득이라기보다 결투 전의 유언처럼 들린다.`,on(){encMod().attackPct+=5;encMod().enemyAtk+=1;}}
  ]}
};

function richSceneText(sc){
  const r=RICH_TEXT[state.sceneId];
  if(r) return typeof r==='function'?r():r;
  return typeof sc.text==='function'?sc.text():sc.text;
}
function encMod(id=state.sceneId){
  state.encounterMods ||= {};
  if(!state.encounterMods[id]) state.encounterMods[id]={attackPct:0,socialPct:0,attackStat:0,socialStat:0,speed:0,enemyAtk:0,comebackMin:6,revealed:false,usedItems:[]};
  return state.encounterMods[id];
}
function effectiveSpeed(){return Number(state.p?.speed||0)+Number(encMod().speed||0);}
function effectiveAttack(){return Math.max(0,Number(state.p?.atk||0)+Number(encMod().attackStat||0));}
function effectiveSocial(){return Math.max(0,Number(state.p?.social||0)+Number(encMod().socialStat||0));}
function talkProfile(){return TALK_PROFILES[state.sceneId]||null;}
function talkLabel(){
  const p=talkProfile(); if(!p)return '상대와 이야기한다';
  const n=state.talkCount[state.sceneId]||0;
  if(n>=p.steps.length)return `대화 완료 · ${p.steps.length}/${p.steps.length}`;
  return `대화 ${n+1}/${p.steps.length} · 말에 따라 판정 변화`;
}
function handleTalk(sc){
  const p=talkProfile();
  if(!p){ if(sc.talk)sc.talk(); else toast('상대는 대화를 이어갈 생각이 없어 보인다.'); return; }
  const done=state.talkCount[state.sceneId]||0;
  if(done>=p.steps.length){queueOutcome(p.end||'더 이어갈 대화가 없다.',null);return;}
  const step=p.steps[done];
  bumpTalk(state.sceneId); state.stats.talkInteractions=(state.stats.talkInteractions||0)+1;
  const before={a:attackChance(getEnemy(sc)),s:socialChance(getEnemy(sc),sc),r:runChance(getEnemy(sc))};
  if(step.on)step.on();
  const enemy=getEnemy(sc);
  const after={a:attackChance(enemy),s:socialChance(enemy,sc),r:runChance(enemy)};
  const changes=[];
  if(after.a!==before.a)changes.push(`공격 ${before.a}% → ${after.a}%`);
  if(!sc.socialDisabled&&after.s!==before.s)changes.push(`처세 ${before.s}% → ${after.s}%`);
  if(after.r!==before.r)changes.push(`도망 ${before.r}% → ${after.r}%`);
  queueOutcome(`[대화 ${done+1}/${p.steps.length}]\n${step.text}${changes.length?`\n\n[판정 변화] ${changes.join(' · ')}`:''}`,null);
}

const DIALOGUE_EXIT_CHOICES = {
  kingdomGate(){const p=talkProfile();if(!p||(state.talkCount.kingdomGate||0)<p.steps.length)return [];return [c('검문에 끝까지 협조한다','충분히 이야기를 나눈 덕에 경비의 경계가 누그러졌다.',()=>{state.stats.talkSolved++;state.relation.kingdom+=1;resolve('talk','cityEntry','신분과 목적을 솔직하게 설명했다. 경비병은 몇 가지를 더 확인한 뒤 창을 거뒀다.\n\n“들어가. 대신 사고 치지 마.”');})];},
  citizen(){if((state.talkCount.citizen||0)<1)return [];return [c('이야기를 마치고 헤어진다','시민에게서 들은 소문을 기억하고 중앙가로 돌아간다.',()=>{state.stats.talkSolved++;resolve('talk','citySquare','시민은 마지막으로 빵 봉투를 고쳐 들고 시장 안쪽으로 사라졌다.\n\n짧은 대화였지만 왕국 사람들이 무엇을 두려워하는지는 조금 더 선명해졌다.');})];},
  forestMerchant(){if((state.talkCount.forestMerchant||0)<2)return [];return [c('정보를 충분히 들었다고 말한다','로벤을 해치지 않고 숲 안쪽으로 들어간다.',()=>{state.flags.merchantAlive=true;state.relation.merchants+=1;state.stats.talkSolved++;resolve('talk','forestRoad','로벤은 수레 고삐를 다시 잡는다.\n\n“살아서 또 보자고. 그게 상인한텐 제일 좋은 거래니까.”\n\n당신은 그가 알려준 길을 따라 숲 안쪽으로 향한다.');})];},
  guildNovice(){if((state.talkCount.guildNovice||0)<2||!state.flags.merchantAlive||state.flags.merchantKilled)return [];return [c('로벤에게 확인하라고 한다','살려둔 상인이 당신의 말에 신빙성을 더한다.',()=>{state.stats.talkSolved++;state.relation.merchants+=2;resolve('talk','forestBeforeBoss','초급 기사는 한참 망설이다 검을 내린다.\n\n“로벤이 살아 있다면 확인하겠다. 하지만 도적단 편에 완전히 서지는 마.”\n\n싸움 없이 교역로를 통과했다.');})];}
};
function dialogueExitChoices(){const f=DIALOGUE_EXIT_CHOICES[state.sceneId];return f?f():[];}
function encounterStatusHtml(enemy,sc){
  const m=encMod(), chips=[];
  const t=state.talkCount[state.sceneId]||0, p=talkProfile();
  if(p)chips.push(`<span class="encounter-chip info">대화 ${Math.min(t,p.steps.length)}/${p.steps.length}</span>`);
  if(m.attackStat||m.attackPct)chips.push(`<span class="encounter-chip good">공격 보정 ${m.attackStat?`+${m.attackStat} 능력`:''}${m.attackPct?` ${m.attackPct>0?'+':''}${m.attackPct}%`:''}</span>`);
  if(m.socialStat||m.socialPct)chips.push(`<span class="encounter-chip ${m.socialPct<0?'bad':'good'}">처세 보정 ${m.socialStat?`+${m.socialStat} 능력`:''}${m.socialPct?` ${m.socialPct>0?'+':''}${m.socialPct}%`:''}</span>`);
  if(m.speed)chips.push(`<span class="encounter-chip good">속도 ${m.speed>0?'+':''}${m.speed}</span>`);
  if(m.enemyAtk<0)chips.push(`<span class="encounter-chip good">적 공격 ${m.enemyAtk}</span>`);
  if(m.enemyAtk>0)chips.push(`<span class="encounter-chip bad">적 공격 +${m.enemyAtk}</span>`);
  if(m.comebackMin<6)chips.push(`<span class="encounter-chip good">역전 ${m.comebackMin}~6</span>`);
  if(m.revealed)chips.push(`<span class="encounter-chip info">약점 관찰됨</span>`);
  return chips.length?`<div class="encounter-status">${chips.join('')}</div>`:'';
}

// ---------- Rendering / UI ----------
const $ = (id) => document.getElementById(id);
const screens = ['menuScreen','classScreen','gameScreen','endScreen'];

function showScreen(id) {
  for (const s of screens) $(s).classList.toggle('active', s === id);
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderClasses() {
  $('classGrid').innerHTML = Object.entries(CLASSES).map(([id,cl]) => `
    <article class="class-card ${cl.unlocked?'':'locked'}">
      <div class="class-head"><div class="class-name">${cl.unlocked?'':'🔒 '}${cl.name}</div><span class="tag">${cl.unlocked?'선택 가능':'잠김'}</span></div>
      <div class="stats-row">
        ${statBox('체력',cl.hp)}${statBox('공격',cl.atk)}${statBox('처세',cl.social)}${statBox('속도',cl.speed)}
      </div>
      <div class="passive"><strong>${cl.passive}</strong><br>${cl.desc}</div>
      <button class="btn ${cl.unlocked?'primary':''}" ${cl.unlocked?'':'disabled'} onclick="selectClass('${id}')">${cl.unlocked?'이 직업으로 시작':'해금되지 않음'}</button>
    </article>`).join('');
}
function statBox(nm,v){return `<div class="stat-box">${nm}<b>${v}</b></div>`;}

function render() {
  const sc = SCENES[state.sceneId];
  if (!sc || !state.p) return;
  const enemy = getEnemy(sc);

  $('hudClass').textContent = `${state.p.className} · 공격 ${state.p.atk}`;
  $('hudGold').textContent = `◆ ${state.p.gold}`;
  $('hpText').textContent = `${state.p.hp} / ${state.p.maxHp}`;
  $('hpBar').style.width = `${Math.max(0, Math.min(100, state.p.hp/state.p.maxHp*100))}%`;
  $('hudStats').textContent = `처세 ${state.p.social} · 속도 ${state.p.speed} · 진행 ${state.stats.progress}`;

  $('chapter').textContent = sc.chapter || '';
  $('location').textContent = sc.location || '';
  $('sceneArt').innerHTML = art(sc.art || 'exile');
  $('story').textContent = richSceneText(sc);

  const toastBox = $('resultToast');
  toastBox.textContent = state.lastToast || '';
  toastBox.classList.toggle('hidden', !state.lastToast);

  $('enemyPanel').classList.toggle('hidden', !enemy);
  $('actionGrid').classList.toggle('hidden', !enemy);
  if (enemy) {
    $('enemyName').textContent = enemy.name;
    $('enemyRank').textContent = enemy.rank || '';
    $('enemyStats').innerHTML = `체력 ${enemy.hp} · 공격 ${enemy.atk} · 처세 ${enemy.social} · 속도 ${enemy.speed}${encounterStatusHtml(enemy,sc)}`;
    $('attackInfo').textContent = `예상 승률 ${attackChance(enemy)}% · 공격하면 전투 돌입`;
    $('talkInfo').textContent=talkLabel();
    $('socialInfo').textContent = sc.socialDisabled ? '사용 불가' : state.socialUsed[state.sceneId] ? '이미 시도함' : `성공률 ${socialChance(enemy,sc)}%`;
    const rc = runChance(enemy);
    const runAlreadyUsed=!!state.escapeAttempted;
    $('runInfo').textContent = runLabel(enemy, rc);
    const socialBtn = document.querySelector('[data-game-action="social"]');
    socialBtn.classList.toggle('locked-action', !!sc.socialDisabled);
    socialBtn.classList.toggle('used', !!state.socialUsed[state.sceneId]);
    const runBtn=document.querySelector('[data-game-action="run"]');
    runBtn.classList.toggle('locked-action', rc===0 || runAlreadyUsed);
    runBtn.classList.toggle('used', runAlreadyUsed);
  }

  const baseChoices = typeof sc.choices === 'function' ? sc.choices() : (sc.choices || []);
  const choices = [...baseChoices, ...dialogueExitChoices()];
  const waiting = !!state.pending;
  $('continueBtn').classList.toggle('hidden', !waiting);
  $('choiceArea').classList.toggle('hidden', waiting);
  if (enemy) $('actionGrid').classList.toggle('hidden', waiting);
  $('encounterTools').classList.toggle('hidden', !enemy || waiting);
  if(enemy){const usable=state.inventory.filter(n=>ITEMS[n]?.encounter||ITEMS[n]?.heal||ITEMS[n]?.persistent).length;$('encounterItemInfo').textContent=usable?`사용 가능 ${usable}개 · 사용 후 판정 즉시 갱신`:'사용 가능한 물품 없음';}
  $('sceneCard').classList.toggle('deep-dialogue', !!talkProfile() && (state.talkCount[state.sceneId]||0)>0);
  $('choiceArea').innerHTML = choices.filter(Boolean).map((x,i)=>`<button class="choice-btn" data-choice="${i}"><b>${escapeHtml(x.label)}</b>${x.note?`<small>${escapeHtml(x.note)}</small>`:''}</button>`).join('');
  [...document.querySelectorAll('[data-choice]')].forEach(btn => {
    btn.onclick = () => { if(!state.pending) choices[Number(btn.dataset.choice)].fn(); };
  });
}

function art(kind) {
  const palettes = {
    exile:['#1c2028','#3e3a42','#9b835f'], beggars:['#28231f','#514536','#a58c63'], gangster:['#1b2028','#49332e','#b05d42'],
    shop:['#2c241a','#6b4c28','#d3a35d'], gate:['#1a2028','#47505c','#9ca7b5'], city:['#27303a','#6a6258','#c0aa85'], citizen:['#2b3034','#675b4f','#c7ad7e'],
    alarm:['#26171a','#5d252b','#b64b4f'], captain:['#1b202a','#4d5668','#c9d0dc'], oldguard:['#17191d','#47443c','#c1ae7d'], king:['#251d1d','#6f3434','#d1aa55'],
    barracks:['#1e2429','#515c62','#a89a78'], bandits:['#1c251f','#40543f','#a35a44'], camp:['#24241e','#615a3d','#d0a55b'], banditcamp:['#182018','#3f5233','#b06d44'],
    boss:['#241b21','#613343','#c65e72'], rebel:['#281619','#6d262e','#d16b56'], kingrage:['#2b1516','#761f25','#dc9b4d'], merchant:['#24251e','#626142','#cfb06a'],
    forest:['#111d18','#284b36','#78975d'], capture:['#151e19','#3b4939','#a65a3b'], officer:['#231b1d','#5a3037','#bd614e'], guild:['#1d2327','#45535d','#a9b9c2'], midknight:['#171b20','#36424f','#bdc8d4'],crossroad:['#1b1e20','#45413d','#b49663']
  };
  const p = palettes[kind] || palettes.exile;
  const moon = ['forest','bandits','banditcamp','capture','officer','boss','crossroad'].includes(kind);
  const castle = ['gate','city','alarm','captain','oldguard','king','kingrage','barracks','rebel'].includes(kind);
  const figures = ['beggars','gangster','citizen','captain','oldguard','boss','merchant','officer','guild','midknight','king','kingrage'].includes(kind);
  return `<svg viewBox="0 0 600 280" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${p[1]}"/><stop offset="1" stop-color="${p[0]}"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="9"/></filter></defs>
    <rect width="600" height="280" fill="url(#g)"/>
    <circle cx="${moon?470:110}" cy="60" r="34" fill="${p[2]}" opacity=".35" filter="url(#blur)"/><circle cx="${moon?470:110}" cy="60" r="22" fill="${p[2]}" opacity=".45"/>
    ${castle?`<path d="M40 210V110h60V80h45v42h55V65h58v57h50V92h48v30h52V72h58v138z" fill="#0b0d11" opacity=".78"/><path d="M0 210h600v70H0z" fill="#0a0c0f"/>`:`<path d="M0 208 Q90 160 180 205T360 196T600 205V280H0Z" fill="#0a0c0e" opacity=".88"/>`}
    ${!castle?`<path d="M55 210l22-115 18 115M145 210l30-150 22 150M510 210l-24-135-19 135M430 210l-20-105-18 105" stroke="#0b0e0d" stroke-width="18" stroke-linecap="round" opacity=".76"/>`:''}
    ${figures?`<g transform="translate(300 86)" fill="#090a0d"><circle cx="0" cy="25" r="20"/><path d="M-31 126Q-26 52 0 48Q26 52 31 126z"/><path d="M-15 123l-18 72h22L0 140l12 55h22l-20-72z"/></g>`:''}
    ${kind==='beggars'?`<g fill="#101113" opacity=".9"><circle cx="210" cy="155" r="12"/><path d="M195 210q4-42 15-43t16 43z"/><circle cx="390" cy="165" r="11"/><path d="M376 214q4-37 14-38t15 38z"/></g>`:''}
    ${kind==='shop'?`<rect x="170" y="105" width="260" height="130" rx="4" fill="#11100d"/><path d="M150 115h300l-35-48H185z" fill="#4c3824"/><rect x="275" y="160" width="55" height="75" fill="#241b12"/><circle cx="315" cy="125" r="18" fill="${p[2]}" opacity=".8"/>`:''}
    ${kind==='rebel'?`<path d="M120 70v155M120 75l90 30-90 32z" stroke="#171012" stroke-width="8" fill="#7d2630"/><path d="M480 70v155M480 75l-90 30 90 32z" stroke="#171012" stroke-width="8" fill="#7d2630"/>`:''}
    <rect y="220" width="600" height="60" fill="#08090c" opacity=".45"/>
  </svg>`;
}

// ---------- Gameplay ----------
function selectClass(id) {
  const cl=CLASSES[id]; if(!cl || !cl.unlocked) return;
  state=freshState(); state.classId=id;
  state.p={className:cl.name,maxHp:cl.hp,hp:cl.hp,atk:cl.atk,social:cl.social,speed:cl.speed,gold:10};
  state.sceneId='intro'; save(); showScreen('gameScreen'); enter('intro');
}

function c(label,note,fn){return {label,note,fn};}
function bumpTalk(id){state.talkCount[id]=(state.talkCount[id]||0)+1;return state.talkCount[id];}
function getEnemy(sc=SCENES[state.sceneId]) {
  if(!sc) return null;
  let e = sc.enemyOverride ? {...sc.enemyOverride} : (sc.enemy && ENEMIES[sc.enemy] ? {...ENEMIES[sc.enemy]} : null);
  if(e && sc.enemyMod) e=sc.enemyMod(e);
  if(e){const m=encMod(sc.id||state.sceneId);e.atk=Math.max(1,Number(e.atk||1)+Number(m.enemyAtk||0));}
  return e;
}
function attackChance(enemy) {
  const m=encMod();
  const mine=Math.max(1,state.p.hp*effectiveAttack()), theirs=Math.max(1,enemy.hp*enemy.atk);
  return clamp(Math.round(mine/(mine+theirs)*100)+Number(m.attackPct||0),3,97);
}
function socialChance(enemy,sc) {
  const m=encMod();
  const social=effectiveSocial();
  let chance=Math.round((Math.max(0,social)/(Math.max(0,social)+Math.max(1,enemy.social)))*100);
  if(state.classId==='noble') chance+=14;
  chance-=sc.socialPenalty||0;
  chance+=Number(m.socialPct||0);
  if(state.flags.gangsterTruth && state.sceneId==='gangster') chance+=16;
  return clamp(chance,3,95);
}
function runChance(enemy) {
  const mySpeed=effectiveSpeed();
  const enemySpeed=Number(enemy?.speed||0);
  if(mySpeed>enemySpeed) return 100;
  if(state.classId!=='thief') return 0;
  const closeness=enemySpeed<=0?1:Math.min(1,mySpeed/enemySpeed);
  return clamp(Math.round(33+17*closeness),33,50);
}

function runLabel(enemy, chance) {
  const mine=effectiveSpeed(), foe=Number(enemy?.speed||0);
  if(state.escapeAttempted) return `이번 조우에서 이미 시도함 · 속도 ${mine} : ${foe}`;
  if(chance===100) return `속도 ${mine} > ${foe} · 반드시 성공`;
  if(chance===0) return `속도 ${mine} ≤ ${foe} · 도망 불가`;
  return `도둑 특성 · ${chance}% · 1회 (${mine} : ${foe})`;
}

function forestProgressScene(skipMerchant=false){
  // 도망 때문에 이미 끝낸 핵심 사건으로 되감기지 않도록 가장 앞선 안전 지점을 고른다.
  if(state.entered?.friendBridge || state.flags.banditTruce || state.entered?.banditBossForest || state.entered?.banditBossRoyal) return 'friendBridge';
  if(state.entered?.midKnight) return 'banditBossForest';
  if(state.entered?.forestBeforeBoss || state.entered?.guildNovice || state.entered?.guildNoviceAngry) return 'forestBeforeBoss';
  if(state.entered?.banditCampLife || state.entered?.officer2 || state.entered?.officer2Angry) return 'banditCampLife';
  if(state.entered?.forestRoad || state.entered?.forestMerchant || skipMerchant) return 'forestRoad';
  return 'forestMerchant';
}
function isLateDiplomacy(){
  return !!(state.flags.banditTruce || state.flags.bossTalked || state.flags.rebelOfferReady || state.entered?.banditBossRoyal || state.entered?.banditBossForest || state.entered?.friendBridge || state.flags.rebel);
}
const ESCAPE_ROUTES = {
  gangster:          {to:'roadsideAftermath', text:'당신은 이 일과 아무 상관도 없는 사람처럼 골목을 빠져나왔다.'},
  gangsterAngry:     {to:'roadsideAftermath', text:'더 악화되기 전에 골목을 빠져나왔다.'},
  kingdomGate:       {to:()=>isLateDiplomacy()?'friendBridge':forestProgressScene(false), text:'성벽을 등지고 다른 길을 택했다. 지나온 사건으로 되돌아가지는 않는다.'},
  gateSuspicious:    {to:()=>isLateDiplomacy()?'friendBridge':forestProgressScene(false), text:'통행세 대신 성벽 바깥길로 빠졌다.'},
  citizen:           {to:'citySquare', text:'시민과 엮이지 않고 군중 속으로 물러났다.'},
  citizenSuspicious: {to:'citySquare', text:'경비가 오기 전에 사람들 틈으로 사라졌다.'},
  guardResponse:     {to:'kingdomEscape', text:'수색대가 길을 봉쇄하기 전에 왕국 외곽 수로로 빠졌다.', before(){state.flags.kingdomHostile=true;}},
  guardFurious:      {to:'kingdomEscape', text:'검끝을 피해 골목을 가로질러 왕국 외곽까지 달아났다.', before(){state.flags.kingdomHostile=true;}},
  captainEnraged:    {to:'kingdomEscape', text:'친위대장 레오른의 추격을 떨치고 폐쇄된 수로까지 빠져나왔다.', before(){state.flags.kingdomHostile=true;state.flags.escapedCaptain=true;}},
  oldVeteran:        {to:'kingdomEscape', text:'아르벤과 결판을 내지 않고 왕궁 계단에서 물러났다.', before(){state.flags.escapedOldGuard=true;}},
  banditScoutRoyal:  {to:'citySquare', text:'정찰 임무를 포기하고 왕국으로 돌아왔다.'},
  banditScoutCornered:{to:'citySquare',text:'지원 신호가 울리기 전에 왕국 쪽으로 후퇴했다.'},
  banditBossRoyal:   {to:'banditTruce', text:'세리아와의 결판을 미뤘다. 전쟁은 아직 끝나지 않았다.'},
  banditBossAngry:   {to:'banditTruce', text:'세리아의 칼을 피해 본거지 밖으로 빠져나왔다.'},
  captainRebel:      {to:'rebelRetreat', text:'반란군의 진격에서 이탈해 후퇴로로 빠졌다.', before(){state.flags.rebellionRetreated=true;}},
  kingEnraged:       {to:'rebelRetreat', text:'왕과의 마지막 결판을 포기하고 전장을 이탈했다.', before(){state.flags.rebellionRetreated=true;state.flags.escapedKing=true;}},
  forestMerchant:    {to:'forestRoad', text:'로벤을 지나쳐 숲 안쪽으로 들어갔다.', before(){state.flags.merchantAlive=true;}},
  merchantCaptured:  {to:'officer2', text:'로벤을 남겨두고 도적단의 시야에서 빠져나왔다.', before(){state.flags.merchantAbandoned=true;}},
  officer1Angry:     {to:'officer2', text:'상인을 두고 도망쳐 다음 갈림길까지 달렸다.', before(){state.flags.merchantAbandoned=true;}},
  officer2:          {to:'banditCampLife', text:'돌다리를 돌아 우회해 도적단 야영지 외곽으로 이동했다.'},
  officer2Angry:     {to:'banditCampLife', text:'돌다리를 버리고 숲을 가로질러 야영지 외곽으로 빠졌다.'},
  guildNovice:       {to:'forestBeforeBoss', text:'교역로를 벗어나 본거지 외곽 숲으로 사라졌다.'},
  guildNoviceAngry:  {to:'forestBeforeBoss', text:'초급 기사의 추격을 피해 본거지 외곽까지 달아났다.'},
  midKnight:         {to:'banditBossForest', text:'중급 기사의 추격을 따돌리고 도적단 본거지 안으로 뛰어들었다.', before(){state.flags.midKnightEscaped=true;}},
  banditBossForest:  {to:'friendBridge', text:'세리아와의 결판을 미루고 본거지를 빠져나왔다.'},
  banditBossAngryForest:{to:'friendBridge',text:'세리아와의 싸움을 피해 왕국과 숲 사이 다리로 이동했다.'}
};
function handleEscapeSuccess(){
  const route=ESCAPE_ROUTES[state.sceneId];
  if(!route){
    console.error('[ESCAPE] missing route for',state.sceneId);
    queueOutcome('도망에는 성공했지만 이동 경로를 찾지 못했다. 이 장면은 안전하게 유지된다.',null);
    return;
  }
  if(route.before) route.before();
  const target=typeof route.to==='function'?route.to():route.to;
  if(!target || !SCENES[target] || target===state.sceneId){
    console.error('[ESCAPE] invalid target',state.sceneId,target);
    queueOutcome('도망 경로가 꼬이는 것을 막기 위해 현재 장면에서 멈췄다.',null);
    return;
  }
  state.flags.lastEscapeFrom=state.sceneId;
  state.flags.lastEscapeTo=target;
  resolve('run',target,route.text||'도망에 성공했다.');
}

function gameAction(type) {
  const sc=SCENES[state.sceneId], enemy=getEnemy(sc); if(!sc||!enemy||state.ended)return;
  if(type==='talk') { handleTalk(sc); return; }
  if(type==='social') {
    if(sc.socialDisabled || state.socialUsed[state.sceneId]) return;
    state.socialUsed[state.sceneId]=true;
    const chance=socialChance(enemy,sc);
    if(Math.random()*100<chance){state.stats.socialSuccess++;fx('good');floatText('처세 성공');if(sc.socialSuccess)sc.socialSuccess();else resolve('social',null,'처세에 성공했다.');}
    else {state.stats.socialFail++;fx('bad');floatText('처세 실패');if(sc.socialFail)sc.socialFail();else {toast('처세에 실패했다. 같은 방법은 다시 통하지 않는다.','bad');render();save();}}
    return;
  }
  if(type==='run') {
    if(state.escapeAttempted) return;
    const chance=runChance(enemy);
    if(chance<=0) return;
    // 한 조우에서 도주 판정은 딱 한 번만 한다.
    state.escapeAttempted=true;
    if(chance===100 || Math.random()*100<chance){
      state.stats.runSuccess++;fx('good');floatText('도주 성공');
      if(sc.runSuccess)sc.runSuccess();else resolve('run',null,'도망쳤다.');
    } else {
      fx('hit');floatText('도주 실패');
      const damage=Math.max(1,Math.floor(enemy.atk/3));
      damagePlayer(damage,true);
      if(state.p.hp>0){
        queueOutcome(`도망에 실패했다. ${enemy.name}에게 붙잡혀 체력 ${damage}을 잃었다.\n\n이 조우에서는 더 이상 도망을 시도할 수 없다.`, null);
      }
    }
    save();
    return;
  }
  if(type==='attack') {
    if(battleBusy) return;
    startBattleSequence(sc, enemy);
  }
}


let battleBusy=false;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
function setBattleText(text, cls=''){
  const el=$('battleText'); if(!el)return; el.className=`battle-text ${cls}`.trim(); el.textContent=text;
}
function battleHitFx(){
  const st=document.querySelector('.battle-stage'); if(!st)return;
  st.classList.remove('hit'); void st.offsetWidth; st.classList.add('hit');
}
function showBattleOverlay(enemy){
  const ov=$('battleOverlay');
  ov.className='battle-overlay';
  $('battleEnemyName').textContent=enemy.name;
  $('battlePlayerName').textContent=state.p.className;
  $('battleEnemyLabel').textContent=enemy.name;
  $('battlePlayerHp').style.width='100%';
  $('battleEnemyHp').style.width='100%';
  $('battleDiceWrap').classList.add('hidden');
  $('battleDie').classList.remove('rolling');
  $('actionGrid').classList.add('battle-locked');
  setBattleText('서로의 거리를 재고 있다…');
}
function hideBattleOverlay(){
  $('battleOverlay').classList.add('hidden');
  $('actionGrid').classList.remove('battle-locked');
}
async function rollComebackDie(){
  $('battleDiceWrap').classList.remove('hidden');
  const min=encMod().comebackMin||6; const cap=document.querySelector('.dice-caption'); if(cap)cap.textContent=`역전 판정 · ${min===6?'6':min+'~6'}이 나오면 뒤집는다`;
  const die=$('battleDie'); die.classList.add('rolling');
  const finalRoll=1+Math.floor(Math.random()*6);
  for(let i=0;i<10;i++){
    die.textContent=String(1+Math.floor(Math.random()*6));
    await sleep(85+i*8);
  }
  die.classList.remove('rolling');
  die.textContent=String(finalRoll);
  await sleep(650);
  return finalRoll;
}
async function startBattleSequence(sc, enemy){
  if(battleBusy||state.ended)return;
  battleBusy=true;
  showBattleOverlay(enemy);
  try{
    const chance=attackChance(enemy);
    await sleep(500);
    setBattleText(`전투 개시\n예상 승률 ${chance}%`);
    await sleep(650);
    battleHitFx(); fx('hit');
    setBattleText(`${enemy.name}과 첫 충돌!`);
    await sleep(600);
    const won=Math.random()*100<chance;
    if(won){
      $('battleEnemyHp').style.width='18%';
      setBattleText('공세가 먹혔다.\n상대의 균형이 무너진다.','advantage');
      await sleep(750);
      $('battleOverlay').classList.add('victory');
      setBattleText('승리','advantage');
      await sleep(650);
      finishBattleWin(sc,enemy,chance,false);
      return;
    }

    $('battlePlayerHp').style.width='22%';
    battleHitFx();
    setBattleText('밀리고 있다.\n한 번만 더 버티면 기회가 온다.','danger');
    await sleep(850);
    const comebackMin=encMod().comebackMin||6;
    setBattleText(`역전 주사위를 굴린다.\n${comebackMin===6?'6':comebackMin+'~6'}이 나오면 전세를 뒤집는다.`,'danger');
    const roll=await rollComebackDie();
    if(roll>=(encMod().comebackMin||6)){
      $('battleOverlay').classList.add('comeback-bg');
      $('battleEnemyHp').style.width='0%';
      setBattleText(`${roll} · 역전!`,'comeback');
      fx('good'); shake();
      await sleep(900);
      finishBattleWin(sc,enemy,chance,true);
      return;
    }

    $('battleOverlay').classList.add('defeat');
    setBattleText(`${roll} · 역전에 실패했다.\n전투가 끝난다.`,'danger');
    await sleep(900);
    hideBattleOverlay();
    battleBusy=false;
    die(`${enemy.name}과의 전투에서 밀린 끝에 역전 주사위도 실패했다.`);
  }catch(err){
    console.error(err);
    hideBattleOverlay(); battleBusy=false;
  }
}
function finishBattleWin(sc,enemy,chance,comeback){
  if(chance<=35)state.stats.riskyWins++;
  if(comeback){state.stats.comebackWins=(state.stats.comebackWins||0)+1; state.stats.riskyWins++;}
  const base=comeback?0.22:0.08;
  const spread=comeback?0.20:0.18;
  const dmg=Math.min(Math.max(0,Math.floor(enemy.atk*(base+Math.random()*spread))),Math.max(0,state.p.hp-1));
  if(dmg>0){state.p.hp-=dmg;floatText(`HP -${dmg}`);}
  state.stats.kills++; if(enemy.elite)state.stats.eliteKills++;
  hideBattleOverlay(); battleBusy=false;
  const prefix=comeback?`[역전승] 주사위가 승부를 뒤집었다. 패배 직전 전세를 뒤집었다.${dmg?`\n체력 ${dmg}을 잃었다.`:''}\n\n`:'';
  if(sc.attackWin){
    if(comeback){state.lastToast=prefix.trim();}
    sc.attackWin();
    if(comeback && state.lastToast && !state.lastToast.startsWith('[역전승]')) state.lastToast=prefix+state.lastToast;
  } else resolve('attack',null,prefix+'전투에서 승리했다.');
  save(); render();
}

function resolve(method,next,msg,ending=null) {
  state.stats.progress++;
  if(state.classId==='knight' && method!=='social' && method!=='run') { state.p.atk++; msg += '\n\n[기사] 신조 유지 · 공격력 +1'; floatText('공격력 +1'); }
  queueOutcome(msg||'행동의 결과가 정해졌다.', next, ending);
}
function queueOutcome(msg,next=null,ending=null) {
  state.lastToast=msg||'';
  state.pending={next,ending};
  save(); render();
}
function continueOutcome(){
  if(!state.pending)return;
  const p=state.pending;
  state.pending=null;
  state.lastToast='';
  save();
  if(p.ending){ finish(p.ending); return; }
  if(p.next){ go(p.next); return; }
  render();
}
function go(id, msg='') { if(!SCENES[id])return; state.pending=null; const changed=id!==state.sceneId; if(changed&&state.encounterMods)delete state.encounterMods[state.sceneId]; if(changed){state.escapeAttempted=false;state.escapeSerial=(state.escapeSerial||0)+1;} state.sceneId=id; state.lastToast=msg; state.stats.progress++; save(); enter(id); }
function enter(id) {
  showScreen('gameScreen');
  const sc=SCENES[id];
  if(!state.entered[id]){state.entered[id]=true;if(sc.onFirstEnter)sc.onFirstEnter();}
  render();
}
function gainGold(v){v=Math.max(0,Math.floor(v));state.p.gold+=v;state.stats.goldEarned+=v;if(v)floatText(`◆ +${v}`);}
function spendGold(v){if(state.p.gold<v)return false;state.p.gold-=v;state.stats.goldSpent+=v;return true;}
function addItem(name,count=1){for(let i=0;i<count;i++)state.inventory.push(name);}
function heal(v,visual=true){const before=state.p.hp;state.p.hp=Math.min(state.p.maxHp,state.p.hp+v);if(visual&&state.p.hp>before)floatText(`HP +${state.p.hp-before}`);}
function damagePlayer(v,canDie=true){state.p.hp-=v;if(state.p.hp<=0){state.p.hp=0;if(canDie)die('상처를 버티지 못하고 쓰러졌다.');else state.p.hp=1;}}
function gainStat(kind,amount=1){amount=Math.max(1,Math.floor(amount));if(kind==='hp'){state.p.maxHp+=amount;state.p.hp+=amount;floatText(`최대 HP +${amount}`);}else if(kind==='atk'){state.p.atk+=amount;floatText(`공격력 +${amount}`);}else if(kind==='social'){state.p.social+=amount;floatText(`처세 +${amount}`);}else if(kind==='speed'){state.p.speed+=amount;floatText(`속도 +${amount}`);}state.stats.growths=(state.stats.growths||0)+amount;save();}
function takeGrowth(flag,kind,msg,next=null){if(state.flags[flag]){if(next)go(next);return;}state.flags[flag]=true;gainStat(kind,1);state.stats.progress++;queueOutcome(msg,next);}
function canFriendEnding(loose=false){
  const keyKills=state.flags.citizenKilled||state.flags.guardKilled||state.flags.guardResponseKilled||state.flags.captainKilled||state.flags.officer1Killed||state.flags.officer2Killed||state.flags.noviceKilled||state.flags.midKnightKilled;
  const relations=state.relation.kingdom>=2 && state.relation.bandits>=3 && state.relation.merchants>=1;
  return !keyKills && relations && (loose || state.flags.merchantAlive!==false);
}

function finish(name) {
  if(state.ended)return; state.ended=true; state.stats.ending=name;
  state.stats.survivors = ['merchantAlive','gangsterPeace'].filter(f=>state.flags[f]).length + (!state.flags.citizenKilled?1:0) + (!state.flags.captainKilled?1:0);
  save();
  const e=ENDINGS[name]||ENDINGS['BAD END'];
  $('endingArt').textContent=e.icon;$('endKind').textContent=e.kind;$('endTitle').textContent=name;$('endEpilogue').textContent=e.epilogue;
  $('playStyle').textContent=`플레이 스타일 · ${playStyle()}`;
  $('endScore').textContent=clientScore().toLocaleString();
  $('endStats').innerHTML=`${name==='BAD END' && state.flags.deathReason?`<b>사망 원인</b> · ${escapeHtml(state.flags.deathReason)}<br><br>`:''}진행도 <b>${state.stats.progress}</b><br>처치 <b>${state.stats.kills}</b> · 강적 <b>${state.stats.eliteKills}</b><br>대화 해결 <b>${state.stats.talkSolved}</b> · 처세 성공 <b>${state.stats.socialSuccess}</b> · 실패 <b>${state.stats.socialFail}</b><br>도망 성공 <b>${state.stats.runSuccess}</b> · 역전승 <b>${state.stats.comebackWins||0}</b> · 비밀 발견 <b>${state.stats.secrets}</b><br>성장 횟수 <b>${state.stats.growths||0}</b> · 대화 횟수 <b>${state.stats.talkInteractions||0}</b> · 아이템 사용 <b>${state.stats.itemsUsed||0}</b><br>획득 골드 <b>${state.stats.goldEarned}</b> · 남은 골드 <b>${state.p.gold}</b>`;
  fx(name==='BAD END'?'bad':'good');showScreen('endScreen');
}
function die(reason){state.p.hp=0;state.flags.deathReason=reason;state.lastToast=reason;finish('BAD END');}
function playStyle(){
  const s=state.stats;
  const pairs=[['전투광',s.kills*3+s.riskyWins*2],['협상가',s.socialSuccess*3+s.talkSolved],['생존가',s.runSuccess*4],['탐색가',s.secrets*5+s.talkSolved],['파괴자',s.eliteKills*5+s.kills]];
  pairs.sort((a,b)=>b[1]-a[1]);return pairs[0][1]===0?'방랑자':pairs[0][0];
}
function clientScore(){const s=state.stats,b=ENDINGS[s.ending]?.bonus||0;return Math.max(0,Math.floor(s.progress*115+s.goldEarned*3+state.p.gold*1.2+s.kills*170+s.eliteKills*950+s.riskyWins*650+(s.comebackWins||0)*900+s.talkSolved*170+s.socialSuccess*185+s.runSuccess*85+s.secrets*500+(s.growths||0)*140+s.survivors*220-s.socialFail*25+b));}

// ---------- Inventory / shop ----------
const ITEMS = {
  '붕대':{heal:3,kind:'회복',desc:'체력 3 회복. 조우 중에도 사용 가능.'},
  '고급 붕대':{heal:5,kind:'회복',desc:'체력 5 회복. 조우 중에도 사용 가능.'},
  '상인의 물약':{heal:999,kind:'회복',desc:'체력을 완전히 회복한다.'},
  '철제 부적':{persistent:true,kind:'영구',desc:'사용 즉시 최대 체력 +2.',apply(){state.p.maxHp+=2;state.p.hp+=2;floatText('최대 HP +2');}},
  '강심제':{encounter:true,kind:'조우',desc:'현재 조우에서 공격력 +2.',apply(m){m.attackStat=clamp((m.attackStat||0)+2,0,6);}},
  '은빛 브로치':{encounter:true,kind:'조우',desc:'현재 조우에서 처세 +2.',apply(m){m.socialStat=clamp((m.socialStat||0)+2,0,6);}},
  '경량 장화끈':{encounter:true,kind:'조우',desc:'현재 조우에서 속도 +2. 도망 판정도 즉시 변한다.',apply(m){m.speed=clamp((m.speed||0)+2,0,8);}},
  '연막탄':{encounter:true,kind:'조우',desc:'현재 조우에서 속도 +5. 자동 도주는 아니며 기존 속도 규칙을 따른다.',apply(m){m.speed=clamp((m.speed||0)+5,0,10);}},
  '독병':{encounter:true,kind:'조우',desc:'상대의 음료나 상처에 독을 묻힌다. 현재 조우에서 적 공격력 -3.',apply(m){m.enemyAtk=clamp((m.enemyAtk||0)-3,-8,8);}},
  '관찰자의 렌즈':{encounter:true,kind:'조우',desc:'상대의 약점을 읽어 현재 조우 공격 승률 +10%.',apply(m){m.attackPct=clamp((m.attackPct||0)+10,-30,35);m.revealed=true;}},
  '행운의 동전':{encounter:true,kind:'조우',desc:'이번 조우의 역전 주사위가 5~6에서 성공한다.',apply(m){m.comebackMin=Math.min(m.comebackMin||6,5);}},
  '뇌물 봉투':{encounter:true,kind:'조우',desc:'상대가 돈에 흔들릴 여지를 만든다. 현재 조우 처세 성공률 +20%.',apply(m){m.socialPct=clamp((m.socialPct||0)+20,-30,40);}}
};
const SHOP = [
  {name:'붕대',cost:8},{name:'고급 붕대',cost:16},{name:'강심제',cost:20},{name:'은빛 브로치',cost:20},
  {name:'경량 장화끈',cost:18},{name:'연막탄',cost:26},{name:'독병',cost:28},{name:'관찰자의 렌즈',cost:30},{name:'행운의 동전',cost:34},{name:'뇌물 봉투',cost:24},
  {name:'든든한 식사',cost:20,desc:'최대 체력 +1, 체력 완전 회복',buy(){state.p.maxHp++;state.p.hp=state.p.maxHp;floatText('최대 HP +1');}},
  {name:'숫돌',cost:26,desc:'공격력 영구 +1',buy(){state.p.atk++;floatText('공격력 +1');}}
];
function openShop(){
  $('modal').innerHTML=`<h2>상점</h2><div class="modal-sub">보유 골드 ◆ ${state.p.gold} · 조우용 물품은 상대와 마주친 뒤 사용할 수 있다.</div>${SHOP.map((x,i)=>`<div class="shop-row"><div class="item-copy"><b>${x.name}${ITEMS[x.name]?`<span class="item-kind">${ITEMS[x.name].kind}</span>`:''}</b><small>${x.desc||ITEMS[x.name]?.desc||''}</small></div><button class="shop-btn" data-buy="${i}">◆ ${x.cost}</button></div>`).join('')}<button class="btn modal-close" onclick="closeModal()">나간다</button>`;
  showModal();document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const x=SHOP[Number(b.dataset.buy)];if(!spendGold(x.cost)){toast('골드가 부족하다.','bad');return;}if(x.buy)x.buy();else addItem(x.name);save();openShop();render();});
}
function inventoryCounts(){const counts={};for(const x of state.inventory)counts[x]=(counts[x]||0)+1;return counts;}
function openBag(){
  const rows=Object.entries(inventoryCounts());
  $('modal').innerHTML=`<h2>가방</h2><div class="modal-sub">회복/영구 물품은 여기서 사용. 조우 물품은 적과 마주친 화면의 ‘조우 아이템’에서 사용한다.</div>${rows.length?rows.map(([nm,count])=>{const it=ITEMS[nm];const can=!!(it?.heal||it?.persistent);return `<div class="bag-row ${can?'':'item-disabled'}"><div class="item-copy"><b>${nm} × ${count}${it?`<span class="item-kind">${it.kind}</span>`:''}</b><small>${itemDesc(nm)}</small></div><button class="shop-btn" data-use="${escapeAttr(nm)}" ${can?'':'disabled'}>${can?'사용':'조우용'}</button></div>`}).join(''):'<p class="modal-sub">아무것도 없다.</p>'}<button class="btn modal-close" onclick="closeModal()">닫기</button>`;
  showModal();document.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>useItem(b.dataset.use,false));
}
function openEncounterItems(){
  if(battleBusy||state.pending)return;
  const sc=SCENES[state.sceneId],enemy=getEnemy(sc);if(!enemy)return;
  const rows=Object.entries(inventoryCounts()).filter(([nm])=>{const it=ITEMS[nm];return it&&(it.encounter||it.heal||it.persistent);});
  const m=encMod();
  $('modal').innerHTML=`<h2>조우 아이템</h2><div class="modal-sub">${escapeHtml(enemy.name)}과 마주친 상태 · 아이템 사용 후 승률과 판정이 즉시 바뀐다. 공격을 시작하면 더 이상 사용할 수 없다.</div>${rows.length?rows.map(([nm,count])=>{const it=ITEMS[nm];return `<div class="bag-row encounter-usable"><div class="item-copy"><b>${nm} × ${count}<span class="item-kind">${it.kind}</span></b><small>${it.desc}</small></div><button class="shop-btn" data-enc-use="${escapeAttr(nm)}">사용</button></div>`}).join(''):'<p class="modal-sub">이 조우에서 사용할 물품이 없다.</p>'}<div class="modal-sub">현재 보정 · 공격 ${m.attackPct>=0?'+':''}${m.attackPct}% / 임시 공격 ${m.attackStat||0} · 처세 ${m.socialPct>=0?'+':''}${m.socialPct}% / 임시 처세 ${m.socialStat||0} · 속도 +${m.speed||0} · 적 공격 ${m.enemyAtk>=0?'+':''}${m.enemyAtk||0} · 역전 ${m.comebackMin||6}~6</div><button class="btn modal-close" onclick="closeModal()">닫기</button>`;
  showModal();document.querySelectorAll('[data-enc-use]').forEach(b=>b.onclick=()=>useItem(b.dataset.encUse,true));
}
function itemDesc(nm){return ITEMS[nm]?.desc||'특수 물품';}
function useItem(nm,fromEncounter=false){
  const i=state.inventory.indexOf(nm);if(i<0)return;
  const it=ITEMS[nm];if(!it)return;
  if(it.encounter&&!fromEncounter){toast('이 물품은 조우 중에 사용해야 한다.','bad');return;}
  if(fromEncounter&&!getEnemy(SCENES[state.sceneId]))return;
  if(it.heal)heal(it.heal); if(it.persistent&&it.apply)it.apply(); if(it.encounter&&it.apply)it.apply(encMod());
  state.inventory.splice(i,1);state.stats.itemsUsed=(state.stats.itemsUsed||0)+1;encMod().usedItems.push(nm);
  floatText(`${nm} 사용`);save();render();
  if(fromEncounter)openEncounterItems();else openBag();
}
function showModal(){$('modalOverlay').classList.remove('hidden');}
function closeModal(){$('modalOverlay').classList.add('hidden');}

// ---------- Save / ranking ----------
function normalizeLoadedState(data){
  const base=freshState();
  const merged={...base,...data};
  merged.flags={...base.flags,...(data.flags||{})};
  merged.relation={...base.relation,...(data.relation||{})};
  merged.socialUsed={...(data.socialUsed||{})};
  merged.runUsed={...(data.runUsed||{})};
  // v0.9.0의 runUsed는 장면 단위라 재방문 시 잘못 잠길 수 있었다. 구버전 세이브는 새 조우로 취급한다.
  merged.escapeAttempted=Number(data.version||0)>=91 ? !!data.escapeAttempted : false;
  merged.escapeSerial=Number(data.escapeSerial||0);
  merged.talkCount={...(data.talkCount||{})};
  merged.encounterMods={...(data.encounterMods||{})};
  merged.entered={...(data.entered||{})};
  merged.inventory=Array.isArray(data.inventory)?data.inventory:[];
  merged.stats={...base.stats,...(data.stats||{})};
  merged.version=91;
  return merged;
}
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));updateMenuSaveInfo();}
function saveAndExit(){
  if(battleBusy){toast('전투 중에는 저장 후 나갈 수 없다.','bad');return;}
  save();
  closeModal();
  showScreen('menuScreen');
  updateMenuSaveInfo();
}
function continueGame(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return alert('저장된 게임이 없다.');state=normalizeLoadedState(JSON.parse(raw));if(!state.p)throw new Error();showScreen(state.ended?'endScreen':'gameScreen');if(state.ended)finishLoaded();else enter(state.sceneId);}catch{alert('저장 데이터를 불러오지 못했다.');}}
function updateMenuSaveInfo(){
  const el=$('continueInfo'); if(!el)return;
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw){el.textContent='저장된 여정 없음';return;}
    const d=normalizeLoadedState(JSON.parse(raw));
    if(!d.p){el.textContent='저장된 여정 없음';return;}
    const sc=SCENES[d.sceneId];
    const where=sc?.location||'알 수 없는 장소';
    el.textContent=`${d.p.className} · ${where} · HP ${d.p.hp}/${d.p.maxHp} · ◆ ${d.p.gold}`;
  }catch{el.textContent='저장 데이터 확인 필요';}
}
function finishLoaded(){state.ended=false;finish(state.stats.ending||'BAD END');}
function getPlayerId(){let id=localStorage.getItem(PLAYER_ID_KEY);if(!id){id=`p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;localStorage.setItem(PLAYER_ID_KEY,id);}return id;}
async function submitScore(){const nickname=$('nickname').value.trim()||'익명';const payload={playerId:getPlayerId(),nickname,className:state.p.className,stats:{...state.stats,goldHeld:state.p.gold}};try{const r=await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error();const d=await r.json();alert(d.isBest?`최고 기록 갱신! ${d.score.toLocaleString()}점 · ${d.rank}위`:`기존 최고 기록이 더 높습니다. 이번 점수 ${d.score.toLocaleString()}점`);}catch{const q=JSON.parse(localStorage.getItem(PENDING_KEY)||'[]');q.push(payload);localStorage.setItem(PENDING_KEY,JSON.stringify(q));alert('서버에 연결되지 않아 기록을 기기에 보관했습니다. 다음 접속 때 다시 전송합니다.');}}
async function showLeaderboard(){
  $('modal').innerHTML='<h2>노말 모드 기록</h2><div class="modal-sub">서버 최고 기록을 불러오는 중...</div>';showModal();
  try{const r=await fetch('/api/leaderboard');const rows=await r.json();$('modal').innerHTML=`<h2>노말 모드 기록</h2><div class="modal-sub">플레이어별 최고 점수만 저장됩니다.</div>${rows.length?rows.map((x,i)=>`<div class="rank-row"><div class="rank-num">${i+1}</div><div><b>${escapeHtml(x.nickname)}</b><div class="rank-meta">${escapeHtml(x.className)} · ${escapeHtml(x.ending)}</div></div><div class="rank-score">${Number(x.score).toLocaleString()}</div></div>`).join(''):'<p class="modal-sub">아직 기록이 없다.</p>'}<button class="btn modal-close" onclick="closeModal()">닫기</button>`;}catch{$('modal').innerHTML='<h2>노말 모드 기록</h2><p class="modal-sub">서버에 연결하지 못했다.</p><button class="btn modal-close" onclick="closeModal()">닫기</button>';}
}

async function updateStorageStatus(){
  const el=$('storageInfo'); if(!el)return;
  try{const r=await fetch('/api/storage');const d=await r.json();if(d.permanent){el.textContent='● 영구 랭킹 DB 연결됨';el.className='storage-info cloud';}else{el.textContent='○ 로컬 랭킹 · 공개 전 DB 연결 필요';el.className='storage-info local';}}
  catch{el.textContent='○ 랭킹 서버 상태 확인 불가';el.className='storage-info local';}
}

async function flushPending(){let q=JSON.parse(localStorage.getItem(PENDING_KEY)||'[]');if(!q.length)return;const remain=[];for(const payload of q){try{const r=await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)remain.push(payload);}catch{remain.push(payload);}}localStorage.setItem(PENDING_KEY,JSON.stringify(remain));}

// ---------- FX / helpers ----------
function toast(msg,type=''){state.lastToast=msg;render();if(type)fx(type);}
function fx(type){const f=$('flash');f.className=`flash ${type}`;setTimeout(()=>f.className='flash',450);}
function shake(){const el=$('sceneCard');el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake');}
function floatText(t){const d=document.createElement('div');d.className='float-text';d.textContent=t;$('floatLayer').appendChild(d);setTimeout(()=>d.remove(),950);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function escapeHtml(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function escapeAttr(v){return escapeHtml(v);}

// ---------- Events ----------
document.addEventListener('click',e=>{
  const act=e.target.closest('[data-action]')?.dataset.action;
  if(act==='new-game'){renderClasses();showScreen('classScreen');}
  if(act==='continue')continueGame();
  if(act==='leaderboard')showLeaderboard();
  if(act==='back-menu'){closeModal();showScreen('menuScreen');updateMenuSaveInfo();}
  if(act==='bag')openBag();
  if(act==='encounter-items')openEncounterItems();
  if(act==='save-exit')saveAndExit();
  if(act==='submit-score')submitScore();
  if(act==='continue-result')continueOutcome();
  const ga=e.target.closest('[data-game-action]')?.dataset.gameAction;
  if(ga)gameAction(ga);
});
window.selectClass=selectClass;window.openShop=openShop;window.openBag=openBag;window.openEncounterItems=openEncounterItems;window.closeModal=closeModal;window.continueOutcome=continueOutcome;window.saveAndExit=saveAndExit;

updateMenuSaveInfo();
updateStorageStatus();
flushPending();
