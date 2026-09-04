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
    version: 8,
    classId: null,
    p: null,
    sceneId: 'intro',
    flags: {},
    relation: { kingdom:0, bandits:0, merchants:0 },
    inventory: [],
    socialUsed: {},
    talkCount: {},
    entered: {},
    lastToast: '',
    pending: null,
    ended: false,
    stats: {
      progress:0, goldEarned:0, goldSpent:0, kills:0, eliteKills:0, riskyWins:0,
      talkSolved:0, socialSuccess:0, socialFail:0, runSuccess:0, secrets:0,
      survivors:0, growths:0, ending:'', maxAttackChanceBeaten:100
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
    runSuccess() { resolve('run', 'roadsideAftermath', '당신은 이 일과 아무 상관도 없는 사람처럼 골목을 빠져나왔다.'); }
  }),

  gangsterAngry: scene('gangsterAngry', {
    chapter:'CHAPTER 1', location:'빈민가 · 뒷골목', art:'gangster', enemy:'gangster',
    text:`“말장난은 그만하지.”\n\n깡패가 한 걸음 다가온다.\n이미 한 번 속이려 든 탓에 분위기는 더 나빠졌다.`,
    socialDisabled:true,
    talk() { toast('“훔친 돈부터 내놔. 아니면 비켜.”'); },
    attackWin(){ state.flags.gangsterKilled=true; gainGold(20); resolve('attack','roadsideAftermath','결국 주먹과 칼로 끝났다.'); },
    runSuccess(){ resolve('run','roadsideAftermath','더 악화되기 전에 골목을 빠져나왔다.'); }
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
    runSuccess(){ resolve('run','forestMerchant','성벽을 등지고 숲길 쪽으로 방향을 틀었다.'); }
  }),

  gateSuspicious: scene('gateSuspicious', {
    chapter:'CHAPTER 3A', location:'왕국 · 동문', art:'gate', enemy:'gateGuard', socialDisabled:true,
    text:`“신분도 애매하고 말도 수상하군.”\n\n경비병이 손을 내민다.\n“8골드. 내고 들어가든가, 돌아가.”`,
    choices:() => state.p.gold >= 8 ? [c('통행세 8골드를 낸다','골드를 잃지만 싸움은 피한다.',()=>{spendGold(8);state.relation.kingdom+=1;resolve('talk','cityEntry','경비병이 길을 비켜준다.');})] : [],
    talk(){ toast('“8골드. 더 할 말 없다.”'); },
    attackWin(){ state.flags.guardKilled=true;state.flags.kingdomHostile=true;state.relation.kingdom-=4;gainGold(30);resolve('attack','cityAlarm','경비병을 쓰러뜨리고 강제로 진입했다.'); },
    runSuccess(){ resolve('run','forestMerchant','통행세 대신 숲길을 택했다.'); }
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
    runSuccess(){ resolve('run','citySquare','시민과 엮이지 않고 자리를 떴다.'); }
  }),

  citizenSuspicious: scene('citizenSuspicious', {
    chapter:'CHAPTER 4A', location:'왕국 · 시장 골목', art:'city', enemy:'citizen', socialDisabled:true,
    text:`“경비! 여기 수상한 사람이—”\n\n시민이 뒤로 물러난다. 처세는 이미 실패했다.`,
    talk(){ state.flags.citizenEscaped=true; queueOutcome('말을 붙잡는 사이 시민이 경비 초소로 달려갔다.\n\n당신을 향한 경비의 발소리가 가까워진다.', 'guardResponse'); },
    attackWin(){ state.flags.citizenKilled=true;state.flags.kingdomHostile=true;state.relation.kingdom-=6;resolve('attack','guardResponse','목격자는 사라졌지만 이미 늦었다. 경비가 달려온다.'); },
    runSuccess(){ resolve('run','citySquare','사람들 틈으로 사라졌다. 아직 왕국 전체가 적대하진 않는다.'); }
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
    runSuccess(){ state.flags.kingdomHostile=true; resolve('run','forestMerchant','왕국에서 달아나 숲으로 몸을 숨겼다.'); }
  }),

  guardFurious: scene('guardFurious', {
    chapter:'HOSTILE ROUTE', location:'왕국 · 중앙가', art:'alarm', enemy:'alarmGuard', socialDisabled:true,
    text:`“입은 그만 놀려.”\n경비가 검을 뽑아 당신의 퇴로를 압박한다.`,
    talk(){ toast('대답 대신 검끝이 움직였다.'); },
    attackWin(){ state.flags.guardResponseKilled=true;state.flags.kingdomHostile=true;gainGold(36);resolve('attack','captainEnraged','경비가 쓰러지자 더 무거운 발소리가 들려온다.'); },
    runSuccess(){ resolve('run','forestMerchant','도망쳐 숲으로 숨어들었다.'); }
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
    runSuccess(){ resolve('run','forestMerchant','친위대장의 추격을 떨치고 왕국 밖으로 빠져나왔다.'); }
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
    runSuccess(){ resolve('run','forestMerchant','전설과 싸우는 대신 왕국을 떠났다.'); }
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
    runSuccess(){ resolve('run','citySquare','정찰 임무를 포기하고 왕국으로 돌아왔다.'); }
  }),

  banditScoutCornered: scene('banditScoutCornered', {
    chapter:'ROYAL ROUTE', location:'왕국 외곽 · 목책길', art:'bandits', enemy:'banditScout', socialDisabled:true,
    text:`도적이 손가락을 입에 가져간다.\n지원 신호가 울리기 전에 결정을 내려야 한다.`,
    talk(){ toast('대화할 시간은 끝났다.'); },
    attackWin(){gainGold(24);resolve('attack','royalSupply','지원 신호가 울리기 전에 정찰병을 쓰러뜨렸다.');},
    runSuccess(){resolve('run','citySquare','임무를 포기하고 돌아갔다.');}
  }),

  royalSupply: scene('royalSupply', {
    chapter:'ROYAL ROUTE', location:'친위대 임시 보급소', art:'camp',
    text:`도적단 본거지로 들어가기 전 마지막 보급소다.\n친위대원들은 당신을 아직 완전히 믿지는 않지만, 필요한 물자는 건넨다.`,
    onFirstEnter(){ addItem('고급 붕대',1); heal(2,false); toast('보급 · 고급 붕대 +1 / 체력 일부 회복','good'); },
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
    runSuccess(){resolve('run','banditTruce','세리아와의 결판을 피했다. 전쟁은 아직 끝나지 않았다.');}
  }),

  banditBossAngry: scene('banditBossAngry', {
    chapter:'BOSS', location:'도적단 본거지', art:'boss', enemy:'banditBoss', socialDisabled:true,
    text:`“말로 시간을 벌 생각은 버려.”\n세리아가 칼을 뽑는다.`,
    talk(){toast('세리아는 더 이상 대답하지 않는다.');},
    attackWin(){state.flags.banditBossKilled=true;gainGold(110);resolve('attack',null,'두목을 쓰러뜨렸다.\n\n남은 도적들은 무기를 버리거나 숲으로 흩어진다.', '명예 회복');},
    runSuccess(){resolve('run','banditTruce','싸움을 피하고 숲 깊은 곳으로 달아났다.');}
  }),

  banditTruce: scene('banditTruce', {
    chapter:'TRUCE', location:'숲과 왕국 사이', art:'crossroad',
    text:`도적단과의 싸움은 피했지만 왕국과의 갈등은 남았다.\n양쪽을 모두 설득할 수 있다면, 피를 흘리지 않고 끝낼 가능성도 있다.`,
    choices:() => [
      c('왕국으로 돌아가 중재를 시도한다','왕국과 도적단 모두의 신뢰가 필요하다.',()=>{
        if(canFriendEnding()) finish('모두와 친구');
        else go('kingdomGate');
      }),
      c('도적단과 왕국을 공격한다','반란 루트로 전환.',()=>{state.flags.rebel=true;go('rebelMarch');})
    ]
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
    runSuccess(){resolve('run','forestMerchant','반란을 버리고 숲으로 달아났다.');}
  }),

  kingEnraged: scene('kingEnraged', {
    chapter:'REBELLION · FINAL', location:'왕궁 앞', art:'kingrage', enemy:'king', socialPenalty:25,
    text:`왕 에드란이 피 묻은 망토를 끌며 계단을 내려온다.\n\n“내 병사와 백성을 죽이고도 말이 필요하다고 생각하느냐?”\n\n분노한 왕에게 남은 것은 결판뿐이다.`,
    talk(){state.flags.kingBuff=(state.flags.kingBuff||0)+2;toast('왕의 분노만 키웠다. 공격력 +2','bad');render();save();},
    socialSuccess(){state.flags.kingShaken=true;toast('처세 성공 · 왕의 판단이 흔들렸다. 공격력 -2','good');render();save();},
    socialFail(){state.flags.kingBuff=(state.flags.kingBuff||0)+3;toast('처세 실패 · 왕의 공격력 +3','bad');render();save();},
    enemyMod(e){e.atk+=(state.flags.kingBuff||0);if(state.flags.kingShaken)e.atk=Math.max(1,e.atk-2);return e;},
    attackWin(){gainGold(180);resolve('attack',null,'왕이 쓰러졌다.\n\n성문 위의 깃발이 천천히 내려가고, 반란군의 함성이 왕궁을 덮는다.', '반란');},
    runSuccess(){resolve('run','forestMerchant','결판 직전 전장을 이탈했다.');}
  }),

  forestMerchant: scene('forestMerchant', {
    chapter:'CHAPTER 3B', location:'숲 · 초입', art:'merchant', enemy:'merchantDummy',
    text:`짐수레를 끌던 상인이 당신을 발견한다.\n\n“이 시간에 혼자 숲으로?”\n“물건이 필요하면 돈부터 보여줘.”\n\n그는 경계하지만 아직 적대적이지 않다.`,
    enemyOverride:{name:'떠돌이 상인 로벤',hp:5,atk:3,social:10,speed:5,gold:45,rank:'비전투원'},
    talk(){ state.flags.merchantAlive=true;state.relation.merchants+=2;state.stats.talkSolved++;queueOutcome('로벤 · “이 앞엔 도적단 간부들이 돌아다녀. 특히 둘은 건드리지 마.”\n\n그는 숲길의 지름길과 위험한 구역까지 알려준다.', 'forestRoad'); },
    socialSuccess(){state.flags.merchantAlive=true;state.relation.merchants+=1;addItem('상인의 물약',1);resolve('social','forestRoad','상인은 당신의 말솜씨에 넘어가 비싼 물약을 하나 내줬다.');},
    socialFail(){state.flags.merchantAlive=true;state.relation.merchants-=1;go('merchantOffended','처세 실패 · 상인이 가격을 두 배로 부르며 등을 돌린다.');},
    attackWin(){state.flags.merchantKilled=true;state.relation.merchants-=6;gainGold(45);addItem('상인의 물약',1);resolve('attack','forestRoad','상인의 짐수레를 털었다. 이 일은 상인협회에 알려질 것이다.');},
    runSuccess(){state.flags.merchantAlive=true;resolve('run','forestRoad','상인을 지나쳐 숲 안쪽으로 들어갔다.');}
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
        if(!state.flags.forestCache){state.flags.forestCache=true;state.stats.secrets++;addItem('고급 붕대',1);queueOutcome('낙엽 아래 방수포를 발견했다.\n\n고급 붕대 +1. 누군가 급히 버리고 간 보급품인 듯하다.',null);}
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
    runSuccess(){state.flags.merchantAbandoned=true;resolve('run','officer2','로벤을 남겨두고 도적단의 시야에서 빠져나왔다.');}
  }),

  officer1Angry: scene('officer1Angry', {
    chapter:'FOREST ROUTE', location:'숲 · 버려진 야영지', art:'capture', enemy:'banditOfficer1', socialDisabled:true,
    text:`로벤이 신음한다.\n“이제 거래는 끝났어.”`,
    talk(){toast('간부는 더 이상 협상하지 않는다.');},
    attackWin(){state.flags.officer1Killed=true;state.relation.bandits-=3;state.relation.merchants+=2;gainGold(48);resolve('attack','officer2','간부를 쓰러뜨리고 상인을 풀어줬다.');},
    runSuccess(){state.flags.merchantAbandoned=true;resolve('run','officer2','상인을 두고 도망쳤다.');}
  }),

  officer2: scene('officer2', {
    chapter:'FOREST ROUTE', location:'숲 · 돌다리', art:'officer', enemy:'banditOfficer2',
    text:`돌다리 위에서 붉은 모자를 쓴 여자가 손을 들어 길을 막는다.\n\n“갈고리를 만났지? 살아서 여기 왔다는 건 어느 쪽이든 재미있네.”`,
    talk(){state.flags.officer2Talked=true;state.relation.bandits++;toast('그녀는 두목 세리아가 왕국과 전쟁을 준비 중이라고 알려준다.','good');render();save();},
    choices(){return state.flags.officer2Talked?[c('도적단과 협력하겠다고 한다','세리아를 만나기 위한 길.',()=>{state.flags.officer2Allied=true;state.relation.bandits+=2;resolve('talk','banditCampLife','붉은 모자가 길을 비켜준다.');})]:[];},
    socialSuccess(){state.flags.officer2Allied=true;state.relation.bandits+=2;resolve('social','banditCampLife','당신은 적이 아니라는 인상을 심는 데 성공했다.');},
    socialFail(){state.flags.officer2Angry=true;go('officer2Angry','처세 실패 · 붉은 모자가 웃으며 칼을 뽑는다.');},
    attackWin(){state.flags.officer2Killed=true;state.relation.bandits-=3;gainGold(52);resolve('attack','banditCampLife','두 번째 간부도 쓰러졌다. 세리아의 본거지가 가까워진다.');},
    runSuccess(){resolve('run','banditCampLife','돌다리를 돌아 우회했다.');}
  }),

  officer2Angry: scene('officer2Angry', {
    chapter:'FOREST ROUTE', location:'숲 · 돌다리', art:'officer', enemy:'banditOfficer2', socialDisabled:true,
    text:`“그럴듯했는데 아쉽네.”\n붉은 모자가 칼날을 낮게 세운다.`,
    talk(){toast('그녀는 웃기만 한다.');},
    attackWin(){state.flags.officer2Killed=true;state.relation.bandits-=3;gainGold(52);resolve('attack','banditCampLife','두 번째 간부가 쓰러졌다.');},
    runSuccess(){resolve('run','banditCampLife','돌다리를 버리고 숲을 가로질러 달아났다.');}
  }),

  guildNovice: scene('guildNovice', {
    chapter:'MERCHANT GUILD', location:'숲 · 교역로', art:'guild', enemy:'noviceKnight',
    text:`상인협회의 문장이 새겨진 작은 방패가 길을 막는다.\n초급 기사 한 명이 당신과 도적들을 번갈아 본다.\n\n“도적단과 함께 있는 이유를 설명해.”`,
    talk(){toast('기사는 도적단과 손을 끊으면 보내주겠다고 한다.');},
    socialSuccess(){state.relation.merchants++;resolve('social','forestBeforeBoss','당신은 임시 협력자일 뿐이라고 둘러댔다.');},
    socialFail(){state.relation.merchants--;go('guildNoviceAngry','처세 실패 · 기사가 협회에 신호를 보냈다.');},
    attackWin(){state.flags.noviceKilled=true;state.relation.merchants-=5;gainGold(42);resolve('attack','forestBeforeBoss','초급 기사가 쓰러졌다. 이 죽음은 나중에 대가를 요구할 것이다.');},
    runSuccess(){resolve('run','forestBeforeBoss','교역로를 벗어나 숲으로 사라졌다.');}
  }),

  guildNoviceAngry: scene('guildNoviceAngry', {
    chapter:'MERCHANT GUILD', location:'숲 · 교역로', art:'guild', enemy:'noviceKnight', socialDisabled:true,
    text:`“협회에 보고했다.”\n초급 기사가 검을 뽑는다.`,
    talk(){toast('설명할 기회는 끝났다.');},
    attackWin(){state.flags.noviceKilled=true;state.relation.merchants-=5;gainGold(42);resolve('attack','forestBeforeBoss','기사를 쓰러뜨렸다. 상인협회가 반드시 움직일 것이다.');},
    runSuccess(){resolve('run','forestBeforeBoss','기사를 피해 숲으로 달아났다.');}
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
    runSuccess(){state.flags.midKnightEscaped=true;resolve('run','banditBossForest','중급 기사의 추격을 따돌리고 본거지 안으로 뛰어들었다.');}
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
    runSuccess(){resolve('run','friendBridge','결판을 미루고 본거지를 빠져나왔다.');}
  }),

  banditBossAngryForest: scene('banditBossAngryForest', {
    chapter:'FOREST ROUTE · FINAL', location:'도적단 본거지', art:'boss', enemy:'banditBoss', socialDisabled:true,
    text:`“그만. 넌 네 입으로 네 편을 정했어.”\n세리아가 단검을 든다.`,
    talk(){toast('더 이상 대화는 통하지 않는다.');},
    attackWin(){state.flags.banditBossKilled=true;gainGold(110);resolve('attack',null,'세리아가 쓰러졌다.\n\n본거지의 소란이 잦아들고 살아남은 자들이 무기를 버린다.', '명예 회복');},
    runSuccess(){resolve('run','friendBridge','세리아와의 싸움을 피하고 왕국 방향으로 이동했다.');}
  }),

  friendBridge: scene('friendBridge', {
    chapter:'FINAL CROSSROAD', location:'왕국과 숲 사이의 오래된 다리', art:'crossroad',
    text:`숲도 왕국도 등 뒤에 있다.\n당신은 어느 한쪽을 완전히 무너뜨리지 않았다.\n\n남은 것은 서로에게 칼을 겨누는 이유를 멈추게 하는 일이다.`,
    choices:() => [
      c('왕국과 도적단의 협상을 주선한다','관계와 생존한 인물에 따라 결과가 달라진다.',()=>{
        if(canFriendEnding(true)) finish('모두와 친구');
        else go('kingdomGate');
      }),
      c('도적단에 돌아가 왕국을 공격한다','반란으로 끝을 본다.',()=>{state.flags.rebel=true;go('rebelMarch');})
    ]
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
  $('story').textContent = typeof sc.text === 'function' ? sc.text() : sc.text;

  const toastBox = $('resultToast');
  toastBox.textContent = state.lastToast || '';
  toastBox.classList.toggle('hidden', !state.lastToast);

  $('enemyPanel').classList.toggle('hidden', !enemy);
  $('actionGrid').classList.toggle('hidden', !enemy);
  if (enemy) {
    $('enemyName').textContent = enemy.name;
    $('enemyRank').textContent = enemy.rank || '';
    $('enemyStats').textContent = `체력 ${enemy.hp} · 공격 ${enemy.atk} · 처세 ${enemy.social} · 속도 ${enemy.speed}`;
    $('attackInfo').textContent = `예상 승률 ${attackChance(enemy)}% · 즉시 전투`;
    $('socialInfo').textContent = sc.socialDisabled ? '사용 불가' : state.socialUsed[state.sceneId] ? '이미 시도함' : `성공률 ${socialChance(enemy,sc)}%`;
    const rc = runChance(enemy);
    $('runInfo').textContent = rc===100?'반드시 성공':rc===0?'상대보다 빠르지 않음':`도둑 특성 · ${rc}%`;
    const socialBtn = document.querySelector('[data-game-action="social"]');
    socialBtn.classList.toggle('locked-action', !!sc.socialDisabled);
    socialBtn.classList.toggle('used', !!state.socialUsed[state.sceneId]);
    document.querySelector('[data-game-action="run"]').classList.toggle('locked-action', rc===0);
  }

  const choices = typeof sc.choices === 'function' ? sc.choices() : (sc.choices || []);
  const waiting = !!state.pending;
  $('continueBtn').classList.toggle('hidden', !waiting);
  $('choiceArea').classList.toggle('hidden', waiting);
  if (enemy) $('actionGrid').classList.toggle('hidden', waiting);
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
  return e;
}
function attackChance(enemy) {
  const mine=Math.max(1,state.p.hp*state.p.atk), theirs=Math.max(1,enemy.hp*enemy.atk);
  return clamp(Math.round(mine/(mine+theirs)*100),3,97);
}
function socialChance(enemy,sc) {
  let chance=Math.round((Math.max(0,state.p.social)/(Math.max(0,state.p.social)+Math.max(1,enemy.social)))*100);
  if(state.classId==='noble') chance+=14;
  chance-=sc.socialPenalty||0;
  if(state.flags.gangsterTruth && state.sceneId==='gangster') chance+=16;
  return clamp(chance,3,95);
}
function runChance(enemy) {
  if(state.p.speed>enemy.speed) return 100;
  if(state.classId!=='thief') return 0;
  const closeness=Math.min(1,state.p.speed/Math.max(1,enemy.speed));
  return clamp(Math.round(33+17*closeness),33,50);
}

function gameAction(type) {
  const sc=SCENES[state.sceneId], enemy=getEnemy(sc); if(!sc||!enemy||state.ended)return;
  if(type==='talk') { if(sc.talk) sc.talk(); else toast('상대는 대화를 이어갈 생각이 없어 보인다.'); return; }
  if(type==='social') {
    if(sc.socialDisabled || state.socialUsed[state.sceneId]) return;
    state.socialUsed[state.sceneId]=true;
    const chance=socialChance(enemy,sc);
    if(Math.random()*100<chance){state.stats.socialSuccess++;fx('good');floatText('처세 성공');if(sc.socialSuccess)sc.socialSuccess();else resolve('social',null,'처세에 성공했다.');}
    else {state.stats.socialFail++;fx('bad');floatText('처세 실패');if(sc.socialFail)sc.socialFail();else {toast('처세에 실패했다. 같은 방법은 다시 통하지 않는다.','bad');render();save();}}
    return;
  }
  if(type==='run') {
    const chance=runChance(enemy); if(chance<=0)return;
    if(chance===100 || Math.random()*100<chance){state.stats.runSuccess++;fx('good');floatText('도주 성공');if(sc.runSuccess)sc.runSuccess();else resolve('run',null,'도망쳤다.');}
    else {fx('hit');floatText('도주 실패');damagePlayer(Math.max(1,Math.floor(enemy.atk/3)),true);if(state.p.hp>0){toast('도망치다 붙잡혔다. 체력을 잃었다.','bad');render();save();}}
    return;
  }
  if(type==='attack') {
    const chance=attackChance(enemy); fx('hit'); shake();
    if(Math.random()*100<chance){
      if(chance<=35)state.stats.riskyWins++;
      const dmg=Math.min(Math.max(0,Math.floor(enemy.atk*(0.08+Math.random()*0.18))),Math.max(0,state.p.hp-1));
      if(dmg>0){state.p.hp-=dmg;floatText(`HP -${dmg}`);}
      state.stats.kills++; if(enemy.elite)state.stats.eliteKills++;
      if(sc.attackWin)sc.attackWin(); else resolve('attack',null,'전투에서 승리했다.');
    } else die(`${enemy.name}과의 전투에서 패배했다.`);
  }
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
function go(id, msg='') { if(!SCENES[id])return; state.pending=null; state.sceneId=id; state.lastToast=msg; state.stats.progress++; save(); enter(id); }
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
  $('endStats').innerHTML=`${name==='BAD END' && state.flags.deathReason?`<b>사망 원인</b> · ${escapeHtml(state.flags.deathReason)}<br><br>`:''}진행도 <b>${state.stats.progress}</b><br>처치 <b>${state.stats.kills}</b> · 강적 <b>${state.stats.eliteKills}</b><br>대화 해결 <b>${state.stats.talkSolved}</b> · 처세 성공 <b>${state.stats.socialSuccess}</b> · 실패 <b>${state.stats.socialFail}</b><br>도망 성공 <b>${state.stats.runSuccess}</b> · 비밀 발견 <b>${state.stats.secrets}</b><br>성장 횟수 <b>${state.stats.growths||0}</b><br>획득 골드 <b>${state.stats.goldEarned}</b> · 남은 골드 <b>${state.p.gold}</b>`;
  fx(name==='BAD END'?'bad':'good');showScreen('endScreen');
}
function die(reason){state.p.hp=0;state.flags.deathReason=reason;state.lastToast=reason;finish('BAD END');}
function playStyle(){
  const s=state.stats;
  const pairs=[['전투광',s.kills*3+s.riskyWins*2],['협상가',s.socialSuccess*3+s.talkSolved],['생존가',s.runSuccess*4],['탐색가',s.secrets*5+s.talkSolved],['파괴자',s.eliteKills*5+s.kills]];
  pairs.sort((a,b)=>b[1]-a[1]);return pairs[0][1]===0?'방랑자':pairs[0][0];
}
function clientScore(){const s=state.stats,b=ENDINGS[s.ending]?.bonus||0;return Math.max(0,Math.floor(s.progress*115+s.goldEarned*3+state.p.gold*1.2+s.kills*170+s.eliteKills*950+s.riskyWins*650+s.talkSolved*170+s.socialSuccess*185+s.runSuccess*85+s.secrets*500+(s.growths||0)*140+s.survivors*220-s.socialFail*25+b));}

// ---------- Inventory / shop ----------
const SHOP = [
  {name:'붕대',cost:8,desc:'사용 시 체력 3 회복',buy(){addItem('붕대');}},
  {name:'고급 붕대',cost:16,desc:'사용 시 체력 5 회복',buy(){addItem('고급 붕대');}},
  {name:'든든한 식사',cost:20,desc:'최대 체력 +1, 체력 완전 회복',buy(){state.p.maxHp++;state.p.hp=state.p.maxHp;floatText('최대 HP +1');}},
  {name:'숫돌',cost:26,desc:'공격력 영구 +1',buy(){state.p.atk++;floatText('공격력 +1');}}
];
function openShop(){
  $('modal').innerHTML=`<h2>상점</h2><div class="modal-sub">보유 골드 ◆ ${state.p.gold}</div>${SHOP.map((x,i)=>`<div class="shop-row"><div class="item-copy"><b>${x.name}</b><small>${x.desc}</small></div><button class="shop-btn" data-buy="${i}">◆ ${x.cost}</button></div>`).join('')}<button class="btn modal-close" onclick="closeModal()">나간다</button>`;
  showModal();document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const x=SHOP[Number(b.dataset.buy)];if(!spendGold(x.cost)){toast('골드가 부족하다.','bad');return;}x.buy();save();openShop();render();});
}
function openBag(){
  const counts={};for(const x of state.inventory)counts[x]=(counts[x]||0)+1;
  const rows=Object.entries(counts);
  $('modal').innerHTML=`<h2>가방</h2><div class="modal-sub">회복품은 전투 전후 언제든 사용할 수 있다.</div>${rows.length?rows.map(([nm,nmCount])=>`<div class="bag-row"><div class="item-copy"><b>${nm} × ${nmCount}</b><small>${itemDesc(nm)}</small></div><button class="shop-btn" data-use="${escapeAttr(nm)}">사용</button></div>`).join(''):'<p class="modal-sub">아무것도 없다.</p>'}<button class="btn modal-close" onclick="closeModal()">닫기</button>`;
  showModal();document.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>useItem(b.dataset.use));
}
function itemDesc(nm){return nm==='붕대'?'체력 3 회복':nm==='고급 붕대'?'체력 5 회복':nm==='상인의 물약'?'체력 완전 회복':nm==='철제 부적'?'사용 시 최대 체력 +2':'특수 물품';}
function useItem(nm){const i=state.inventory.indexOf(nm);if(i<0)return;if(nm==='붕대')heal(3);else if(nm==='고급 붕대')heal(5);else if(nm==='상인의 물약')heal(999);else if(nm==='철제 부적'){state.p.maxHp+=2;state.p.hp+=2;floatText('최대 HP +2');}state.inventory.splice(i,1);save();render();openBag();}
function showModal(){$('modalOverlay').classList.remove('hidden');}
function closeModal(){$('modalOverlay').classList.add('hidden');}

// ---------- Save / ranking ----------
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));}
function continueGame(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return alert('저장된 게임이 없다.');state=JSON.parse(raw);if(!state.p)throw new Error();showScreen(state.ended?'endScreen':'gameScreen');if(state.ended)finishLoaded();else enter(state.sceneId);}catch{alert('저장 데이터를 불러오지 못했다.');}}
function finishLoaded(){state.ended=false;finish(state.stats.ending||'BAD END');}
function getPlayerId(){let id=localStorage.getItem(PLAYER_ID_KEY);if(!id){id=`p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;localStorage.setItem(PLAYER_ID_KEY,id);}return id;}
async function submitScore(){const nickname=$('nickname').value.trim()||'익명';const payload={playerId:getPlayerId(),nickname,className:state.p.className,stats:{...state.stats,goldHeld:state.p.gold}};try{const r=await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error();const d=await r.json();alert(d.isBest?`최고 기록 갱신! ${d.score.toLocaleString()}점 · ${d.rank}위`:`기존 최고 기록이 더 높습니다. 이번 점수 ${d.score.toLocaleString()}점`);}catch{const q=JSON.parse(localStorage.getItem(PENDING_KEY)||'[]');q.push(payload);localStorage.setItem(PENDING_KEY,JSON.stringify(q));alert('서버에 연결되지 않아 기록을 기기에 보관했습니다. 다음 접속 때 다시 전송합니다.');}}
async function showLeaderboard(){
  $('modal').innerHTML='<h2>노말 모드 기록</h2><div class="modal-sub">서버 최고 기록을 불러오는 중...</div>';showModal();
  try{const r=await fetch('/api/leaderboard');const rows=await r.json();$('modal').innerHTML=`<h2>노말 모드 기록</h2><div class="modal-sub">플레이어별 최고 점수만 저장됩니다.</div>${rows.length?rows.map((x,i)=>`<div class="rank-row"><div class="rank-num">${i+1}</div><div><b>${escapeHtml(x.nickname)}</b><div class="rank-meta">${escapeHtml(x.className)} · ${escapeHtml(x.ending)}</div></div><div class="rank-score">${Number(x.score).toLocaleString()}</div></div>`).join(''):'<p class="modal-sub">아직 기록이 없다.</p>'}<button class="btn modal-close" onclick="closeModal()">닫기</button>`;}catch{$('modal').innerHTML='<h2>노말 모드 기록</h2><p class="modal-sub">서버에 연결하지 못했다.</p><button class="btn modal-close" onclick="closeModal()">닫기</button>';}
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
  if(act==='back-menu'){closeModal();showScreen('menuScreen');}
  if(act==='bag')openBag();
  if(act==='submit-score')submitScore();
  if(act==='continue-result')continueOutcome();
  const ga=e.target.closest('[data-game-action]')?.dataset.gameAction;
  if(ga)gameAction(ga);
});
window.selectClass=selectClass;window.openShop=openShop;window.openBag=openBag;window.closeModal=closeModal;window.continueOutcome=continueOutcome;

flushPending();
