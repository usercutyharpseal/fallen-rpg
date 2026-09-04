'use strict';

const SAVE_KEY = 'fallen_normal_v08';
const PLAYER_ID_KEY = 'fallen_player_id';
const PENDING_KEY = 'fallen_pending_scores';
const META_KEY = 'fallen_meta_v1';
const GAME_VERSION = 101;

const CLASS_UNLOCK_CLEAR_REQUIREMENTS = { spellsword:1, necromancer:3, dictator:5 };
function loadMeta(){
  try{
    const raw=JSON.parse(localStorage.getItem(META_KEY)||'{}');
    return {normalClears:Number(raw.normalClears||0), endings:Array.isArray(raw.endings)?raw.endings:[], awardedRuns:Array.isArray(raw.awardedRuns)?raw.awardedRuns:[]};
  }catch{return {normalClears:0,endings:[],awardedRuns:[]};}
}
function saveMeta(meta){localStorage.setItem(META_KEY,JSON.stringify(meta));}
function isClassUnlocked(id){
  if(!CLASS_UNLOCK_CLEAR_REQUIREMENTS[id])return true;
  return loadMeta().normalClears>=CLASS_UNLOCK_CLEAR_REQUIREMENTS[id];
}
function classUnlockText(id){
  const need=CLASS_UNLOCK_CLEAR_REQUIREMENTS[id];
  if(!need)return '';
  const n=loadMeta().normalClears;
  return n>=need?'해금됨':`노말 엔딩 ${need}회 · ${Math.min(n,need)}/${need}`;
}

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
    name: '도둑', hp: 6, atk: 6, social: 3, speed: 10, unlocked: true,
    passive: '잡을 수 있다면 잡아봐',
    desc: '상대보다 느려도 33~50% 확률로 도망칠 수 있다.'
  },
  merchant: {
    name: '상인', hp: 6, atk: 4, social: 4, speed: 4, unlocked: true,
    passive: '장사꾼의 재능',
    desc: '새로운 조우마다 최대 체력만큼 골드를 얻고, 상점 가격이 25% 저렴해진다.'
  },
  spellsword: {
    name: '마검사', hp: 6, atk: 13, social: 0, speed: 8, unlocked: false,
    passive: '파괴만을 위한 생명', desc: '처세를 사용할 수 없다. 적을 쓰러뜨리면 최대 체력의 20%를 회복한다.'
  },
  necromancer: {
    name: '망령사', hp: 4, atk: 4, social: 4, speed: 4, unlocked: false,
    passive: '죽은 자들이여 일어나라', desc: '적을 쓰러뜨리면 시체를 얻는다. 조우에서 시체 하나를 써 망령을 부를 수 있다.'
  },
  dictator: {
    name: '독재자', hp: 2, atk: 14, social: 14, speed: 2, unlocked: false,
    passive: '끝없는 격차', desc: '처치와 처세 성공으로 독재가 쌓인다. 10이 될 때마다 직전 방식에 맞는 능력치가 크게 오른다.'
  }
};

const ENEMIES = {
  gangster: { name:'거리의 깡패', hp:7, atk:5, social:5, speed:5, gold:20, rank:'보통' },
  gateGuard: { name:'왕국 경비병', hp:9, atk:7, social:7, speed:6, gold:30, rank:'보통' },
  citizen: { name:'왕국 시민', hp:3, atk:1, social:6, speed:4, gold:12, rank:'약함' },
  alarmGuard: { name:'출동한 경비병', hp:11, atk:9, social:11, speed:7, gold:36, rank:'강함' },
  captain: { name:'친위대장 레오른', hp:18, atk:14, social:18, speed:9, gold:80, rank:'매우 강함', elite:true },
  eliteVark: { name:'엘리트 기사 바르크', hp:15, atk:12, social:12, speed:8, gold:62, rank:'엘리트 기사', elite:true },
  eliteIsel: { name:'엘리트 기사 이셀', hp:16, atk:13, social:16, speed:9, gold:68, rank:'엘리트 기사', elite:true },
  oldGuard: { name:'늙은 노인', hp:34, atk:24, social:28, speed:9, gold:175, rank:'전설', elite:true },
  banditScout: { name:'도적단 정찰병', hp:7, atk:6, social:6, speed:8, gold:24, rank:'보통' },
  assaultBram: { name:'도적단 돌격병 브람', hp:10, atk:9, social:7, speed:9, gold:36, rank:'돌격병' },
  assaultNera: { name:'도적단 돌격병 네라', hp:11, atk:10, social:10, speed:10, gold:44, rank:'돌격병' },
  banditOfficer1: { name:'도적단 간부 · 갈고리', hp:12, atk:9, social:10, speed:8, gold:48, rank:'강함', elite:true },
  banditOfficer2: { name:'도적단 간부 · 붉은 모자', hp:13, atk:10, social:11, speed:9, gold:52, rank:'강함', elite:true },
  noviceKnight: { name:'상인협회 초급 기사', hp:10, atk:8, social:9, speed:7, gold:42, rank:'보통' },
  midKnight: { name:'상인협회 중급 기사', hp:21, atk:16, social:23, speed:9, gold:95, rank:'매우 강함', elite:true },
  banditBoss: { name:'도적단 두목 세리아', hp:19, atk:14, social:19, speed:10, gold:125, rank:'두목', elite:true },
  king: { name:'격분한 왕 에드란', hp:22, atk:17, social:25, speed:9, gold:180, rank:'왕', elite:true }
};

const ENDINGS = {
  'BAD END': { icon:'†', kind:'BAD END', bonus:0, epilogue:'당신의 여정은 여기서 끝났다.\n하지만 실패조차 하나의 기록으로 남는다.' },
  '명예 회복': { icon:'⚜', kind:'NORMAL END', bonus:5000, epilogue:'도적단의 깃발이 쓰러졌다.\n한때 쫓겨났던 당신의 이름은 다시 사람들의 입에 오르기 시작했다.' },
  '반란': { icon:'⚔', kind:'HARD END', bonus:10000, epilogue:'왕의 분노도 왕국의 성벽도 끝내 당신들을 막지 못했다.\n새로운 질서가 피와 함성 속에서 시작된다.' },
  '모두와 친구': { icon:'◇', kind:'SECRET END', bonus:25000, epilogue:'칼을 뽑지 않고도 바뀌는 것이 있었다.\n왕국과 도적단, 상인들은 불편한 평화를 받아들였다. 그리고 그 중심에 당신이 있었다.' },
  '위선적인 영웅': { icon:'⚜', kind:'SPECIAL END · 위선', bonus:12000, epilogue:'사람들은 당신을 영웅이라 불렀다.\n당신이 쓰러뜨린 약자들의 이름은 승전 연설 어디에도 없었다. 칼로 만든 문제를 말로 덮었고, 왕국은 듣고 싶은 이야기만 들었다.\n명예는 돌아왔다. 진실만 돌아오지 못했다.' },
  '피 묻은 중재자': { icon:'◇', kind:'SPECIAL END · 불완전한 평화', bonus:20000, epilogue:'왕국과 숲은 결국 같은 탁자에 앉았다.\n그러나 그 탁자를 닦아도 지워지지 않는 피가 있었다. 사람들은 당신의 중재를 받아들였지만, 살아남은 자들은 당신이 평화를 말하기 전에 무엇을 했는지 기억했다.\n평화는 이루어졌다. 결백은 아니었다.' },
  '두 개의 깃발': { icon:'⚔', kind:'SPECIAL END · 배신', bonus:18000, epilogue:'당신은 한때 왕국의 깃발 아래 섰고, 마지막에는 그것을 향해 검을 들었다.\n왕국은 당신을 배신자라 불렀고 반란군은 영웅이라 불렀다. 둘 다 틀리지 않았다.\n되찾은 것은 명예가 아니라, 어느 편에서도 완전히 지워지지 않을 이름이었다.' },
  '지배자': { icon:'♛', kind:'LEGEND END', bonus:30000, epilogue:'전설마저 쓰러졌다.\n왕좌를 지킬 자도, 당신에게 명령할 자도 더는 남지 않았다.' },
  '길을 잃은 자': { icon:'∅', kind:'BAD END · 방황', bonus:420, epilogue:'다리의 한쪽에는 왕국이, 다른 한쪽에는 숲이 있었다.\n당신은 두 곳에서 모두 물러났고 어느 쪽에도 돌아갈 이유를 남기지 못했다.\n해가 질 때까지 다리 위에 서 있었지만 누구도 당신을 부르러 오지 않았다.\n결국 길을 잃은 것은 발이 아니라, 선택이었다.' }
};


const BAD_ENDINGS = {
  gangster: {
    title:'첫 칼날', kind:'BAD END · 빈민가', art:'gangster', bonus:0,
    epilogue:'몰락한 뒤 처음 맞닥뜨린 싸움은 생각보다 짧았다.\n거지들의 변명도, 깡패의 분노도 이제 당신과는 상관없는 이야기가 되었다.\n이름을 되찾기도 전에 당신의 여정은 뒷골목의 젖은 돌바닥에서 멈췄다.'
  },
  gangsterAngry: {
    title:'말이 끝난 자리', kind:'BAD END · 빈민가', art:'gangster', bonus:0,
    epilogue:'한 번 어긋난 말은 끝내 주먹보다 무거워졌다.\n깡패는 더 이상 설명을 듣지 않았고, 당신에게도 다시 고를 시간은 오지 않았다.\n빈민가 사람들은 다음 날 그 골목을 평소처럼 지나갔다.'
  },
  kingdomGate: {
    title:'성문 밖의 이름', kind:'BAD END · 왕국', art:'gate', bonus:120,
    epilogue:'성벽은 눈앞에 있었지만 당신은 끝내 그 안으로 들어가지 못했다.\n경비병은 쓰러진 당신을 잠시 바라본 뒤 검문을 다시 시작했다.\n왕국은 당신의 귀환을 알지 못한 채 하루를 이어갔다.'
  },
  gateSuspicious: {
    title:'의심은 칼보다 빨랐다', kind:'BAD END · 왕국', art:'gate', bonus:160,
    epilogue:'거짓말 한마디가 성문의 공기를 바꿨다.\n의심을 거두지 않은 경비병은 당신에게 두 번째 기회를 주지 않았다.\n당신의 이름은 입국 명부 어디에도 남지 않았다.'
  },
  citizen: {
    title:'한 사람의 저항', kind:'BAD END · 왕국', art:'citizen', bonus:80,
    epilogue:'약해 보이는 상대를 고른 순간, 싸움은 이미 예상과 달라져 있었다.\n시장 사람들은 비명을 질렀고 곧 누군가 경비를 부르러 달려갔다.\n당신은 왕국의 중심에서 이름 대신 소란만 남겼다.'
  },
  citizenSuspicious: {
    title:'군중 속의 몰락', kind:'BAD END · 왕국', art:'city', bonus:120,
    epilogue:'주변의 시선이 하나둘 모이더니 어느 순간 도망칠 틈도 사라졌다.\n당신이 마지막으로 본 것은 물러서는 시민들과 좁아지는 원뿐이었다.\n왕국은 당신을 영웅도 악당도 아닌, 짧은 소동으로 기억했다.'
  },
  guardResponse: {
    title:'경종 아래에서', kind:'BAD END · 적대 왕국', art:'alarm', bonus:280,
    epilogue:'경종은 멈추지 않았다.\n한 명을 쓰러뜨려도 다음 창끝이 나타났고, 결국 수가 힘을 이겼다.\n당신이 만든 공포는 남았지만 그 공포의 주인은 더 이상 움직이지 않았다.'
  },
  guardFurious: {
    title:'더 들을 말은 없다', kind:'BAD END · 적대 왕국', art:'alarm', bonus:320,
    epilogue:'말로 벌 수 있는 시간은 이미 모두 써버렸다.\n분노한 경비병은 당신의 다음 문장을 기다리지 않았다.\n왕궁으로 이어지는 길은 피 한 줄기와 함께 닫혔다.'
  },
  captainEnraged: {
    title:'친위대장의 판결', kind:'BAD END · 친위대장', art:'captain', bonus:700,
    epilogue:'레오른은 당신을 쓰러뜨리고도 환호하지 않았다.\n그는 한동안 당신 뒤에 남은 시체들을 바라보다가 조용히 검을 거뒀다.\n“이걸로 끝이다.”\n당신이 왕국에 남긴 마지막 기억은 그의 차가운 판결이었다.'
  },
  oldVeteran: {
    title:'전설은 늙지 않았다', kind:'BAD END · 전설', art:'oldguard', bonus:1450,
    epilogue:'세월은 그의 머리를 희게 만들었지만 검끝까지 무디게 하지는 못했다.\n당신이 빈틈이라 믿은 순간, 아르벤의 칼은 이미 승부를 끝낸 뒤였다.\n왕국이 전설이라 부르던 이름의 뜻을 당신은 가장 비싼 방식으로 이해했다.'
  },
  eliteVark: {
    title:'감시역의 검', kind:'BAD END · 엘리트 기사', art:'captain', bonus:520,
    epilogue:'레오른이 붙인 감시역은 끝까지 임무를 버리지 않았다.\n바르크는 당신을 적으로 판단한 순간 망설이지 않았고, 도적단을 만나기도 전에 원정은 끝났다.\n왕국 기록에는 짧은 문장 하나만 남았다. 감시 대상, 제거.'
  },
  eliteIsel: {
    title:'봉쇄선의 마지막 사람', kind:'BAD END · 엘리트 기사', art:'captain', bonus:760,
    epilogue:'이셀은 왕국과 숲 사이의 선을 지키는 사람이었다.\n그녀는 당신의 과거를 들었고, 그래도 한 번은 말할 기회를 줬다.\n끝내 검을 택한 뒤에는 두 번째 기회가 없었다.'
  },
  assaultBram: {
    title:'숲의 첫 돌진', kind:'BAD END · 도적단', art:'bandits', bonus:390,
    epilogue:'브람은 겁을 주기 위해 달려든 것이 아니었다.\n도적단의 전위는 한 번 부딪쳐 상대의 의도를 읽고, 그대로 밀어붙이는 방식으로 싸웠다.\n당신은 세리아의 이름을 듣기도 전에 숲길에서 멈췄다.'
  },
  assaultNera: {
    title:'두목에게 닿지 못한 보고', kind:'BAD END · 도적단', art:'banditcamp', bonus:820,
    epilogue:'네라는 당신이 누구를 죽였고 누구를 살렸는지 이미 알고 있었다.\n그녀가 길을 막은 것은 시험이 아니라 마지막 확인이었다.\n세리아에게 올라간 보고에는 당신이 도착했다는 문장 대신, 도착하지 못했다는 결과만 적혔다.'
  },
  banditScoutRoyal: {
    title:'목책길의 매복', kind:'BAD END · 도적단', art:'bandits', bonus:260,
    epilogue:'정찰병 하나쯤이라 생각했던 판단은 틀렸다.\n숲은 그의 움직임을 숨겨주었고, 왕국의 지원은 너무 멀리 있었다.\n명예를 되찾으려던 길은 이름 없는 목책 옆에서 끝났다.'
  },
  banditScoutCornered: {
    title:'울리지 못한 신호', kind:'BAD END · 도적단', art:'bandits', bonus:320,
    epilogue:'지원 신호가 울리기 전에 끝내려 했지만, 먼저 끝난 것은 당신 쪽이었다.\n정찰병은 한참 뒤에야 손가락을 입에서 떼었다.\n숲에는 짧은 싸움의 흔적만 남았다.'
  },
  banditBossRoyal: {
    title:'명예의 값', kind:'BAD END · 세리아', art:'boss', bonus:1050,
    epilogue:'왕국은 당신에게 명예를 되찾을 기회를 주었다.\n세리아는 그 명예가 몇 명의 목숨 값인지 물었다.\n당신은 끝내 답하지 못했고, 붉은 천막 위의 깃발은 그대로 남았다.'
  },
  banditBossAngry: {
    title:'대화가 끝난 뒤', kind:'BAD END · 세리아', art:'boss', bonus:1100,
    epilogue:'세리아는 더 이상 당신의 말을 듣지 않았다.\n칼을 뽑은 뒤의 그녀는 질문도 변명도 필요로 하지 않았다.\n왕국에 돌아갈 명예도, 숲에서 고를 편도 이제 남지 않았다.'
  },
  captainRebel: {
    title:'무너진 성문 앞에서', kind:'BAD END · 반란', art:'captain', bonus:1100,
    epilogue:'성문은 부서졌지만 친위대장은 무너지지 않았다.\n레오른은 반란군의 함성 한가운데서 당신을 막아섰고, 결국 한 걸음도 비켜주지 않았다.\n뒤따르던 자들의 기세도 당신과 함께 꺾였다.'
  },
  kingEnraged: {
    title:'왕의 마지막 분노', kind:'BAD END · 왕', art:'kingrage', bonus:1550,
    epilogue:'왕관보다 먼저 보인 것은 분노한 인간의 얼굴이었다.\n에드란은 왕국이 무너지는 소리를 들으면서도 검을 놓지 않았다.\n당신이 왕좌 바로 앞까지 가져온 반란은, 마지막 몇 걸음을 남기고 멈췄다.'
  },
  forestMerchant: {
    title:'값을 잘못 매긴 자', kind:'BAD END · 숲', art:'merchant', bonus:80,
    epilogue:'로벤은 전사가 아니었다. 그러나 살아남는 법은 알고 있었다.\n쉬운 상대라 생각한 순간 당신은 상인이 숨겨둔 마지막 수를 보았다.\n숲길의 거래는 그렇게 가장 비싼 값을 치렀다.'
  },
  merchantCaptured: {
    title:'갈고리의 경고', kind:'BAD END · 도적단', art:'capture', bonus:520,
    epilogue:'갈고리는 처음부터 경고했다. 상인 하나 때문에 목숨을 걸지 말라고.\n당신은 그 말을 듣지 않았고, 로벤은 묶인 채 끝까지 그 광경을 지켜봐야 했다.\n숲의 소문에는 구조자의 이름 대신 실패한 싸움만 남았다.'
  },
  officer1Angry: {
    title:'끝난 거래', kind:'BAD END · 도적단', art:'capture', bonus:560,
    epilogue:'협상은 이미 끝났고 남은 것은 갈고리 모양의 칼뿐이었다.\n한 번 틀어진 거래는 다시 열리지 않았다.\n상인과 도적 모두 당신의 마지막 선택을 기억하게 됐다.'
  },
  officer2: {
    title:'붉은 모자의 미소', kind:'BAD END · 도적단', art:'officer', bonus:620,
    epilogue:'붉은 모자는 마지막 순간까지 웃고 있었다.\n당신이 그녀의 속도를 따라잡았다고 생각했을 때 이미 칼날은 다른 방향에서 들어왔다.\n돌다리 아래 물소리가 싸움의 끝을 삼켰다.'
  },
  officer2Angry: {
    title:'아쉽네, 정말', kind:'BAD END · 도적단', art:'officer', bonus:660,
    epilogue:'“그럴듯했는데 아쉽네.”\n그 말이 그녀가 남긴 마지막 대화였다.\n처세로 벌지 못한 틈을 칼로도 되찾지 못했고, 돌다리는 다시 조용해졌다.'
  },
  guildNovice: {
    title:'초급이라는 착각', kind:'BAD END · 상인협회', art:'guild', bonus:430,
    epilogue:'방패의 문장보다 ‘초급’이라는 말이 먼저 눈에 들어온 것이 실수였다.\n기사는 서툴렀지만 물러서지 않았고, 당신은 그 끈질김을 끝까지 견디지 못했다.\n협회에는 짧은 전투 보고서 한 장이 올라갔다.'
  },
  guildNoviceAngry: {
    title:'신호 이후', kind:'BAD END · 상인협회', art:'guild', bonus:470,
    epilogue:'이미 협회에 신호는 보내진 뒤였다.\n설명도 도망도 늦었고, 초급 기사는 자신이 해야 할 일을 끝까지 해냈다.\n당신의 이름은 이후 추격 명단에 오를 필요조차 없었다.'
  },
  midKnight: {
    title:'협회의 추격자는 멈추지 않는다', kind:'BAD END · 중급 기사', art:'midknight', bonus:1250,
    epilogue:'그는 복수를 위해 소리치지도, 당신을 모욕하지도 않았다.\n초급 기사의 죽음을 확인하듯 차분하게 검을 휘둘렀고, 한 번 읽은 움직임을 두 번 허용하지 않았다.\n상인협회의 추격은 여기서 끝났다. 당신과 함께.'
  },
  banditBossForest: {
    title:'세리아의 마지막 질문', kind:'BAD END · 세리아', art:'boss', bonus:1150,
    epilogue:'“그래서 넌 어느 편이지?”\n당신은 왕국도 도적단도 완전히 택하지 않은 채 그녀 앞에 섰다.\n끝내 답을 내놓지 못하자 세리아는 자신의 방식으로 결론을 냈다.\n숲은 또 한 명의 방랑자를 삼켰다.'
  },
  banditBossAngryForest: {
    title:'네 편은 네가 정했다', kind:'BAD END · 세리아', art:'boss', bonus:1200,
    epilogue:'세리아는 당신의 편을 묻는 일을 그만뒀다.\n“넌 네 입으로 이미 정했어.”\n그 뒤에는 긴 설명도 두 번째 협상도 없었다.\n본거지의 횃불은 당신이 쓰러진 뒤에도 밤새 타올랐다.'
  }
};

function badEndingForCurrentScene() {
  const exact = BAD_ENDINGS[state.sceneId];
  if (exact) return exact;
  const sc = SCENES[state.sceneId];
  const enemy = getEnemy(sc);
  const byEnemy = {
    gangster:'gangster', gateGuard:'kingdomGate', citizen:'citizen', alarmGuard:'guardResponse',
    captain:'captainEnraged', eliteVark:'eliteVark', eliteIsel:'eliteIsel', oldGuard:'oldVeteran', banditScout:'banditScoutRoyal', assaultBram:'assaultBram', assaultNera:'assaultNera',
    banditOfficer1:'merchantCaptured', banditOfficer2:'officer2', noviceKnight:'guildNovice',
    midKnight:'midKnight', banditBoss:'banditBossForest', king:'kingEnraged'
  };
  if (sc?.enemy && BAD_ENDINGS[byEnemy[sc.enemy]]) return BAD_ENDINGS[byEnemy[sc.enemy]];
  if (enemy?.name === '떠돌이 상인 로벤') return BAD_ENDINGS.forestMerchant;
  return { title:'이름 없는 최후', kind:'BAD END', art:sc?.art||'exile', bonus:0,
    epilogue:'여정은 예상하지 못한 곳에서 끊겼다.\n당신이 남긴 선택과 소문만이 다음 사람들의 이야기 속에 희미하게 남는다.' };
}

function endingProfile(name) {
  if (state.flags.deathEnding && state.flags.deathEnding.title === name) return state.flags.deathEnding;
  return ENDINGS[name] || ENDINGS['BAD END'];
}

// ---------- v0.9.8: persistent world / resolved encounter guard ----------
// actor = the person, episode = one concrete meeting with that person.
// A dead actor can never return. A resolved episode can never be farmed again.
const ENCOUNTER_META = {
  gangster:{actor:'gangster',episode:'gangster_intro'}, gangsterAngry:{actor:'gangster',episode:'gangster_intro'},
  kingdomGate:{actor:'gateGuard',episode:'gate_check'}, gateSuspicious:{actor:'gateGuard',episode:'gate_check'},
  citizen:{actor:'citizen',episode:'citizen_market'}, citizenSuspicious:{actor:'citizen',episode:'citizen_market'},
  guardResponse:{actor:'alarmGuard',episode:'guard_response'}, guardFurious:{actor:'alarmGuard',episode:'guard_response'},
  captainEnraged:{actor:'captain',episode:'captain_purge'}, eliteVark:{actor:'eliteVark',episode:'elite_vark_watch'}, eliteIsel:{actor:'eliteIsel',episode:'elite_isel_blockade'}, oldVeteran:{actor:'oldGuard',episode:'old_guard'},
  banditScoutRoyal:{actor:'banditScout',episode:'scout_royal'}, banditScoutCornered:{actor:'banditScout',episode:'scout_royal'},
  assaultBram:{actor:'assaultBram',episode:'bram_vanguard'}, assaultNera:{actor:'assaultNera',episode:'nera_gate'},
  banditBossRoyal:{actor:'banditBoss',episode:'seria_final'}, banditBossAngry:{actor:'banditBoss',episode:'seria_final'},
  captainRebel:{actor:'captain',episode:'captain_rebel'}, kingEnraged:{actor:'king',episode:'king_rebel'},
  forestMerchant:{actor:'merchant',episode:'merchant_intro'},
  merchantCaptured:{actor:'officer1',episode:'officer1_capture'}, officer1Angry:{actor:'officer1',episode:'officer1_capture'},
  officer2:{actor:'officer2',episode:'officer2_bridge'}, officer2Angry:{actor:'officer2',episode:'officer2_bridge'},
  guildNovice:{actor:'noviceKnight',episode:'guild_novice'}, guildNoviceAngry:{actor:'noviceKnight',episode:'guild_novice'},
  midKnight:{actor:'midKnight',episode:'guild_mid'},
  banditBossForest:{actor:'banditBoss',episode:'seria_final'}, banditBossAngryForest:{actor:'banditBoss',episode:'seria_final'}
};
const ACTOR_NAMES = {
  gangster:'거리의 깡패', gateGuard:'왕국 경비병', citizen:'왕국 시민', alarmGuard:'출동한 경비병',
  captain:'친위대장 레오른', eliteVark:'엘리트 기사 바르크', eliteIsel:'엘리트 기사 이셀', oldGuard:'아르벤', banditScout:'도적단 정찰병', assaultBram:'돌격병 브람', assaultNera:'돌격병 네라', banditBoss:'세리아', king:'왕 에드란',
  merchant:'로벤', officer1:'갈고리', officer2:'붉은 모자', noviceKnight:'상인협회 초급 기사', midKnight:'상인협회 중급 기사'
};
const LEGACY_DEAD_FLAGS = {
  gangsterKilled:'gangster', guardKilled:'gateGuard', citizenKilled:'citizen', guardResponseKilled:'alarmGuard',
  captainKilled:'captain', eliteVarkKilled:'eliteVark', eliteIselKilled:'eliteIsel', oldGuardKilled:'oldGuard', merchantKilled:'merchant', officer1Killed:'officer1',
  officer2Killed:'officer2', assaultBramKilled:'assaultBram', assaultNeraKilled:'assaultNera', noviceKilled:'noviceKnight', midKnightKilled:'midKnight', banditBossKilled:'banditBoss'
};
const RECOVERY_FALLBACK = {
  gangster:'roadsideAftermath', gangsterAngry:'roadsideAftermath', kingdomGate:'cityEntry', gateSuspicious:'cityEntry',
  citizen:'citySquare', citizenSuspicious:'citySquare', guardResponse:'captainEnraged', guardFurious:'captainEnraged',
  captainEnraged:'kingdomEscape', eliteVark:'banditScoutRoyal', eliteIsel:'campNight', oldVeteran:'kingAudience', banditScoutRoyal:'royalSupply', banditScoutCornered:'royalSupply',
  banditBossRoyal:'friendBridge', banditBossAngry:'friendBridge', captainRebel:'rebelRetreat', kingEnraged:'rebelRetreat',
  forestMerchant:'forestRoad', assaultBram:'merchantCaptured', merchantCaptured:'officer2', officer1Angry:'officer2', officer2:'banditCampLife', officer2Angry:'banditCampLife',
  assaultNera:'banditBossForest', guildNovice:'forestBeforeBoss', guildNoviceAngry:'forestBeforeBoss', midKnight:'banditBossForest',
  banditBossForest:'friendBridge', banditBossAngryForest:'friendBridge'
};
function worldShape(w={}){
  return {
    deadActors:{...(w.deadActors||{})}, encounters:{...(w.encounters||{})}, escapeUsed:{...(w.escapeUsed||{})}, merchantPaid:{...(w.merchantPaid||{})},
    anomalies:{undertakerSeen:!!w.anomalies?.undertakerSeen,trackerSeen:!!w.anomalies?.trackerSeen},
    invalidReturns:Number(w.invalidReturns||0), recovery:w.recovery||null
  };
}
function metaForScene(id=state.sceneId){return ENCOUNTER_META[id]||null;}
function encounterKey(id=state.sceneId){return metaForScene(id)?.episode||id;}
function socialUseKey(id=state.sceneId){return encounterKey(id);}
function escapeWasUsed(id=state.sceneId){return !!state.world?.escapeUsed?.[encounterKey(id)];}
function setEscapeUsed(id=state.sceneId){state.world ||= worldShape();state.world.escapeUsed[encounterKey(id)]=true;state.escapeAttempted=true;}
function markEncounterResolution(method,next,ending,onlyIfUnset=false){
  const meta=metaForScene(); if(!meta || (!next && !ending)) return;
  state.world ||= worldShape();
  const old=state.world.encounters[meta.episode]; if(onlyIfUnset && old?.resolved)return;
  const status=method==='attack'?'dead':method==='run'?'escaped':method==='social'?'social':'talked';
  state.world.encounters[meta.episode]={resolved:true,status,actor:meta.actor,sceneId:state.sceneId,next:next||'',ending:ending||'',at:Number(state.stats?.progress||0)};
  if(status==='dead')state.world.deadActors[meta.actor]={sceneId:state.sceneId,at:Number(state.stats?.progress||0),name:ACTOR_NAMES[meta.actor]||meta.actor};
}
function recoveryTarget(ctx){
  const t=ctx?.next; if(t && SCENES[t] && !['undertakerMorten','trackerRian','emptyAftermath','brokenTrail'].includes(t))return t;
  const fb=RECOVERY_FALLBACK[ctx?.attemptedScene]; if(fb && SCENES[fb])return fb;
  if(state.flags?.rebel)return 'rebelRetreat';
  if(state.entered?.friendBridge)return 'friendBridge';
  if(state.entered?.forestRoad)return forestProgressScene(true);
  if(state.entered?.citySquare)return 'citySquare';
  return 'roadsideAftermath';
}
function recoveryActorName(){const ctx=state.world?.recovery;return ACTOR_NAMES[ctx?.actor]||'그 사람';}
function recoverFromAnomaly(){
  const ctx=state.world?.recovery; const target=recoveryTarget(ctx);
  state.world.recovery=null; state.pending=null; state.lastToast=''; state.escapeAttempted=false;
  state.sceneId=target; save(); enter(target);
}
function maybeReplaceResolvedEncounter(id){
  if(state.pending||state.ended||['undertakerMorten','trackerRian','emptyAftermath','brokenTrail'].includes(id))return false;
  const meta=ENCOUNTER_META[id]; if(!meta)return false;
  state.world ||= worldShape();
  const dead=state.world.deadActors[meta.actor]; const rec=state.world.encounters[meta.episode];
  if(!dead && !rec?.resolved)return false;
  const ctx={actor:meta.actor,episode:meta.episode,attemptedScene:id,status:dead?'dead':rec.status,next:rec?.next||'',at:Date.now()};
  state.world.invalidReturns=(state.world.invalidReturns||0)+1;state.world.recovery=ctx;
  let special;
  if(dead){special=state.world.anomalies.undertakerSeen?'emptyAftermath':'undertakerMorten';state.world.anomalies.undertakerSeen=true;}
  else{special=state.world.anomalies.trackerSeen?'brokenTrail':'trackerRian';state.world.anomalies.trackerSeen=true;}
  state.sceneId=special;state.lastToast='';state.pending=null;save();showScreen('gameScreen');render();fx(dead?'ash':'trail');return true;
}
function migrateLegacyWorld(merged,data){
  merged.world=worldShape(data.world||{});
  for(const [flag,actor] of Object.entries(LEGACY_DEAD_FLAGS))if(merged.flags?.[flag]&&!merged.world.deadActors[actor])merged.world.deadActors[actor]={sceneId:'legacy',at:0,name:ACTOR_NAMES[actor]||actor};
  if(merged.flags?.gangsterPeace&&!merged.world.encounters.gangster_intro)merged.world.encounters.gangster_intro={resolved:true,status:'social',actor:'gangster',sceneId:'gangster',next:'roadsideAftermath',at:0};
  if(merged.flags?.kingdomFriendly&&merged.entered?.cityEntry&&!merged.world.encounters.gate_check)merged.world.encounters.gate_check={resolved:true,status:'social',actor:'gateGuard',sceneId:'kingdomGate',next:'cityEntry',at:0};
  if(merged.flags?.merchantAlive&&merged.entered?.forestRoad&&!merged.flags?.merchantKilled&&!merged.world.encounters.merchant_intro)merged.world.encounters.merchant_intro={resolved:true,status:'talked',actor:'merchant',sceneId:'forestMerchant',next:'forestRoad',at:0};
  if(merged.flags?.officer1Allied&&merged.entered?.officer2&&!merged.world.encounters.officer1_capture)merged.world.encounters.officer1_capture={resolved:true,status:'social',actor:'officer1',sceneId:'merchantCaptured',next:'officer2',at:0};
  if(merged.flags?.officer2Allied&&merged.entered?.banditCampLife&&!merged.world.encounters.officer2_bridge)merged.world.encounters.officer2_bridge={resolved:true,status:'social',actor:'officer2',sceneId:'officer2',next:'banditCampLife',at:0};
  if(data.flags?.lastEscapeFrom&&data.flags?.lastEscapeTo){const m=ENCOUNTER_META[data.flags.lastEscapeFrom];if(m&&!merged.world.encounters[m.episode])merged.world.encounters[m.episode]={resolved:true,status:'escaped',actor:m.actor,sceneId:data.flags.lastEscapeFrom,next:data.flags.lastEscapeTo,at:0};}
  for(const [sid,v] of Object.entries(data.socialUsed||{}))if(v){const k=ENCOUNTER_META[sid]?.episode||sid;merged.socialUsed[k]=true;}
  if(data.escapeAttempted){const k=ENCOUNTER_META[data.sceneId]?.episode||data.sceneId;if(k)merged.world.escapeUsed[k]=true;}
  return merged;
}

function freshState() {
  return {
    version: GAME_VERSION,
    runId:`local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`,
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
    talkRisk: {},
    encounterMods: {},
    entered: {},
    world: worldShape(),
    lastToast: '',
    pending: null,
    ended: false,
    stats: {
      progress:0, goldEarned:0, goldSpent:0, kills:0, eliteKills:0, riskyWins:0,
      talkSolved:0, socialSuccess:0, socialFail:0, runSuccess:0, secrets:0,
      survivors:0, growths:0, comebackWins:0, talkInteractions:0, overTalks:0, itemsUsed:0, corpses:0, tyranny:0, merchantDeals:0, merchantIncome:0, ending:'', maxAttackChanceBeaten:100
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
        toast('거지들이 먼저 돈을 훔쳤다.', 'good');
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
      damagePlayer(1, false); go('gangsterAngry', '깡패가 말을 끊고 거칠게 밀쳐냈다.');
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
    socialFail(){ state.flags.captainTalkPenalty=(state.flags.captainTalkPenalty||0)+2; toast('레오른의 표정이 굳었다. 검을 쥔 손에 힘이 들어간다.','bad'); render(); save(); },
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
    socialFail(){ state.flags.oldGuardBuff=(state.flags.oldGuardBuff||0)+3; toast('아르벤은 대답 대신 당신의 자세를 읽는다.','bad'); render();save(); },
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

  eliteVark: scene('eliteVark', {
    chapter:'ROYAL ROUTE', location:'친위대 외곽 훈련로', art:'captain', enemy:'eliteVark',
    text:()=>`훈련장을 벗어나자 은회색 갑옷의 기사가 길을 막는다. 가슴의 문장은 친위대보다 작지만 더 오래 닳아 있다.

“바르크다. 레오른 대장 명령으로 네 정찰에 붙는다.”

그는 동료라고 말하지 않는다. 감시역이라는 뜻을 굳이 숨길 생각도 없어 보인다.${state.flags.enlisted?'\n\n“명예를 되찾고 싶다면, 먼저 왕국이 네 등을 맡겨도 되는지 보여.”':''}`,
    choices(){return (state.talkCount.eliteVark||0)>=2 ? [c('정찰 신호를 외운다','',()=>{state.flags.varkBriefing=true;state.relation.kingdom+=1;state.stats.talkSolved++;resolve('talk','banditScoutRoyal','바르크는 나무에 남기는 신호와 매복을 피하는 순서를 짧게 가르쳐준다.\n\n“도적도 사람이다. 사람은 버릇을 남겨.”');})] : [];},
    socialSuccess(){state.flags.varkTrusted=true;state.relation.kingdom+=2;resolve('social','banditScoutRoyal','바르크는 완전히 믿지는 않지만 더는 감시 대상처럼 대하지 않는다.');},
    socialFail(){encMod().enemyAtk+=2;toast('바르크의 시선이 차가워진다. 말보다 움직임을 보겠다는 표정이다.','bad');render();save();},
    attackWin(){state.flags.eliteVarkKilled=true;state.flags.kingdomHostile=true;state.relation.kingdom-=5;gainGold(62);resolve('attack','captainEnraged','레오른이 붙인 감시역을 쓰러뜨렸다. 이 죽음은 왕국 안에서 숨길 수 없다.');},
    runSuccess(){handleEscapeSuccess();}
  }),

  eliteIsel: scene('eliteIsel', {
    chapter:'ROYAL ROUTE · BLOCKADE', location:'왕국-숲 경계 봉쇄선', art:'captain', enemy:'eliteIsel',
    text:()=>`도적단 영역으로 넘어가는 마지막 돌문 앞. 긴 창을 든 여기사 하나가 병사들을 뒤로 물리고 혼자 남는다.

“이셀. 봉쇄선 책임자다.”

그녀는 당신의 이름보다 보고서를 먼저 읽었다.${state.flags.varkTrusted?'\n\n“바르크가 네가 적어도 등을 찌를 사람은 아니라고 적었더군.”':''}${state.flags.eliteVarkKilled?'\n\n“바르크의 피를 묻히고 여기까지 올 줄은 몰랐군.”':''}`,
    choices(){return (state.talkCount.eliteIsel||0)>=2 && !state.flags.eliteVarkKilled ? [c('피해 기록을 끝까지 듣는다','',()=>{state.flags.iselMediation=true;state.stats.secrets++;state.stats.talkSolved++;resolve('talk','campNight','이셀은 도적에게 죽은 시민과 징발 뒤 굶은 숲 마을의 숫자를 같은 장부에서 보여준다.\n\n“한쪽만 악이라고 생각하면 여기서 오래 못 버텨.”');})] : [];},
    socialSuccess(){state.flags.iselSpared=true;state.flags.iselMediation=true;state.relation.kingdom+=1;resolve('social','campNight','이셀은 창을 내리고 봉쇄선을 열어준다. “가서 네 눈으로 판단해.”');},
    socialFail(){encMod().socialPct-=8;encMod().enemyAtk+=1;toast('이셀은 변명보다 기록을 믿기로 한다.','bad');render();save();},
    attackWin(){state.flags.eliteIselKilled=true;state.flags.kingdomHostile=true;state.relation.kingdom-=6;gainGold(68);resolve('attack','captainEnraged','봉쇄선 책임자가 쓰러진다. 뒤의 병사들이 왕국으로 경보를 보낸다.');},
    runSuccess(){handleEscapeSuccess();}
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
      c('봉쇄선을 지나 본거지로 향한다','',()=>go('eliteIsel'))
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
    socialFail(){ state.flags.captainRebelBuff=(state.flags.captainRebelBuff||0)+2;toast('말이 끝나기도 전에 친위대가 대형을 좁힌다.','bad');render();save(); },
    enemyMod(e){ e.atk += (state.flags.captainRebelBuff||0); if(state.flags.captainWeakened)e.atk=Math.max(1,e.atk-3);return e;},
    attackWin(){state.flags.captainKilled=true;gainGold(80);resolve('attack','kingEnraged','친위대장이 쓰러진다. 왕이 직접 전장으로 내려온다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  kingEnraged: scene('kingEnraged', {
    chapter:'REBELLION · FINAL', location:'왕궁 앞', art:'kingrage', enemy:'king', socialPenalty:25,
    text:`왕 에드란이 피 묻은 망토를 끌며 계단을 내려온다.\n\n“내 병사와 백성을 죽이고도 말이 필요하다고 생각하느냐?”\n\n분노한 왕에게 남은 것은 결판뿐이다.`,
    talk(){state.flags.kingBuff=(state.flags.kingBuff||0)+2;toast('왕의 눈빛이 더 차가워졌다.','bad');render();save();},
    socialSuccess(){state.flags.kingShaken=true;toast('처세 성공 · 왕의 판단이 흔들렸다. 공격력 -2','good');render();save();},
    socialFail(){state.flags.kingBuff=(state.flags.kingBuff||0)+3;toast('말은 닿지 않았다. 왕이 검을 바로 세운다.','bad');render();save();},
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
    chapter:'CHAPTER 3B', location:'숲 · 초입', art:'merchant',
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

  assaultBram: scene('assaultBram', {
    chapter:'FOREST ROUTE · VANGUARD', location:'숲 · 끊어진 수레길', art:'bandits', enemy:'assaultBram',
    text:()=>`부러진 수레축을 방패처럼 세운 남자가 길을 막고 있다. 큰 도끼를 들었지만 갑옷은 여기저기 기운 자국투성이다.

“브람. 앞에서 맞는 놈이지.”

그는 웃으며 도끼를 어깨에 걸친다.${state.flags.merchantAlive?'\n\n“상인 찾는 거면 서두르지 마. 갈고리는 사람보다 거래를 먼저 죽이는 놈이니까.”':'\n\n“혼자 여기까지 왔으면 뭘 찾는지는 대충 알겠네.”'}`,
    choices(){return (state.talkCount.assaultBram||0)>=2 ? [c('거래 이야기를 기억해둔다','',()=>{state.flags.bramTradeHint=true;state.relation.bandits+=1;state.stats.talkSolved++;resolve('talk',state.flags.merchantAlive?'merchantCaptured':'officer2','브람은 로벤을 잡은 이유가 몸값보다 끊긴 보급선 때문이라고 말한다.\n\n“갈고리 앞에서 돈 얘기보다 소금이랑 약 얘기를 먼저 해.”');})] : [];},
    socialSuccess(){state.flags.bramSpared=true;state.relation.bandits+=1;resolve('social',state.flags.merchantAlive?'merchantCaptured':'officer2','브람은 당신을 당장 베어야 할 적은 아니라고 판단하고 길을 비킨다.');},
    socialFail(){encMod().enemyAtk+=2;toast('브람은 말을 끊고 도끼를 양손으로 고쳐 잡는다.','bad');render();save();},
    attackWin(){state.flags.assaultBramKilled=true;state.relation.bandits-=2;gainGold(36);resolve('attack',state.flags.merchantAlive?'merchantCaptured':'officer2','브람이 수레길 옆으로 쓰러진다. 뒤쪽 숲에서 누군가 급히 달아나는 소리가 난다.');},
    runSuccess(){handleEscapeSuccess();}
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

  assaultNera: scene('assaultNera', {
    chapter:'FOREST ROUTE · LAST GATE', location:'도적단 본거지 · 바깥 목책', art:'banditcamp', enemy:'assaultNera',
    text:()=>`본거지의 첫 횃불 아래, 짧은 창 두 자루를 등에 멘 여자가 기다리고 있다. 발치에는 왕국 화살과 도적단 화살이 함께 꽂혀 있다.

“네라. 세리아한테 들어가는 사람 얼굴을 기억하는 게 내 일이야.”

그녀는 당신의 얼굴보다 뒤에 남겨둔 사람들의 숫자를 먼저 세는 눈이다.${state.flags.assaultBramKilled?'\n\n“브람이 돌아오지 않은 이유도 이제 알겠네.”':''}${state.flags.officer1Killed||state.flags.officer2Killed?'\n\n“간부들 피까지 묻혔으면 말은 짧게 하자.”':''}`,
    choices(){return (state.talkCount.assaultNera||0)>=2 && !(state.flags.assaultBramKilled&&state.flags.officer1Killed&&state.flags.officer2Killed) ? [c('있는 그대로 보고해달라고 한다','',()=>{state.flags.neraVouched=true;state.relation.bandits+=2;state.stats.talkSolved++;resolve('talk',state.flags.noviceKilled?'midKnight':'banditBossForest','네라는 당신이 죽인 사람과 살린 사람을 짧게 적는다.\n\n“꾸며서 말하지 않을게. 세리아는 그걸 더 싫어하니까.”');})] : [];},
    socialSuccess(){state.flags.neraVouched=true;state.relation.bandits+=1;resolve('social',state.flags.noviceKilled?'midKnight':'banditBossForest','네라는 한참 당신을 보다가 목책을 두드린다. 안쪽에서 문이 열린다.');},
    socialFail(){encMod().socialPct-=8;encMod().enemyAtk+=2;toast('네라는 당신의 말을 보고용 거짓말이라고 판단한다.','bad');render();save();},
    attackWin(){state.flags.assaultNeraKilled=true;state.relation.bandits-=3;gainGold(44);resolve('attack',state.flags.noviceKilled?'midKnight':'banditBossForest','네라가 쓰러지고 목책 안쪽으로 경보가 번진다. 세리아는 당신이 어떻게 들어왔는지 알게 될 것이다.');},
    runSuccess(){handleEscapeSuccess();}
  }),

  forestBeforeBoss: scene('forestBeforeBoss', {
    chapter:'FOREST ROUTE', location:'도적단 본거지 외곽', art:'banditcamp',
    text:`도적단 본거지의 횃불이 나무 사이로 보인다.\n여기서부터는 세리아의 영역이다.`,
    choices:() => [
      c('잠시 장비를 점검한다','가방과 회복품을 확인한다.',openBag),
      c('본거지로 들어간다','',()=>go('assaultNera'))
    ]
  }),

  midKnight: scene('midKnight', {
    chapter:'MERCHANT GUILD · PURSUER', location:'도적단 본거지 앞', art:'midknight', enemy:'midKnight', socialDisabled:true,
    text:`검은 망토의 기사가 길 한가운데 서 있다.\n방패에는 상인협회의 은빛 문장이 박혀 있다.\n\n“초급 기사를 죽인 자가 너구나.”`,
    talk(){state.flags.midKnightBuff=(state.flags.midKnightBuff||0)+3;toast('말을 건 사이, 중급 기사는 당신의 호흡과 발을 읽었다.','bad');render();save();},
    enemyMod(e){e.atk+=(state.flags.midKnightBuff||0);return e;},
    attackWin(){state.flags.midKnightKilled=true;state.relation.merchants-=4;gainGold(95);resolve('attack','banditBossForest','중급 기사까지 쓰러졌다. 상인협회와의 관계는 돌이킬 수 없다.');},
    runSuccess(){ handleEscapeSuccess(); }
  }),

  banditBossForest: scene('banditBossForest', {
    chapter:'FOREST ROUTE · FINAL', location:'도적단 본거지', art:'boss', enemy:'banditBoss',
    text:`세리아가 지도 위에 꽂힌 단검을 뽑는다.\n\n“내 간부들을 죽였든, 친구가 됐든 결국 여기까지 왔네.”\n“그래서 넌 어느 편이지?”${classReaction('banditBossForest')}`,
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
    choices:() => {
      const stranded=state.flags.lastEscapeTo==='friendBridge' && !canFriendEnding(true) && !state.flags.rebel && !state.flags.banditTruce && !state.flags.friendTalkOpen;
      if(stranded)return [c('어느 쪽에도 돌아가지 못한다','',()=>finish('길을 잃은 자'))];
      return [
        c('왕국과 도적단의 협상을 주선한다','',()=>{
          if(canFriendEnding(true)) finish('모두와 친구');
          else queueOutcome(`${friendEndingHint(true)}\n\n다리 양쪽의 사람들은 아직 무기를 내려놓지 않는다.`,null);
        }),
        !state.flags.rebellionRetreated && c('도적단에 돌아가 왕국을 공격한다','',()=>{state.flags.rebel=true;go('rebelMarch');})
      ].filter(Boolean);
    }
  }),

  undertakerMorten: scene('undertakerMorten', {
    chapter:'남겨진 자리', location:'다시 돌아온 자리', art:'undertaker',
    text:()=>`분명 ${recoveryActorName()}이 있던 자리다. 하지만 사람 대신 젖은 흙 냄새와 흰 천 한 장이 남아 있다.\n\n검은 외투를 입은 사내가 무릎을 꿇고 마지막 매듭을 묶는다. 장의사 모르텐. 그는 당신을 한 번 보고는 다시 손을 움직인다.\n\n“죽은 사람은 기다려주지 않아. 돌아온 건 산 사람 쪽이지.”\n\n그가 덮은 천 아래에서는 아무 움직임도 없다. 지나간 선택은 그대로 지나가 있었다.`,
    choices:()=>[
      !state.flags.mortenSpoken && c('장의사에게 묻는다','',()=>{state.flags.mortenSpoken=true;state.stats.secrets++;queueOutcome(`모르텐은 삽자루에 턱을 괸다.\n\n“난 시체를 데려갈 뿐이야. 네가 두고 간 결과까지 치워주진 않아.”\n\n그는 ${recoveryActorName()}이 어디로 갔느냐는 질문에는 대답하지 않는다. 대신 발밑의 흙을 한 번 더 다진다.`,null);}),
      c('흔적을 뒤로한다','',()=>recoverFromAnomaly())
    ].filter(Boolean)
  }),

  trackerRian: scene('trackerRian', {
    chapter:'되짚은 길', location:'겹쳐진 발자국', art:'tracker',
    text:()=>`같은 길을 되짚었지만 ${recoveryActorName()}은 보이지 않는다. 대신 길목의 나무에 짧은 칼자국이 세 개 나 있다.\n\n그 아래, 회색 망토를 걸친 여자가 발자국을 살피고 있다. 추적자 리안. 그녀는 고개도 들지 않은 채 말한다.\n\n“한 번 떠난 사람을 같은 자리에서 두 번 만날 순 없어.”\n\n당신이 속였든, 달아났든, 좋게 헤어졌든 그 조우는 이미 끝났다. 남은 것은 다음 길뿐이다.`,
    choices:()=>[
      !state.flags.rianSpoken && c('누굴 쫓고 있냐고 묻는다','',()=>{state.flags.rianSpoken=true;state.stats.secrets++;queueOutcome(`리안이 마른 흙을 손가락으로 문지른다.\n\n“사람이 아니라 반복되는 흔적을 쫓아. 같은 발자국이 같은 곳에서 자꾸 시작되면 누군가는 길을 잘못 기억하고 있다는 뜻이거든.”\n\n그녀는 당신이 가야 할 방향을 턱으로 가리킨다.`,null);}),
      c('앞길로 간다','',()=>recoverFromAnomaly())
    ].filter(Boolean)
  }),

  emptyAftermath: scene('emptyAftermath', {
    chapter:'남겨진 자리', location:'비워진 자리', art:'grave',
    text:()=>`${recoveryActorName()}이 있던 자리에는 아무도 없다.\n\n흙은 이미 굳었고, 장의사가 남긴 흰 실 한 가닥만 돌 틈에 걸려 있다. 죽은 사람은 다시 서 있지 않는다.\n\n바람이 빈 자리를 지나 다음 길 쪽으로 분다.`,
    choices:()=>[c('계속 간다','',()=>recoverFromAnomaly())]
  }),

  brokenTrail: scene('brokenTrail', {
    chapter:'되짚은 길', location:'끊긴 흔적', art:'trail',
    text:()=>`${recoveryActorName()}의 흔적은 여기서 끊겨 있다.\n\n누군가 칼끝으로 나무껍질에 화살표 하나를 새겨두었다. 리안의 표식이다. 같은 자리를 맴돌아도 떠난 사람은 돌아오지 않는다.\n\n화살표는 오직 앞쪽만 가리킨다.`,
    choices:()=>[c('표식을 따라간다','',()=>recoverFromAnomaly())]
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
      c('검술 훈련에 집중한다','공격력 +1',()=>takeGrowth('barracksGrowth','atk','수십 번 같은 동작을 반복한 끝에 칼끝의 흔들림이 줄었다.\n\n공격력 +1','eliteVark')),
      c('방패를 들고 버티기 훈련을 한다','최대 체력 +1',()=>takeGrowth('barracksGrowth','hp','팔이 저릴 때까지 충격을 받아낸다. 몸이 조금 더 버티는 법을 익혔다.\n\n최대 체력 +1','eliteVark')),
      c('정찰병의 이동법을 배운다','속도 +1',()=>takeGrowth('barracksGrowth','speed','소리를 줄이고 빠르게 이동하는 법을 반복한다.\n\n속도 +1','eliteVark'))
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
      !state.flags.deepForestGrowth && c('무거운 장작을 메고 언덕을 오른다','최대 체력 +1',()=>takeGrowth('deepForestGrowth','hp','장작을 내려놓았을 때는 숨이 가쁘지만 몸은 한층 단단해져 있다.\n\n최대 체력 +1','assaultBram')),
      !state.flags.deepForestGrowth && c('나무 사이를 빠르게 통과하는 법을 배운다','속도 +1',()=>takeGrowth('deepForestGrowth','speed','낮은 가지와 뿌리를 피하는 법을 익힌다. 숲에서의 발이 빨라졌다.\n\n속도 +1','assaultBram')),
      c('경계목을 넘는다','도적단의 영역으로 들어간다.',()=>go('assaultBram'))
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

// ---------- Class-flavored opening ----------
const EARLY_CLASS_FLAVOR = {
  knight:{
    intro:'몸은 아직 쫓겨난 사실보다 오래된 훈련을 먼저 기억한다. 등을 벽에 두고, 출구를 확인하고, 손이 닿는 곳에 무기가 있는지 살핀다.',
    beggars:'도움을 청하는 목소리를 들으면 먼저 앞을 막아서는 습관이 남아 있다. 다만 이번에는 지켜야 할 깃발도 명령도 없다.',
    gangster:'남자의 어깨와 발 간격이 먼저 눈에 들어온다. 싸움이 벌어진다면 정면에서 받아낼 수 있을지 본능적으로 가늠한다.'
  },
  noble:{
    intro:'옷은 초라해졌어도 사람을 재는 습관은 남아 있다. 누가 먼저 말하고, 누가 눈을 피하고, 누가 당신의 몰락을 알아볼지를 살핀다.',
    beggars:'세 사람은 도움보다 동의를 먼저 구한다. 말의 순서와 눈짓이 맞지 않는다. 귀족 사회에서 수없이 본 종류의 작은 연극이다.',
    gangster:'남자는 무례하지만 무작정 덤비는 부류는 아니다. 무엇을 원하는지 알아내면 검보다 말이 빠를 수도 있다.'
  },
  thief:{
    intro:'눈을 뜨자마자 주머니부터 확인한다. 가진 건 적지만 아직 빼앗긴 것은 없다. 골목의 출구 셋과 감시하기 좋은 지붕 하나도 함께 눈에 들어온다.',
    beggars:'도움을 청하는 동안 한 명의 시선이 자꾸 당신의 허리춤으로 내려간다. 가난한 사람을 의심해서가 아니라, 손버릇은 손버릇을 알아보기 때문이다.',
    gangster:'정면보다 골목 양옆의 틈이 먼저 보인다. 이길 수 있는 싸움인지보다, 필요하면 얼마나 빨리 사라질 수 있는지를 먼저 잰다.'
  },
  merchant:{
    intro:'비에 젖은 옷보다 먼저 주머니 속 동전의 무게를 센다. 몰락해도 값의 감각은 남는다. 이 도시에서 다시 시작하려면 명예보다 밑천이 먼저다.',
    beggars:'세 사람의 사정을 듣는 동안 필요한 비용부터 머릿속에 잡힌다. 배고픔도 원한도 결국 누군가는 값을 치른다. 문제는 그 값이 누구 몫이냐는 것이다.',
    gangster:'남자의 낡은 외투와 굳은손을 보고 하루 벌이가 어느 정도인지부터 짐작한다. 싸움보다 거래가 싸게 먹힐 가능성이 있다.'
  },
  spellsword:{
    intro:'손이 먼저 검을 찾는다. 몰락도 추방도 설명할 말은 많지만, 머릿속에 남은 답은 이상하리만큼 단순하다. 부술 수 있으면 지나갈 수 있다.',
    beggars:'세 사람의 하소연은 길다. 누가 옳은지보다 이 이야기가 결국 싸움으로 끝날지부터 생각하게 된다.',
    gangster:'상대가 싸울 사람인지 아닌지는 금세 알 수 있다. 문제는 싸우지 않을 이유를 당신이 얼마나 오래 참을 수 있느냐다.'
  },
  necromancer:{
    intro:'젖은 골목에는 살아 있는 냄새와 죽어가는 냄새가 뒤섞여 있다. 다른 사람은 지나칠 흔적들이 당신에게는 유난히 선명하다.',
    beggars:'셋 모두 굶주렸지만 아직 죽음과는 거리가 있다. 이상하게도 그 사실이 먼저 안심된다.',
    gangster:'남자의 숨은 고르고 맥은 강해 보인다. 아직 죽은 자의 편에 설 사람은 아니다. 적어도 지금은.'
  },
  dictator:{
    intro:'자리도 이름도 잃었지만 사람을 위아래로 나누던 습관은 사라지지 않았다. 이 골목에서도 누가 명령하고 누가 따르는지는 금세 보인다.',
    beggars:'세 사람 중 실제로 결정을 내리는 자는 하나뿐이다. 나머지는 그의 말을 반복한다. 작은 무리에도 권력은 있다.',
    gangster:'남자는 이 골목에서 자기 규칙이 통한다고 믿는다. 당신에게는 그 확신 자체가 도전처럼 느껴진다.'
  }
};
function earlyClassFlavor(part){return EARLY_CLASS_FLAVOR[state.classId]?.[part]||'';}

const CLASS_REACTIONS = {
  kingdomGate:{
    knight:'경비병이 당신의 서 있는 자세를 한 번 더 본다. “군에 있었나? 발을 그렇게 두는 사람은 흔치 않은데.”',
    noble:'경비병이 말투를 듣고 눈을 가늘게 뜬다. “그 말씨… 평민 골목에서 배운 건 아니군.”',
    thief:'경비병이 당신의 손부터 본다. “손은 보이게 둬. 요즘 문 앞에서 지갑 사라지는 일이 많아서.”',
    merchant:'경비병이 짐보다 허리의 돈주머니를 먼저 본다. “장사꾼이면 통행세부터 준비해. 안에서 값 깎는 건 네 자유고.”',
    spellsword:'경비병의 시선이 검에 오래 머문다. “그 물건, 칼집에서 꺼낼 생각은 하지 마.”',
    necromancer:'경비병이 이유도 모른 채 반걸음 물러난다. “이상하군. 네 주변만 유난히 찬 것 같은데.”',
    dictator:'당신의 첫마디가 명령처럼 떨어지자 경비병의 턱이 굳는다. “여긴 네 부하가 지키는 문이 아니다.”'
  },
  forestMerchant:{
    knight:'로벤은 당신의 손에 밴 굳은살을 보고 웃는다. “호위 출신이면 물건값보다 길값이 더 비싸다는 건 알겠네.”',
    noble:'로벤은 옷보다 말투를 보고 값을 다시 생각한다. “좋은 집 출신은 흥정을 못하거나, 너무 잘하지. 어느 쪽인지 보자고.”',
    thief:'로벤이 수레 덮개를 슬쩍 당겨 닫는다. “눈으로 재는 건 공짜지만, 손대는 순간부터 가격이 붙어.”',
    merchant:'로벤의 눈빛이 처음으로 조금 즐거워진다. “동업자였나? 그럼 거짓말은 절반만 하자. 서로 시간 아깝잖아.”',
    spellsword:'로벤은 검과 수레 사이 거리를 잰다. “물건은 부숴도 돈이 안 나와. 그 정도는 알지?”',
    necromancer:'로벤은 당신 뒤 빈 공간을 한 번 본다. “혼자 온 거 맞지? …됐다. 묻지 않는 것도 장사 수완이야.”',
    dictator:'로벤은 명령조를 듣고도 웃는다. “왕도 외상은 안 돼. 돈 내는 사람만 손님이야.”'
  },
  captainEnraged:{
    knight:'레오른은 당신의 검을 보며 낮게 말한다. “배운 사람이니 더 잘 알겠지. 칼은 명령보다 오래 남는다.”',
    noble:'“신분이 죄를 가려주던 시절은 네게 끝났다.” 레오른은 예전 호칭을 일부러 입에 올리지 않는다.',
    thief:'“빠른 발로 여기까지 왔군.” 레오른의 시선이 골목 출구를 훑는다. “이번엔 도망갈 길부터 막았다.”',
    merchant:'“사람 목숨에도 값을 매길 셈인가?” 레오른은 당신의 돈주머니 쪽을 보지도 않는다.',
    spellsword:'레오른은 당신의 검에서 눈을 떼지 않는다. “말보다 파괴가 편한 인간은 결국 파괴될 곳을 찾더군.”',
    necromancer:'“죽은 자를 데리고 다닌다는 소문이 있더군.” 레오른의 목소리가 더 낮아진다. “오늘은 더 늘리지 마라.”',
    dictator:'“명령할 사람을 찾는 눈이군.” 레오른이 검을 뽑는다. “여기엔 네 명령을 받을 사람이 없다.”'
  },
  oldVeteran:{
    knight:'아르벤은 당신의 자세를 보고 아주 작게 고개를 끄덕인다. “기본은 배웠군. 그래서 더 위험하지. 배운 사람은 자기 실수를 실력으로 착각하거든.”',
    noble:'“가문은 검을 대신 들어주지 않아.” 아르벤은 당신의 옛 신분을 이미 아는 듯 말한다.',
    thief:'아르벤은 당신이 빠져나갈 길을 보는 순간을 놓치지 않는다. “도망칠 곳을 먼저 찾는 건 좋은 습관이지. 상대가 나만 아니면.”',
    merchant:'“세상 모든 것에 값이 있다고 믿나?” 아르벤이 묻는다. “그럼 네가 여기까지 온 값도 생각해둬.”',
    spellsword:'아르벤의 시선이 마검에 닿는다. “힘이 검에서 오는지, 네가 검에 빌려주는 건지부터 알아야 오래 산다.”',
    necromancer:'“죽은 사람에게 기대는 건 쉽다.” 노인이 말한다. “살아 있는 사람의 책임을 지는 게 더 어렵지.”',
    dictator:'아르벤은 웃음기 없이 당신을 본다. “사람 위에 서고 싶다면 먼저 혼자 서는 법부터 보여라.”'
  },
  banditBossForest:{
    knight:'세리아가 당신의 자세를 훑는다. “왕국 기사랑 비슷한 냄새가 나네. 갑옷을 벗었다고 버릇까지 벗겨지진 않지.”',
    noble:'“말투가 비싸네.” 세리아가 웃는다. “숲에선 혈통보다 오늘 누가 배고픈지가 더 중요해.”',
    thief:'세리아는 당신의 발끝을 보고 웃는다. “도망칠 길부터 찾았지? 좋아. 적어도 솔직한 몸이네.”',
    merchant:'세리아가 지도 위 교역로를 손가락으로 두드린다. “장사꾼이면 알겠네. 우리가 원하는 건 왕관보다 길이야.”',
    spellsword:'“칼로 다 해결하는 사람은 협상하기 편해.” 세리아가 단검을 든다. “원하는 게 뻔하거든.”',
    necromancer:'세리아가 당신 뒤를 바라본다. “죽은 놈들이 네 편이면, 산 놈들한테는 뭘 줄 건데?”',
    dictator:'“왕 하나도 벅찬데 또 왕 노릇 할 사람이 왔네.” 세리아의 미소가 얇아진다.'
  },
  kingEnraged:{
    knight:'에드란이 검끝을 세운다. “기사였으면 알겠지. 충성은 마지막에 어느 쪽을 향해 서느냐로 남는다.”',
    noble:'왕은 당신의 옛 신분을 비웃듯 부른다. “가문이 무너져도 귀족의 버릇은 남는군.”',
    thief:'“도망칠 길을 찾는 눈이군.” 왕이 옆문을 잠그라는 손짓을 한다. “이번 알현은 짧게 끝내지.”',
    merchant:'“왕국까지 흥정거리로 보이나?” 에드란이 차갑게 웃는다. “그럼 네 목숨의 가격부터 매겨봐라.”',
    spellsword:'왕은 마검을 보며 자리에서 일어난다. “말보다 저게 편하겠지. 나도 오늘은 그렇다.”',
    necromancer:'“내 병사들의 죽음까지 네 병력으로 셀 셈인가?” 왕의 분노가 한층 깊어진다.',
    dictator:'에드란의 표정에서 모욕감이 번진다. “왕좌가 비어 보였나? 앉기 전에 무릎부터 꿇게 해주지.”'
  }
};
function classReaction(part){const t=CLASS_REACTIONS[part]?.[state.classId];return t?`\n\n${t}`:'';}

// ---------- v0.9: richer scenes / multi-step dialogue ----------
const RICH_TEXT = {
  intro: () => `당신에게는 한때 이름이 있었다.\n\n그 이름을 부르면 문이 열렸고, 누군가는 고개를 숙였고, 누군가는 당신이 돌아오기를 기다렸다. 몰락은 그 모든 것을 한꺼번에 지워버렸다. 변명할 시간도, 짐을 챙길 시간도 없었다.\n\n비가 그친 새벽. 차가운 돌바닥의 습기가 옷 안쪽까지 스며든다. 멀리서 시장을 여는 종소리가 희미하게 들리지만 이 골목에는 빵 냄새보다 젖은 재와 썩은 나무 냄새가 짙다.\n\n당신은 빈민가 끝자락에서 눈을 뜬다. 가진 것은 몸 하나와, 아직 완전히 꺾이지 않은 습관뿐이다.\n\n${earlyClassFlavor('intro')}`,
  beggars: () => `누더기를 걸친 세 사람이 당신을 빙 둘러싼다. 가장 늙은 자는 손에 찌그러진 양철잔을 들고 있고, 아이처럼 마른 청년은 끊임없이 골목 입구를 살핀다.\n\n“살아 있었군.”\n“보아하니 당신도 갈 데 없는 사람 같네.”\n\n그들은 며칠째 자신들을 괴롭히는 깡패가 있다고 말한다. 돈을 빼앗고, 잠자리를 걷어차고, 말을 듣지 않으면 때린다고 한다. 말은 빠르고 억울함은 충분해 보이지만 세 사람 모두 같은 부분에서 묘하게 시선을 피한다.\n\n당신이 어떤 사람인지 묻기도 전에 그들은 당신이 자기들 편일 거라 믿고 있다.\n\n${earlyClassFlavor('beggars')}`,
  gangster: () => `뒷골목 끝. 덩치 큰 남자가 벽에서 등을 떼고 천천히 일어난다. 낡은 외투 아래로 두꺼운 팔이 드러나고, 오른손에는 싸움에 익숙한 굳은살이 잡혀 있다.\n\n“또 너희냐?”\n\n거지들은 약속이라도 한 듯 당신 뒤로 물러선다.\n“저놈이에요. 매일 우릴 괴롭혀요!”\n\n남자의 시선이 거지들에게서 당신에게 옮겨온다. 그는 먼저 덤비지 않는다. 대신 당신이 왜 끼어들었는지 재려는 듯 턱을 조금 든다.${state.flags.gangsterTruth?'\n\n이제 당신은 안다. 이 싸움의 시작은 거지들이 그의 돈주머니에 손을 댄 일이었다.':''}\n\n${earlyClassFlavor('gangster')}`,
  kingdomGate: () => `왕국의 동문은 생각보다 높다. 사람 두세 명이 나란히 걸어도 남을 만큼 넓은 성벽 위로 활을 든 병사들이 오간다. 문 앞에는 장사꾼, 농부, 짐수레가 길게 줄을 서 있다.\n\n당신 차례가 되자 경비병 하나가 창을 가로로 세운다. 갑옷에는 먼지가 묻었고 눈 밑에는 옅은 피로가 내려앉아 있다.\n\n“멈춰. 신분과 목적을 밝혀라.”\n\n그의 말투는 거칠지만 개인적인 악의는 없다. 최근 무언가 때문에 검문이 강해진 모양이다. 성문 너머로는 시장의 고함, 대장간의 쇳소리, 멀리 왕궁의 종이 한꺼번에 섞여 들린다.${classReaction('kingdomGate')}`,
  citySquare: () => `왕국의 중앙가는 전쟁을 앞둔 도시답지 않게 바쁘고 평범하다. 빵집 앞에는 줄이 있고, 세탁물이 창문 사이에서 흔들리고, 장사꾼들은 오늘이 마지막 날이 아닌 것처럼 목청껏 값을 외친다.\n\n하지만 자세히 들으면 평범한 대화의 끝마다 같은 이름이 붙는다. 도적단. 세금. 징발. 친위대. 누군가는 왕국이 자신들을 지켜준다고 말하고, 누군가는 왕국이 먼저 사람들을 숲으로 내몰았다고 낮게 중얼거린다.\n\n${state.flags.gangsterPeace?'시장 한편에서 빈민가에서 보았던 깡패와 닮은 뒷모습이 스쳐 지나간다. 피를 보지 않고 끝낸 작은 사건이 이 넓은 도시 어딘가에도 이어져 있는 듯하다.':''}${state.flags.kingdomHostile?'\n\n그리고 지금은 사람들의 시선이 유난히 당신에게 오래 머문다. 왕국은 이미 당신을 위험한 사람으로 기억하기 시작했다.':''}`,
  captainEnraged: () => `왕궁 앞 대로가 비었다. 상인들은 문을 잠갔고 시민들은 창문을 닫았다. 멀리서 갑옷이 부딪히는 소리가 한 번 들린 뒤, 은빛 갑옷의 남자가 혼자 걸어 나온다.\n\n친위대장 레오른.\n\n그는 당신을 보기 전에 먼저 길 위의 흔적을 본다. 쓰러진 경비, 버려진 무기, 도망친 사람들의 자국. 그러고서야 당신에게 시선을 올린다.\n\n“네가 죽인 사람들의 얼굴을 하나라도 기억하나?”\n\n목소리는 크지 않다. 그래서 더 위험하다. 그의 검은 아직 칼집에 있지만, 손은 이미 손잡이에 놓여 있다.${classReaction('captainEnraged')}`,
  oldVeteran: () => `왕궁으로 오르는 오래된 돌계단 한가운데, 허름한 외투를 입은 노인이 서 있다. 왕궁을 지키는 병사도, 화려한 문장도 없다. 처음 보면 길을 잘못 든 노인처럼 보일 뿐이다.\n\n그러나 이상하다. 바람이 외투 자락을 흔들어도 그의 중심은 조금도 움직이지 않는다. 당신이 한 걸음 옮길 때마다 그의 시선은 발끝이 아니라 어깨와 허리를 따라간다.\n\n“여기까지 왔으면, 네가 뭘 원하는지는 들어봐야겠지.”\n\n노인은 웃지 않는다. 위협하지도 않는다. 그럴 필요가 없는 사람처럼 보인다.${state.flags.oldGuardIdentity?'\n\n당신은 이제 그의 이름을 안다. 아르벤. 오래전 왕국에서 전설처럼 불리던 전 친위대장.':''}${classReaction('oldVeteran')}`,
  kingAudience: () => `왕궁의 알현실은 생각보다 조용하다. 귀족도 시종도 보이지 않는다. 높은 창으로 들어온 빛이 긴 바닥을 반으로 가르고, 그 끝에 왕 에드란이 홀로 앉아 있다.\n\n“네가 무슨 짓을 했는지는 알고 있다.”\n\n왕은 당신을 꾸짖기보다 계산한다. 살려둘 가치와 죽일 위험을 같은 저울에 올리는 눈이다.\n\n“그래도 도적단을 무너뜨릴 힘이 있다면, 한 번은 쓸 수 있겠지.”\n\n명예를 되찾을 기회인지, 목숨을 대신 내놓으라는 명령인지 아직은 알 수 없다.`,
  enlist: () => `친위대 모집소의 책상 위에는 지원서보다 전사자 명단이 더 두껍다. 장교는 당신의 이름과 출신을 확인하다가 한 번 멈춘다. 몰락한 사람을 알아본 눈이다.\n\n하지만 그는 종이를 찢지도, 경비를 부르지도 않는다.\n“과거가 어떻든 상관없다. 지금 필요한 건 도적단을 막을 칼이야.”\n\n막사 안에서는 신병들이 목검을 부딪치고 있다. 어떤 얼굴은 겁에 질렸고, 어떤 얼굴은 전쟁을 아직 모험으로 착각한다. 이들과 함께 싸우면 당신의 이름은 다시 왕국 쪽 기록에 올라갈 것이다.`,
  forestMerchant: () => `숲 초입. 바퀴 하나가 진흙에 빠진 짐수레 옆에서 상인이 욕설을 중얼거린다. 당신을 발견하자 그는 재빨리 웃는 얼굴을 만들지만 손은 허리춤의 작은 칼에서 멀어지지 않는다.\n\n“이 시간에 혼자 숲으로?”\n“물건이 필요하면 돈부터 보여줘. 세상에서 말보다 믿을 만한 게 동전 소리거든.”\n\n수레에는 약품, 밧줄, 건조식량이 가지런히 묶여 있다. 도적이 자주 나온다는 길을 혼자 다니는 상인치고는 지나치게 침착하다. 이름은 로벤. 그는 숲길과 사람값을 모두 잘 아는 사람처럼 보인다.${classReaction('forestMerchant')}`,
  merchantCaptured: () => `해가 기울 무렵, 뒤집힌 짐수레와 부러진 바퀴가 먼저 보인다. 그 뒤 나무에는 로벤이 손이 묶인 채 기대어 있다. 입가에 피가 묻었지만 의식은 또렷하다.\n\n그 앞을 갈고리 모양의 칼을 든 도적단 간부가 지킨다. 주변에는 다른 도적이 없다. 혼자서도 충분하다고 생각하는 모양이다.\n\n“상인 하나 때문에 목숨 걸 생각은 아니겠지?”\n\n로벤은 당신을 보자 도움을 청하는 대신 아주 작게 고개를 젓는다. 덤비기 전에 생각하라는 뜻인지, 자신을 버리고 가라는 뜻인지는 알 수 없다.`,
  officer2: () => `숲을 가르는 돌다리 위. 붉은 모자를 쓴 여자가 난간에 걸터앉아 칼끝으로 돌을 두드리고 있다. 당신이 가까워지자 그녀는 피할 생각 없이 다리 한가운데로 내려선다.\n\n“갈고리를 만났지?”\n그녀의 눈이 당신의 옷과 무기, 상처를 빠르게 훑는다.\n“살아서 여기 왔다는 건 어느 쪽이든 재미있네.”\n\n말투는 가볍지만 위치 선정은 치밀하다. 뒤로 물러나면 좁은 다리, 앞으로 가면 그녀. 대화를 해볼 시간은 있지만 허튼소리를 여러 번 받아줄 사람은 아니다.`,
  guildNovice: () => `숲을 가로지르는 오래된 교역로에서 작은 방패 하나가 길을 막는다. 상인협회의 은빛 문장이 새겨져 있다. 방패 뒤에는 아직 얼굴에 소년 티가 남은 초급 기사가 서 있다.\n\n그는 당신과 도적단 쪽을 번갈아 보며 침을 삼킨다. 겁이 없는 것이 아니라, 겁을 감추는 훈련을 받은 사람이다.\n\n“도적단과 함께 있는 이유를 설명해.”\n\n목소리가 아주 조금 떨린다. 잘 말하면 지나갈 수 있을지도 모르지만, 궁지에 몰면 오히려 규칙대로 검을 뽑을 가능성이 커 보인다.`,
  midKnight: () => `도적단 본거지가 보이기 직전, 숲의 소리가 갑자기 끊긴다. 길 한가운데 검은 망토의 기사가 서 있다. 발밑에는 부러진 화살 몇 개가 떨어져 있고, 방패에는 상인협회의 은빛 문장이 깊게 새겨져 있다.\n\n“초급 기사를 죽인 자가 너구나.”\n\n그는 확인을 요구하지 않는다. 이미 결론을 내리고 여기까지 추적해 온 사람이다. 말할 때조차 시선은 당신의 입이 아니라 손과 발을 본다.\n\n이 사람에게 대화는 화해의 수단이 아니라 당신의 호흡과 습관을 읽을 시간일지도 모른다.`,
  banditBossForest: () => `도적단 본거지 가장 안쪽. 커다란 지도에는 왕국 성벽과 교역로, 세금 수송로가 붉은 실로 이어져 있다. 지도 한가운데 꽂혀 있던 단검을 여자가 뽑는다.\n\n세리아. 숲의 사람들이 두목이라고 부르던 이름이다.\n\n“내 간부들을 죽였든, 친구가 됐든 결국 여기까지 왔네.”\n\n그녀는 당신 뒤에 누가 살아남았는지 이미 알고 있는 눈치다. 단검을 바로 들지는 않는다. 먼저 당신이 어떤 이유로 여기까지 왔는지 알고 싶어 한다.\n\n“그래서 넌 어느 편이지?”${classReaction('banditBossForest')}`,
  friendBridge: () => `왕국과 숲 사이의 오래된 돌다리. 두 세력이 서로를 볼 수 있을 만큼 가깝지만, 아직 활이 닿기에는 먼 거리에서 멈춰 있다.\n\n당신 뒤에는 지금까지 살려둔 사람들의 말이 겹쳐 있다. 세금을 원망한 도적, 습격을 두려워한 시민, 길 하나가 막히면 가족이 굶는다고 했던 상인. 어느 한쪽의 말만 완전히 틀렸다고 하기엔 너무 많은 얼굴을 보았다.\n\n이곳에서 칼을 뽑는 것은 쉽다. 어려운 것은 서로 칼을 들 이유가 남아 있는데도 내려놓게 만드는 일이다.`,
  kingEnraged: () => `왕의 얼굴에서 마지막 계산이 사라진다. 남은 것은 분노다. 왕좌 옆에 세워둔 검을 직접 뽑는 순간, 알현실의 공기가 달라진다.\n\n“내 병사도, 내 백성도, 내 나라까지 네 선택의 장난감이었나?”\n\n에드란은 왕관을 벗어 왕좌 위에 던진다. 이제 앞에 선 사람은 왕의 권위로 싸우지 않는다. 자신이 잃었다고 믿는 모든 것을 대신해 싸운다.\n\n대화를 더 이어갈 수는 있다. 다만 잘못된 말 한마디는 그 분노에 칼날 하나를 더 얹을 것이다.${classReaction('kingEnraged')}`
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
  eliteVark:{end:'바르크는 더 말하지 않는다. 이제 임무로 증명하라는 뜻이다.',steps:[
    {text:`“레오른 대장은 사람을 쉽게 믿지 않는다.” 바르크가 말한다. “특히 한 번 자리에서 밀려난 사람은 더.”\n\n그는 당신을 모욕하려는 게 아니라 자신이 왜 붙었는지 그대로 설명하고 있다.`,on(){encMod().socialPct+=6;}},
    {text:`바르크는 나무껍질에 작은 사선을 긋는다. “우리 정찰대는 이걸 두 개 남겨. 도적은 반대로 긋고.”\n\n숲에서 신호를 읽는 법을 알게 된다.`,on(){state.flags.varkSignal=true;encMod().attackPct+=4;}}
  ]},
  eliteIsel:{end:'이셀은 장부를 덮는다. 더 필요한 말은 전장 뒤에 하자는 표정이다.',steps:[
    {text:`“봉쇄선에서 제일 많이 보는 건 도적이 아니야. 장사 못 해서 돌아가는 상인들이지.” 이셀이 말한다.\n\n왕국의 방어가 누군가에게는 생존로를 막는 벽이라는 사실을 그녀도 알고 있다.`,on(){encMod().socialPct+=7;}},
    {text:`그녀는 전사자 명단과 징발 기록을 한 장씩 넘긴다. “둘 다 숫자로 적히면 편하지. 얼굴을 보면 불편해지고.”\n\n이셀은 왕국 편이지만 왕국의 잘못을 모르는 사람은 아니다.`,on(){state.flags.iselMediation=true;encMod().socialPct+=9;state.stats.secrets++;}}
  ]},
  assaultBram:{end:'브람은 더 설명할 생각이 없다. 이제 길을 비킬지 부딪칠지 고르라고 한다.',steps:[
    {text:`“우린 앞에서 맞는 놈들이야.” 브람이 도끼 등으로 가슴을 두드린다. “뒤에 있는 애들이 도망갈 시간 벌라고.”\n\n돌격병이라는 이름은 공격만 잘해서 붙은 게 아닌 모양이다.`,on(){encMod().attackPct+=3;encMod().socialPct+=5;}},
    {text:`“갈고리가 잡은 상인? 죽이려고 잡은 거 아니야.” 브람이 코웃음 친다. “약이랑 소금 끊긴 게 문제지.”\n\n납치 사건의 목적을 미리 알게 됐다.`,on(){state.flags.bramTradeHint=true;encMod().socialPct+=10;state.stats.secrets++;}}
  ]},
  assaultNera:{end:'네라는 더 묻지 않는다. 당신의 답보다 지금까지 남긴 결과를 믿겠다는 눈이다.',steps:[
    {text:`“세리아는 보고 받을 때 이름보다 생존자부터 물어.” 네라가 말한다. “누가 살아서 돌아왔는지가 제일 정확하거든.”\n\n그녀는 이미 당신이 지나온 길의 일부를 알고 있다.`,on(){encMod().socialPct+=6;}},
    {text:`네라는 목책 안쪽을 바라본다. “살려둔 사람이 많으면 네 말도 길게 듣겠지. 다 죽이고 왔으면… 네가 할 말보다 칼이 빠를 거고.”\n\n세리아와의 만남이 지금까지의 선택을 그대로 반영한다는 걸 확인한다.`,on(){state.flags.neraUnderstands=true;encMod().socialPct+=(state.stats.kills||0)<=3?10:-6;}}
  ]},
  banditScoutRoyal:{end:'정찰병은 더 말하면 임무를 망친다며 입을 다문다.',steps:[
    {text:`정찰병은 목책 너머 왕국 쪽을 힐끗 본다. “우리가 재미로 수레를 터는 줄 알아? 세금 걷고, 겨울 곡식까지 가져간 게 먼저였어.”\n\n말투에는 과장이 섞였지만 왕국 쪽에서 듣지 못한 사정이 있다.`,on(){if(!state.flags.heardBanditSide){state.flags.heardBanditSide=true;state.relation.bandits+=1;}encMod().socialPct+=7;}},
    {text:`“세리아는 왕국 사람 전부를 죽이자는 쪽은 아니야.” 정찰병이 낮게 말한다. “근데 성벽 안쪽은 우리 말 들을 생각이 없지.”\n\n그는 당신이 왕국 편인지 확인하려 하지만, 동시에 싸움을 피할 여지도 남겨둔다.`,on(){state.flags.scoutKnowsTruce=true;encMod().socialPct+=8;encMod().attackPct+=3;}}
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


// ---------- v0.9.4: stat thresholds + dialogue pressure ----------
const TALK_RISKS = {
  gangster:          {safe:3, max:2, social:-5, enemyAtk:1, text:'같은 이야기를 계속 캐묻자 남자의 표정이 굳는다.'},
  kingdomGate:       {safe:2, max:2, social:-8, enemyAtk:1, text:'뒤의 줄이 길어진다. 경비병이 노골적으로 짜증을 낸다.'},
  citizen:           {safe:2, max:1, social:-12, attack:-2, text:'시민은 질문이 지나치다고 느끼고 주변을 살핀다.'},
  captainEnraged:    {safe:2, max:2, social:-8, enemyAtk:2, attack:-2, text:'레오른은 대화를 시간 끌기로 받아들인다. 검을 쥔 손에 힘이 들어간다.'},
  oldVeteran:        {safe:3, max:2, social:-6, enemyAtk:1, text:'아르벤은 더 캐묻는 태도를 시험이 아니라 무례로 받아들인다.'},
  forestMerchant:    {safe:3, max:2, social:-7, text:'로벤이 손바닥을 내민다. “정보도 상품이라고 했지?”'},
  eliteVark:         {safe:2, max:2, social:-7, enemyAtk:1, text:'바르크는 대화를 임무 회피로 받아들이기 시작한다.'},
  eliteIsel:         {safe:2, max:2, social:-6, enemyAtk:1, text:'이셀은 장부를 덮고 판단을 끝내려 한다.'},
  assaultBram:       {safe:2, max:1, social:-7, enemyAtk:1, text:'브람은 말을 길게 끄는 걸 겁으로 받아들인다.'},
  assaultNera:       {safe:2, max:2, social:-9, enemyAtk:1, text:'네라는 이미 충분히 들었다는 듯 창끈을 조인다.'},
  banditScoutRoyal: {safe:2, max:1, social:-8, enemyAtk:1, text:'정찰병이 더는 임무 이야기를 흘릴 생각이 없어 보인다.'},
  merchantCaptured:  {safe:2, max:2, social:-8, enemyAtk:1, text:'갈고리는 협상이 아니라 시간 끌기라고 판단하기 시작한다.'},
  officer2:          {safe:2, max:2, social:-8, enemyAtk:1, text:'붉은 모자의 웃음이 사라진다. 자존심을 건드린 모양이다.'},
  guildNovice:       {safe:2, max:2, social:-10, enemyAtk:1, text:'초급 기사는 말을 더 들을수록 규정대로 처리하려 한다.'},
  midKnight:         {safe:0, max:2, social:-10, enemyAtk:2, attack:-4, text:'중급 기사는 당신이 말하는 동안 호흡과 발버릇을 읽는다.'},
  banditBossForest:  {safe:3, max:2, social:-8, enemyAtk:1, text:'세리아는 결정을 미루는 태도에 인내심을 잃기 시작한다.'},
  banditBossRoyal:   {safe:3, max:2, social:-8, enemyAtk:1, text:'세리아는 결정을 미루는 태도에 인내심을 잃기 시작한다.'},
  kingEnraged:       {safe:1, max:2, social:-9, enemyAtk:2, attack:-2, text:'왕은 더 이어지는 말을 변명으로 받아들인다. 분노가 짙어진다.'}
};

function attackTierBonus(atk=effectiveAttack()){
  atk=Number(atk||0);
  if(atk>=20)return 12;
  if(atk>=16)return 9;
  if(atk>=13)return 6;
  if(atk>=10)return 3;
  return 0;
}
function lowSocialPenalty(v=effectiveSocial()){
  v=Number(v||0);
  if(v<=1)return 20;
  if(v<=3)return 12;
  if(v<=5)return 6;
  return 0;
}
function riskProfile(){
  if(TALK_RISKS[state.sceneId])return TALK_RISKS[state.sceneId];
  if(state.sceneId==='banditBossRoyal')return TALK_RISKS.banditBossForest;
  return null;
}
function applyTalkRisk(forceExtra=false){
  const r=riskProfile(); if(!r)return null;
  const useful=state.talkCount[state.sceneId]||0;
  const nextLevel=(state.talkRisk[state.sceneId]||0)+1;
  const should=forceExtra || useful>Number(r.safe||0);
  if(!should || nextLevel>Number(r.max||2))return null;
  state.talkRisk[state.sceneId]=nextLevel;
  state.stats.overTalks=(state.stats.overTalks||0)+1;
  const m=encMod();
  m.socialPct+=Number(r.social||0);
  m.attackPct+=Number(r.attack||0);
  m.enemyAtk+=Number(r.enemyAtk||0);
  if(nextLevel>=Number(r.max||2)) state.flags['dialogueBurned_'+state.sceneId]=true;
  return {level:nextLevel, text:r.text||'상대가 대화에 지치기 시작한다.'};
}

function richSceneText(sc){
  const r=RICH_TEXT[state.sceneId];
  if(r) return typeof r==='function'?r():r;
  return typeof sc.text==='function'?sc.text():sc.text;
}
function encMod(id=state.sceneId){
  state.encounterMods ||= {};
  if(!state.encounterMods[id]) state.encounterMods[id]={attackPct:0,socialPct:0,attackStat:0,socialStat:0,speed:0,enemyAtk:0,comebackMin:6,revealed:false,usedItems:[],wraithSummoned:false};
  return state.encounterMods[id];
}
function effectiveSpeed(){return Number(state.p?.speed||0)+Number(encMod().speed||0);}
function effectiveAttack(){return Math.max(0,Number(state.p?.atk||0)+Number(encMod().attackStat||0));}
function effectiveSocial(){return Math.max(0,Number(state.p?.social||0)+Number(encMod().socialStat||0));}
function talkProfile(){return TALK_PROFILES[state.sceneId]||(state.sceneId==='banditBossRoyal'?TALK_PROFILES.banditBossForest:null);}
function talkLabel(){
  const p=talkProfile(); if(!p)return '말을 건다';
  const n=state.talkCount[state.sceneId]||0, risk=riskProfile();
  if(n>=p.steps.length){
    const rr=state.talkRisk[state.sceneId]||0;
    if(risk && rr<(risk.max||2)) return '더 묻는다';
    return '더 할 말이 없다';
  }
  const risky=risk && (n+1)>Number(risk.safe||0);
  return risky ? '조심스럽게 더 묻는다' : '대화';
}
function handleTalk(sc){
  const p=talkProfile();
  if(!p){ if(sc.talk)sc.talk(); else toast('상대는 더 말할 생각이 없어 보인다.'); return; }
  const done=state.talkCount[state.sceneId]||0;
  if(done>=p.steps.length){
    const risk=applyTalkRisk(true);
    if(!risk){ queueOutcome(p.end||'더 이어갈 말이 없다.',null); return; }
    state.stats.talkInteractions=(state.stats.talkInteractions||0)+1;
    queueOutcome(`${risk.text}

${p.end||'이제 상대는 결정을 요구한다.'}`,null);
    save(); return;
  }
  const step=p.steps[done];
  bumpTalk(state.sceneId); state.stats.talkInteractions=(state.stats.talkInteractions||0)+1;
  if(step.on)step.on();
  const risk=applyTalkRisk(false);
  queueOutcome(`${step.text}${risk?`

${risk.text}`:''}`,null);
}

const DIALOGUE_EXIT_CHOICES = {
  kingdomGate(){const p=talkProfile();if(!p||(state.talkCount.kingdomGate||0)<p.steps.length)return [];return [c('검문에 끝까지 협조한다','충분히 이야기를 나눈 덕에 경비의 경계가 누그러졌다.',()=>{state.stats.talkSolved++;state.relation.kingdom+=1;resolve('talk','cityEntry','신분과 목적을 솔직하게 설명했다. 경비병은 몇 가지를 더 확인한 뒤 창을 거뒀다.\n\n“들어가. 대신 사고 치지 마.”');})];},
  citizen(){if((state.talkCount.citizen||0)<1)return [];return [c('이야기를 마치고 헤어진다','시민에게서 들은 소문을 기억하고 중앙가로 돌아간다.',()=>{state.stats.talkSolved++;resolve('talk','citySquare','시민은 마지막으로 빵 봉투를 고쳐 들고 시장 안쪽으로 사라졌다.\n\n짧은 대화였지만 왕국 사람들이 무엇을 두려워하는지는 조금 더 선명해졌다.');})];},
  forestMerchant(){if((state.talkCount.forestMerchant||0)<2)return [];return [c('정보를 충분히 들었다고 말한다','로벤을 해치지 않고 숲 안쪽으로 들어간다.',()=>{state.flags.merchantAlive=true;state.relation.merchants+=1;state.stats.talkSolved++;resolve('talk','forestRoad','로벤은 수레 고삐를 다시 잡는다.\n\n“살아서 또 보자고. 그게 상인한텐 제일 좋은 거래니까.”\n\n당신은 그가 알려준 길을 따라 숲 안쪽으로 향한다.');})];},
  merchantCaptured(){
    if((state.talkCount.merchantCaptured||0)<2||!state.flags.merchantBalancedView)return [];
    const cost=state.classId==='noble'?6:12;
    return [c(`갈고리와 로벤의 거래를 중재한다 · ◆ ${cost}`, '',()=>{
      if(!spendGold(cost)){queueOutcome(`중재안을 내놓았지만 거래를 메울 골드가 부족하다. 필요한 골드: ${cost}`,null);return;}
      state.flags.merchantAlive=true;state.flags.merchantRescuedPeace=true;state.flags.officer1Allied=true;
      state.relation.bandits+=2;state.relation.merchants+=2;state.stats.talkSolved++;
      resolve('talk','officer2',`당신이 손실 일부를 메우고, 로벤이 겨울 물자를 다시 공급하는 조건으로 거래를 묶었다.\n\n갈고리는 칼을 내리고 로벤의 밧줄을 끊는다. 로벤은 투덜거리지만 약속을 부정하지 않는다.\n\n당신이 낸 돈만큼, 두 사람 사이의 칼날도 조금 멀어졌다.`);
    })];
  },
  guildNovice(){if((state.talkCount.guildNovice||0)<2||!state.flags.merchantAlive||state.flags.merchantKilled)return [];return [c('로벤에게 확인하라고 한다','살려둔 상인이 당신의 말에 신빙성을 더한다.',()=>{state.stats.talkSolved++;state.relation.merchants+=2;resolve('talk','forestBeforeBoss','초급 기사는 한참 망설이다 검을 내린다.\n\n“로벤이 살아 있다면 확인하겠다. 하지만 도적단 편에 완전히 서지는 마.”\n\n싸움 없이 교역로를 통과했다.');})];}
};
function dialogueExitChoices(){const f=DIALOGUE_EXIT_CHOICES[state.sceneId];return f?f():[];}
function encounterStatusHtml(){ return ''; }

// ---------- Rendering / UI ----------
const $ = (id) => document.getElementById(id);
const screens = ['menuScreen','classScreen','gameScreen','endScreen'];

function showScreen(id) {
  for (const s of screens) $(s).classList.toggle('active', s === id);
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderClasses() {
  $('classGrid').innerHTML = Object.entries(CLASSES).map(([id,cl]) => {
    const unlocked=isClassUnlocked(id);
    const unlockText=classUnlockText(id);
    return `
    <article class="class-card ${unlocked?'':'locked'}">
      <div class="class-head"><div class="class-name">${unlocked?'':'🔒 '}${cl.name}</div><span class="tag">${unlocked?'선택 가능':unlockText}</span></div>
      <div class="stats-row">
        ${statBox('체력',cl.hp)}${statBox('공격',cl.atk)}${statBox('처세',cl.social)}${statBox('속도',cl.speed)}
      </div>
      <div class="passive"><strong>${unlocked?cl.passive:'???'}</strong><br>${unlocked?cl.desc:`노말 엔딩을 더 보면 기억이 열린다.`}</div>
      <button class="btn ${unlocked?'primary':''}" ${unlocked?'':'disabled'} onclick="selectClass('${id}')">${unlocked?'이 직업으로 시작':'잠김'}</button>
    </article>`;
  }).join('');
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
  const classExtra=state.classId==='necromancer'?` · 시체 ${state.stats.corpses||0}`:state.classId==='dictator'?` · 독재 ${state.stats.tyranny||0}`:state.classId==='merchant'?` · 장사 ${state.stats.merchantIncome||0}`:'';
  $('hudStats').textContent = `처세 ${state.p.social} · 속도 ${state.p.speed} · 진행 ${state.stats.progress}${classExtra}`;

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
    $('attackInfo').textContent = `승률 ${attackChance(enemy)}%`;
    $('talkInfo').textContent=talkLabel();
    const classSocialBlocked=state.classId==='spellsword';
    $('socialInfo').textContent = classSocialBlocked ? '사용할 수 없다' : sc.socialDisabled ? '통하지 않는다' : state.socialUsed[socialUseKey()] ? '이미 시도했다' : `성공 ${socialChance(enemy,sc)}%`;
    const rc = runChance(enemy);
    const runAlreadyUsed=escapeWasUsed();
    $('runInfo').textContent = runLabel(enemy, rc);
    const socialBtn = document.querySelector('[data-game-action="social"]');
    socialBtn.classList.toggle('locked-action', !!sc.socialDisabled || state.classId==='spellsword');
    socialBtn.classList.toggle('used', !!state.socialUsed[socialUseKey()]);
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
  if(enemy){
    const usable=state.inventory.filter(n=>ITEMS[n]?.encounter||ITEMS[n]?.heal||ITEMS[n]?.persistent).length;
    $('encounterItemInfo').textContent=usable?`${usable}개 보유`:'사용할 물품이 없다';
    const wraithBtn=$('necromancerSkillBtn');
    if(wraithBtn){
      const m=encMod(); const corpses=Number(state.stats.corpses||0);
      const show=state.classId==='necromancer';
      wraithBtn.classList.toggle('hidden',!show);
      wraithBtn.disabled=!show||corpses<=0||!!m.wraithSummoned;
      const info=$('necromancerSkillInfo');if(info)info.textContent=m.wraithSummoned?'이미 소환했다':`시체 ${corpses}`;
    }
  }
  $('sceneCard').classList.toggle('deep-dialogue', !!talkProfile() && (state.talkCount[state.sceneId]||0)>0);
  $('sceneCard').classList.toggle('aftermath-dead',['undertaker','grave'].includes(sc.art));
  $('sceneCard').classList.toggle('aftermath-trail',['tracker','trail'].includes(sc.art));
  $('choiceArea').innerHTML = choices.filter(Boolean).map((x,i)=>`<button class="choice-btn" data-choice="${i}"><b>${escapeHtml(x.label)}</b></button>`).join('');
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
    forest:['#111d18','#284b36','#78975d'], capture:['#151e19','#3b4939','#a65a3b'], officer:['#231b1d','#5a3037','#bd614e'], guild:['#1d2327','#45535d','#a9b9c2'], midknight:['#171b20','#36424f','#bdc8d4'],crossroad:['#1b1e20','#45413d','#b49663'],undertaker:['#17191d','#3a3c40','#b8b1a4'],tracker:['#151c1d','#31484a','#8eb3ad'],grave:['#151719','#34363a','#8b8f92'],trail:['#121918','#2d403b','#789b8c']
  };
  const p = palettes[kind] || palettes.exile;
  const moon = ['forest','bandits','banditcamp','capture','officer','boss','crossroad'].includes(kind);
  const castle = ['gate','city','alarm','captain','oldguard','king','kingrage','barracks','rebel'].includes(kind);
  const figures = ['beggars','gangster','citizen','captain','oldguard','boss','merchant','officer','guild','midknight','king','kingrage','undertaker','tracker'].includes(kind);
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
  const cl=CLASSES[id]; if(!cl || !isClassUnlocked(id)) return;
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
  const atk=effectiveAttack();
  const mine=Math.max(1,state.p.hp*atk), theirs=Math.max(1,enemy.hp*enemy.atk);
  return clamp(Math.round(mine/(mine+theirs)*100)+attackTierBonus(atk)+Number(m.attackPct||0),3,97);
}
function socialChance(enemy,sc) {
  const m=encMod();
  const social=effectiveSocial();
  let chance=Math.round((Math.max(0,social)/(Math.max(0,social)+Math.max(1,enemy.social)))*100);
  if(state.classId==='noble') chance+=14;
  chance-=lowSocialPenalty(social);
  chance-=sc.socialPenalty||0;
  chance+=Number(m.socialPct||0);
  if(state.flags.gangsterTruth && state.sceneId==='gangster') chance+=16;
  if(state.sceneId==='banditScoutRoyal' && state.flags.varkBriefing) chance+=7;
  if(['banditBossRoyal','banditBossForest'].includes(state.sceneId) && state.flags.iselMediation) chance+=6;
  if(['merchantCaptured','officer1Angry'].includes(state.sceneId) && state.flags.bramTradeHint) chance+=10;
  if(['banditBossRoyal','banditBossForest'].includes(state.sceneId)){if(state.flags.neraVouched)chance+=9;if(state.flags.assaultNeraKilled)chance-=9;}
  return clamp(chance,1,95);
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
  if(escapeWasUsed()) return '이미 시도했다';
  if(chance===100) return '반드시 성공';
  if(chance===0) return '도망 불가';
  return `성공 ${chance}%`;
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
  eliteVark:         {to:'kingdomEscape', text:'감시역과 임무를 버리고 왕국 외곽으로 빠져나왔다.', before(){state.flags.desertedRoyal=true;}},
  eliteIsel:         {to:'forestRoad', text:'봉쇄선을 피해 숲길로 이탈했다.', before(){state.flags.desertedRoyal=true;}},
  banditScoutRoyal:  {to:'citySquare', text:'정찰 임무를 포기하고 왕국으로 돌아왔다.'},
  banditScoutCornered:{to:'citySquare',text:'지원 신호가 울리기 전에 왕국 쪽으로 후퇴했다.'},
  banditBossRoyal:   {to:'banditTruce', text:'세리아와의 결판을 미뤘다. 전쟁은 아직 끝나지 않았다.'},
  banditBossAngry:   {to:'banditTruce', text:'세리아의 칼을 피해 본거지 밖으로 빠져나왔다.'},
  captainRebel:      {to:'rebelRetreat', text:'반란군의 진격에서 이탈해 후퇴로로 빠졌다.', before(){state.flags.rebellionRetreated=true;}},
  kingEnraged:       {to:'rebelRetreat', text:'왕과의 마지막 결판을 포기하고 전장을 이탈했다.', before(){state.flags.rebellionRetreated=true;state.flags.escapedKing=true;}},
  forestMerchant:    {to:'forestRoad', text:'로벤을 지나쳐 숲 안쪽으로 들어갔다.', before(){state.flags.merchantAlive=true;}},
  assaultBram:       {to:()=>state.flags.merchantAlive?'merchantCaptured':'officer2', text:'브람의 돌진을 피해 더 깊은 숲으로 달아났다.'},
  merchantCaptured:  {to:'officer2', text:'로벤을 남겨두고 도적단의 시야에서 빠져나왔다.', before(){state.flags.merchantAbandoned=true;}},
  officer1Angry:     {to:'officer2', text:'상인을 두고 도망쳐 다음 갈림길까지 달렸다.', before(){state.flags.merchantAbandoned=true;}},
  officer2:          {to:'banditCampLife', text:'돌다리를 돌아 우회해 도적단 야영지 외곽으로 이동했다.'},
  officer2Angry:     {to:'banditCampLife', text:'돌다리를 버리고 숲을 가로질러 야영지 외곽으로 빠졌다.'},
  assaultNera:       {to:'friendBridge', text:'네라의 관문을 버리고 숲을 빠져나와 오래된 다리까지 달아났다.'},
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
    queueOutcome('길이 끊겼다. 잠시 숨을 고른다.',null);
    return;
  }
  if(route.before) route.before();
  const target=typeof route.to==='function'?route.to():route.to;
  if(!target || !SCENES[target] || target===state.sceneId){
    console.error('[ESCAPE] invalid target',state.sceneId,target);
    queueOutcome('앞길이 막혔다. 더 나아갈 수 없다.',null);
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
    if(state.classId==='spellsword'){toast('마검사는 처세하지 않는다.');return;}
    const socialKey=socialUseKey();
    if(sc.socialDisabled || state.socialUsed[socialKey]) return;
    state.socialUsed[socialKey]=true;
    const chance=socialChance(enemy,sc);
    if(Math.random()*100<chance){state.stats.socialSuccess++;if(state.classId==='dictator')gainTyranny('social');fx('good');floatText('처세 성공');if(sc.socialSuccess)sc.socialSuccess();else resolve('social',null,'처세에 성공했다.');}
    else {state.stats.socialFail++;fx('bad');floatText('처세 실패');if(sc.socialFail)sc.socialFail();else {toast('처세에 실패했다. 같은 방법은 다시 통하지 않는다.','bad');render();save();}}
    return;
  }
  if(type==='run') {
    if(escapeWasUsed()) return;
    const chance=runChance(enemy);
    if(chance<=0) return;
    // 한 조우에서 도주 판정은 딱 한 번만 한다.
    setEscapeUsed();
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
function gainTyranny(source){
  state.stats.tyranny=Number(state.stats.tyranny||0)+1;
  const current=Math.floor(state.stats.tyranny/10);
  const claimed=Number(state.flags.tyrannyMilestones||0);
  if(current>claimed){
    state.flags.tyrannyMilestones=current;
    if(source==='social'){
      state.p.social+=8;
      floatText('처세 +8');
      state.lastToast='사람을 굴복시키는 방식이 더 노골적으로 다듬어졌다. 처세 +8';
    }else{
      state.p.atk+=8;
      floatText('공격력 +8');
      state.lastToast='저항을 꺾을수록 힘의 격차가 벌어진다. 공격력 +8';
    }
  }
}
function applyClassKillReward(){
  if(state.classId==='spellsword'){
    const amount=Math.max(1,Math.ceil(state.p.maxHp*0.2));
    const before=state.p.hp; heal(amount,false);
    if(state.p.hp>before)floatText(`흡혈 +${state.p.hp-before}`);
  }else if(state.classId==='necromancer'){
    state.stats.corpses=Number(state.stats.corpses||0)+1;
    floatText('시체 +1');
  }else if(state.classId==='dictator'){
    gainTyranny('kill');
  }
}
function summonWraith(){
  if(state.classId!=='necromancer'||battleBusy||state.pending)return;
  const sc=SCENES[state.sceneId];if(!getEnemy(sc))return;
  const m=encMod();
  if(m.wraithSummoned){toast('이 조우에는 이미 망령이 붙어 있다.');return;}
  if(Number(state.stats.corpses||0)<=0){toast('불러낼 시체가 없다.');return;}
  state.stats.corpses--;
  m.wraithSummoned=true;
  m.attackPct=clamp(Number(m.attackPct||0)+12,-30,35);
  m.enemyAtk=clamp(Number(m.enemyAtk||0)-2,-8,8);
  state.lastToast='차가운 그림자가 당신 옆에 일어선다. 상대의 시선이 갈라진다.';
  floatText('망령 소환');save();render();
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
      finishBattleWin(sc,enemy,chance,true,roll);
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
function finishBattleWin(sc,enemy,chance,comeback,comebackRoll=null){
  if(chance<=35)state.stats.riskyWins++;
  if(comeback){state.stats.comebackWins=(state.stats.comebackWins||0)+1; state.stats.riskyWins++;}
  const base=comeback?0.22:0.08;
  const spread=comeback?0.20:0.18;
  const dmg=Math.min(Math.max(0,Math.floor(enemy.atk*(base+Math.random()*spread))),Math.max(0,state.p.hp-1));
  if(dmg>0){state.p.hp-=dmg;floatText(`HP -${dmg}`);}
  state.stats.kills++; if(enemy.elite)state.stats.eliteKills++;
  applyClassKillReward();
  hideBattleOverlay(); battleBusy=false;
  const prefix=comeback?`주사위가 ${comebackRoll??6}에 멈췄다. 끝났던 승부가 뒤집혔다.${dmg?`\n체력 ${dmg}을 잃었다.`:''}\n\n`:'';
  if(sc.attackWin){
    if(comeback){state.lastToast=prefix.trim();}
    sc.attackWin();
    if(comeback && state.lastToast && !state.lastToast.startsWith('주사위가 ')) state.lastToast=prefix+state.lastToast;
  } else resolve('attack',null,prefix+'전투에서 승리했다.');
  save(); render();
}

function resolve(method,next,msg,ending=null) {
  state.stats.progress++;
  markEncounterResolution(method,next,ending,false);
  if(state.classId==='knight' && method!=='social' && method!=='run') { state.p.atk++; msg += '\n\n물러서지 않았다. 칼끝이 조금 더 단단해졌다. 공격력 +1'; floatText('공격력 +1'); }
  queueOutcome(msg||'행동의 결과가 정해졌다.', next, ending);
}
function queueOutcome(msg,next=null,ending=null) {
  if(next||ending)markEncounterResolution('talk',next,ending,true);
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
function go(id, msg='') { if(!SCENES[id])return; state.pending=null; if(maybeReplaceResolvedEncounter(id))return; const changed=id!==state.sceneId; if(changed&&state.encounterMods)delete state.encounterMods[state.sceneId]; if(changed){state.escapeAttempted=false;state.escapeSerial=(state.escapeSerial||0)+1;} state.sceneId=id; state.lastToast=msg; state.stats.progress++; save(); enter(id); }
function enter(id) {
  showScreen('gameScreen');
  if(maybeReplaceResolvedEncounter(id))return;
  const sc=SCENES[id];
  merchantEncounterProfit(id);
  if(!state.entered[id]){state.entered[id]=true;if(sc.onFirstEnter)sc.onFirstEnter();}
  save();render();
}
function gainGold(v){v=Math.max(0,Math.floor(v));state.p.gold+=v;state.stats.goldEarned+=v;if(v)floatText(`◆ +${v}`);}
function spendGold(v){if(state.p.gold<v)return false;state.p.gold-=v;state.stats.goldSpent+=v;return true;}
function addItem(name,count=1){for(let i=0;i<count;i++)state.inventory.push(name);}
function heal(v,visual=true){const before=state.p.hp;state.p.hp=Math.min(state.p.maxHp,state.p.hp+v);if(visual&&state.p.hp>before)floatText(`HP +${state.p.hp-before}`);}
function damagePlayer(v,canDie=true){state.p.hp-=v;if(state.p.hp<=0){state.p.hp=0;if(canDie)die('상처를 버티지 못하고 쓰러졌다.');else state.p.hp=1;}}
function gainStat(kind,amount=1){amount=Math.max(1,Math.floor(amount));if(kind==='hp'){state.p.maxHp+=amount;state.p.hp+=amount;floatText(`최대 HP +${amount}`);}else if(kind==='atk'){state.p.atk+=amount;floatText(`공격력 +${amount}`);}else if(kind==='social'){state.p.social+=amount;floatText(`처세 +${amount}`);}else if(kind==='speed'){state.p.speed+=amount;floatText(`속도 +${amount}`);}state.stats.growths=(state.stats.growths||0)+amount;save();}
function takeGrowth(flag,kind,msg,next=null){if(state.flags[flag]){if(next)go(next);return;}state.flags[flag]=true;gainStat(kind,1);state.stats.progress++;queueOutcome(msg,next);}
function softKillCount(){
  return ['gangsterKilled','citizenKilled','merchantKilled','guardKilled','guardResponseKilled'].filter(f=>state.flags[f]).length;
}
function bloodyMediatorEligible(){
  const soft=softKillCount();
  const hardKill=state.flags.captainKilled||state.flags.eliteVarkKilled||state.flags.eliteIselKilled||state.flags.officer1Killed||state.flags.officer2Killed||state.flags.assaultBramKilled||state.flags.assaultNeraKilled||state.flags.noviceKilled||state.flags.midKnightKilled||state.flags.banditBossKilled;
  return soft>=1 && soft<=3 && !hardKill && !!state.flags.merchantRescuedPeace && !!state.flags.merchantBalancedView && !!state.flags.friendTalkOpen && state.relation.kingdom>=3 && state.relation.bandits>=3 && state.relation.merchants>=3 && (state.stats.socialSuccess||0)>=4 && (state.stats.secrets||0)>=2 && !state.flags.rebel;
}
function specialEndingFor(baseName){
  const s=state.stats||{};
  if(baseName==='모두와 친구' && bloodyMediatorEligible()) return '피 묻은 중재자';
  if(baseName==='명예 회복' && softKillCount()>=1 && (s.socialSuccess||0)>=3 && (s.talkSolved||0)>=2) return '위선적인 영웅';
  if(baseName==='반란' && state.flags.enlisted && state.flags.rebel) return '두 개의 깃발';
  return baseName;
}
function friendEndingCheck(loose=false){
  const missing=[];
  const coreKills=state.flags.gangsterKilled||state.flags.citizenKilled||state.flags.guardKilled||state.flags.guardResponseKilled||state.flags.captainKilled||state.flags.eliteVarkKilled||state.flags.eliteIselKilled||state.flags.officer1Killed||state.flags.officer2Killed||state.flags.assaultBramKilled||state.flags.assaultNeraKilled||state.flags.noviceKilled||state.flags.midKnightKilled||state.flags.banditBossKilled||state.flags.merchantKilled;
  if(coreKills)missing.push('핵심 인물 살해 없이 진행');
  if(!state.flags.gangsterPeace)missing.push('빈민가 사건을 화해로 해결');
  if(!state.flags.citizenView)missing.push('왕국 시민의 속사정까지 듣기');
  if(!state.flags.merchantAlive||state.flags.merchantAbandoned)missing.push('로벤을 살리고 버리지 않기');
  if(!state.flags.merchantRescuedPeace)missing.push('갈고리와 거래를 중재해 로벤을 평화적으로 구출');
  if(!state.flags.merchantBalancedView)missing.push('로벤에게 양쪽 세력의 사정을 듣기');
  if(!state.flags.friendTalkOpen)missing.push('세리아와 충분히 대화해 협상 가능성 열기');
  if(state.relation.kingdom<4)missing.push(`왕국 신뢰 4 이상 (${state.relation.kingdom}/4)`);
  if(state.relation.bandits<4)missing.push(`도적단 신뢰 4 이상 (${state.relation.bandits}/4)`);
  if(state.relation.merchants<3)missing.push(`상인 신뢰 3 이상 (${state.relation.merchants}/3)`);
  if((state.stats.socialSuccess||0)<3)missing.push(`처세 성공 3회 이상 (${state.stats.socialSuccess||0}/3)`);
  if((state.stats.secrets||0)<2)missing.push(`핵심 정보 2개 이상 (${state.stats.secrets||0}/2)`);
  const risky=(state.stats.overTalks||0);
  if(risky>2)missing.push(`과대화 2회 이하 (${risky}/2)`);
  if(state.flags.dialogueBurned_banditBossForest||state.flags.dialogueBurned_banditBossRoyal||state.flags.dialogueBurned_kingdomGate)missing.push('핵심 협상 상대의 인내심을 완전히 소진하지 않기');
  if(state.flags.rebel)missing.push('왕국 공격에 완전히 가담하지 않기');
  if(!loose && state.flags.kingdomHostile)missing.push('왕국의 공식 적대 상태 해소');
  return {ok:missing.length===0,missing};
}
function canFriendEnding(loose=false){const c=friendEndingCheck(loose);return c.ok||bloodyMediatorEligible();}
function friendEndingHint(loose=false){
  const c=friendEndingCheck(loose);
  if(c.ok)return '양쪽 모두 당신의 말을 들을 준비가 되어 있다.';
  if(bloodyMediatorEligible())return '완전한 우정은 멀어졌지만, 아직 전쟁을 멈출 길은 남아 있다.';
  const hints=[];
  if(!state.flags.gangsterPeace||!state.flags.citizenView) hints.push('왕국에서 풀지 못한 매듭이 남아 있다.');
  if(!state.flags.merchantAlive||state.flags.merchantAbandoned||!state.flags.merchantRescuedPeace) hints.push('숲의 상인과 도적 사이에 빚이 남아 있다.');
  if(!state.flags.friendTalkOpen) hints.push('세리아는 아직 당신을 믿지 않는다.');
  if(state.relation.kingdom<4||state.relation.bandits<4||state.relation.merchants<3) hints.push('어느 쪽도 당신에게 등을 맡길 만큼 믿지는 않는다.');
  if((state.stats.overTalks||0)>2) hints.push('말이 너무 많았다. 몇 사람은 이미 마음을 닫았다.');
  if(state.flags.rebel) hints.push('이미 한쪽 깃발 아래 너무 멀리 와 버렸다.');
  return hints.slice(0,2).join('\n') || '아직 때가 아니다.';
}

function recordClearForUnlock(name,e){
  if(e?.bad || String(e?.kind||'').startsWith('BAD END'))return [];
  const meta=loadMeta();
  const runId=String(state.runId||'');
  if(runId && meta.awardedRuns.includes(runId))return [];
  const before=Object.keys(CLASS_UNLOCK_CLEAR_REQUIREMENTS).filter(isClassUnlocked);
  meta.normalClears=Math.max(0,Number(meta.normalClears||0))+1;
  if(!meta.endings.includes(name))meta.endings.push(name);
  if(runId)meta.awardedRuns.push(runId);
  meta.awardedRuns=meta.awardedRuns.slice(-100);
  saveMeta(meta);
  const after=Object.keys(CLASS_UNLOCK_CLEAR_REQUIREMENTS).filter(isClassUnlocked);
  return after.filter(x=>!before.includes(x)).map(x=>CLASSES[x].name);
}

function finish(name) {
  if(state.ended)return;
  name=specialEndingFor(name);
  state.ended=true; state.stats.ending=name;
  state.stats.survivors = ['merchantAlive','gangsterPeace'].filter(f=>state.flags[f]).length + (!state.flags.citizenKilled?1:0) + (!state.flags.captainKilled?1:0);
  const e=endingProfile(name);
  state.stats.endingBonus=Number(e.bonus||0);
  const newlyUnlocked=recordClearForUnlock(name,e);
  state.flags.newClassUnlocks=newlyUnlocked;
  save();
  $('endingArt').classList.toggle('bad-ending-art', !!e.bad);
  $('endingArt').innerHTML=e.art ? art(e.art) : `<span class="ending-glyph">${escapeHtml(e.icon||'†')}</span>`;
  $('endKind').textContent=e.kind;$('endTitle').textContent=name;$('endEpilogue').textContent=e.epilogue;
  $('playStyle').textContent=`플레이 스타일 · ${playStyle()}`;
  $('endScore').textContent=clientScore().toLocaleString();
  const deathBlock=e.bad&&state.flags.deathReason?`<b>최후의 순간</b> · ${escapeHtml(state.flags.deathReason)}<br><b>사망 장소</b> · ${escapeHtml(SCENES[state.flags.deathScene]?.location||'알 수 없는 장소')}<br><br><br>`:'';
  $('endStats').innerHTML=`${deathBlock}진행도 <b>${state.stats.progress}</b><br>처치 <b>${state.stats.kills}</b> · 강적 <b>${state.stats.eliteKills}</b><br>대화 해결 <b>${state.stats.talkSolved}</b> · 처세 성공 <b>${state.stats.socialSuccess}</b> · 실패 <b>${state.stats.socialFail}</b><br>도망 성공 <b>${state.stats.runSuccess}</b> · 역전승 <b>${state.stats.comebackWins||0}</b> · 비밀 발견 <b>${state.stats.secrets}</b><br>성장 횟수 <b>${state.stats.growths||0}</b> · 대화 횟수 <b>${state.stats.talkInteractions||0}</b> · 과대화 <b>${state.stats.overTalks||0}</b> · 아이템 사용 <b>${state.stats.itemsUsed||0}</b><br>획득 골드 <b>${state.stats.goldEarned}</b> · 남은 골드 <b>${state.p.gold}</b>${state.classId==='merchant'?`<br>장사 수익 <b>${state.stats.merchantIncome||0}</b> · 새 조우 <b>${state.stats.merchantDeals||0}</b>`:''}`;
  const meta=loadMeta();
  if(!e.bad){
    const unlockLine=state.flags.newClassUnlocks?.length?`<br><br><b>새 직업 해금 · ${state.flags.newClassUnlocks.map(escapeHtml).join(' / ')}</b>`:`<br><br>노말 엔딩 <b>${meta.normalClears}회</b>`;
    $('endStats').innerHTML+=unlockLine;
  }
  resetRankSubmitUI();
  fx(e.bad?'bad':'good');showScreen('endScreen');
}
function die(reason){
  state.p.hp=0;
  const profile={...badEndingForCurrentScene(),bad:true};
  state.flags.deathReason=reason;
  state.flags.deathScene=state.sceneId;
  state.flags.deathEnemy=getEnemy(SCENES[state.sceneId])?.name||'';
  state.flags.deathEnding=profile;
  state.lastToast=reason;
  finish(profile.title);
}
function playStyle(){
  const s=state.stats;
  const pairs=[['전투광',s.kills*3+s.riskyWins*2],['협상가',s.socialSuccess*3+s.talkSolved],['생존가',s.runSuccess*4],['탐색가',s.secrets*5+s.talkSolved],['장사꾼',(s.merchantDeals||0)*4+Math.floor((s.merchantIncome||0)/5)],['파괴자',s.eliteKills*5+s.kills]];
  pairs.sort((a,b)=>b[1]-a[1]);return pairs[0][1]===0?'방랑자':pairs[0][0];
}
function clientScore(){const s=state.stats,b=Number(endingProfile(s.ending)?.bonus||s.endingBonus||0);return Math.max(0,Math.floor(s.progress*115+s.goldEarned*3+state.p.gold*1.2+s.kills*170+s.eliteKills*950+s.riskyWins*650+(s.comebackWins||0)*900+s.talkSolved*170+s.socialSuccess*185+s.runSuccess*85+s.secrets*500+(s.growths||0)*140+s.survivors*220-s.socialFail*25-(s.overTalks||0)*90+b));}

// ---------- Merchant class economy ----------
function merchantEncounterProfit(id=state.sceneId){
  if(state.classId!=='merchant'||!state.p)return 0;
  const sc=SCENES[id]; if(!getEnemy(sc))return 0;
  state.world ||= worldShape(); state.world.merchantPaid ||= {};
  const key=encounterKey(id);
  if(state.world.merchantPaid[key])return 0;
  state.world.merchantPaid[key]=true;
  const amount=Math.max(1,Math.floor(state.p.maxHp));
  state.stats.merchantDeals=Number(state.stats.merchantDeals||0)+1;
  state.stats.merchantIncome=Number(state.stats.merchantIncome||0)+amount;
  gainGold(amount);
  state.lastToast=`사람을 만나면 먼저 값이 보인다. 거래의 틈에서 ◆ ${amount}을 챙겼다.`;
  return amount;
}
function shopPrice(base){
  base=Math.max(1,Math.floor(Number(base)||1));
  return state.classId==='merchant'?Math.max(1,Math.ceil(base*0.75)):base;
}

// ---------- Inventory / shop ----------
const ITEMS = {
  '붕대':{heal:3,kind:'회복',desc:'체력 3 회복.'},
  '고급 붕대':{heal:5,kind:'회복',desc:'체력 5 회복.'},
  '상인의 물약':{heal:999,kind:'회복',desc:'체력을 완전히 회복한다.'},
  '철제 부적':{persistent:true,kind:'영구',desc:'사용 즉시 최대 체력 +2.',apply(){state.p.maxHp+=2;state.p.hp+=2;floatText('최대 HP +2');}},
  '강심제':{encounter:true,kind:'조우',desc:'공격력 +2.',apply(m){m.attackStat=clamp((m.attackStat||0)+2,0,6);}},
  '은빛 브로치':{encounter:true,kind:'조우',desc:'처세 +2.',apply(m){m.socialStat=clamp((m.socialStat||0)+2,0,6);}},
  '경량 장화끈':{encounter:true,kind:'조우',desc:'속도 +2.',apply(m){m.speed=clamp((m.speed||0)+2,0,8);}},
  '연막탄':{encounter:true,kind:'조우',desc:'속도 +5.',apply(m){m.speed=clamp((m.speed||0)+5,0,10);}},
  '독병':{encounter:true,kind:'조우',desc:'상대의 음료나 상처에 독을 묻힌다. 현재 조우에서 적 공격력 -3.',apply(m){m.enemyAtk=clamp((m.enemyAtk||0)-3,-8,8);}},
  '관찰자의 렌즈':{encounter:true,kind:'조우',desc:'상대의 약점을 읽어 현재 조우 공격 승률 +10%.',apply(m){m.attackPct=clamp((m.attackPct||0)+10,-30,35);m.revealed=true;}},
  '행운의 동전':{encounter:true,kind:'조우',desc:'역전 주사위 5~6 성공.',apply(m){m.comebackMin=Math.min(m.comebackMin||6,5);}},
  '뇌물 봉투':{encounter:true,kind:'조우',desc:'상대가 돈에 흔들릴 여지를 만든다. 현재 조우 처세 성공률 +20%.',apply(m){m.socialPct=clamp((m.socialPct||0)+20,-30,40);}}
};
const SHOP = [
  {name:'붕대',cost:8},{name:'고급 붕대',cost:16},{name:'강심제',cost:20},{name:'은빛 브로치',cost:20},
  {name:'경량 장화끈',cost:18},{name:'연막탄',cost:26},{name:'독병',cost:28},{name:'관찰자의 렌즈',cost:30},{name:'행운의 동전',cost:34},{name:'뇌물 봉투',cost:24},
  {name:'든든한 식사',cost:20,desc:'최대 체력 +1, 체력 완전 회복',buy(){state.p.maxHp++;state.p.hp=state.p.maxHp;floatText('최대 HP +1');}},
  {name:'숫돌',cost:26,desc:'공격력 영구 +1',buy(){state.p.atk++;floatText('공격력 +1');}}
];
function openShop(){
  const discount=state.classId==='merchant'?'<div class="modal-sub">장사꾼의 재능 · 모든 가격 25% 할인</div>':'';
  $('modal').innerHTML=`<h2>상점</h2><div class="modal-sub">◆ ${state.p.gold}</div>${discount}${SHOP.map((x,i)=>{const price=shopPrice(x.cost);return `<div class="shop-row"><div class="item-copy"><b>${x.name}${ITEMS[x.name]?`<span class="item-kind">${ITEMS[x.name].kind}</span>`:''}</b><small>${x.desc||ITEMS[x.name]?.desc||''}</small></div><button class="shop-btn" data-buy="${i}">◆ ${price}${price<x.cost?` <s>${x.cost}</s>`:''}</button></div>`;}).join('')}<button class="btn modal-close" onclick="closeModal()">나간다</button>`;
  showModal();document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const x=SHOP[Number(b.dataset.buy)];const price=shopPrice(x.cost);if(!spendGold(price)){toast('골드가 부족하다.','bad');return;}if(x.buy)x.buy();else addItem(x.name);save();openShop();render();});
}
function inventoryCounts(){const counts={};for(const x of state.inventory)counts[x]=(counts[x]||0)+1;return counts;}
function openBag(){
  const rows=Object.entries(inventoryCounts());
  $('modal').innerHTML=`<h2>가방</h2>${rows.length?rows.map(([nm,count])=>{const it=ITEMS[nm];const can=!!(it?.heal||it?.persistent);return `<div class="bag-row ${can?'':'item-disabled'}"><div class="item-copy"><b>${nm} × ${count}${it?`<span class="item-kind">${it.kind}</span>`:''}</b><small>${itemDesc(nm)}</small></div><button class="shop-btn" data-use="${escapeAttr(nm)}" ${can?'':'disabled'}>${can?'사용':'조우용'}</button></div>`}).join(''):'<p class="modal-sub">아무것도 없다.</p>'}<button class="btn modal-close" onclick="closeModal()">닫기</button>`;
  showModal();document.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>useItem(b.dataset.use,false));
}
function openEncounterItems(){
  if(battleBusy||state.pending)return;
  const sc=SCENES[state.sceneId],enemy=getEnemy(sc);if(!enemy)return;
  const rows=Object.entries(inventoryCounts()).filter(([nm])=>{const it=ITEMS[nm];return it&&(it.encounter||it.heal||it.persistent);});
  const m=encMod();
  $('modal').innerHTML=`<h2>조우 아이템</h2><div class="modal-sub">${escapeHtml(enemy.name)}</div>${rows.length?rows.map(([nm,count])=>{const it=ITEMS[nm];return `<div class="bag-row encounter-usable"><div class="item-copy"><b>${nm} × ${count}<span class="item-kind">${it.kind}</span></b><small>${it.desc}</small></div><button class="shop-btn" data-enc-use="${escapeAttr(nm)}">사용</button></div>`}).join(''):'<p class="modal-sub">이 조우에서 사용할 물품이 없다.</p>'}<button class="btn modal-close" onclick="closeModal()">닫기</button>`;
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

function fetchTimed(url, options={}, timeoutMs=7000){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
  return fetch(url,{...options,signal:ctrl.signal}).finally(()=>clearTimeout(timer));
}

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
  merged.talkRisk={...(data.talkRisk||{})};
  merged.encounterMods={...(data.encounterMods||{})};
  merged.entered={...(data.entered||{})};
  merged.world=worldShape(data.world||{});
  merged.inventory=Array.isArray(data.inventory)?data.inventory:[];
  merged.stats={...base.stats,...(data.stats||{})};
  merged.stats.overTalks=Number(data.stats?.overTalks||0);
  merged.stats.corpses=Number(data.stats?.corpses||0);
  merged.stats.tyranny=Number(data.stats?.tyranny||0);
  merged.stats.merchantDeals=Number(data.stats?.merchantDeals||0);
  merged.stats.merchantIncome=Number(data.stats?.merchantIncome||0);
  merged.runId=String(data.runId||base.runId);
  merged.version=GAME_VERSION;
  return migrateLegacyWorld(merged,data);
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
    if(d.ended){el.textContent=`${d.p.className} · ${d.stats?.ending||'끝난 여정'} · 기록 확인 가능`;return;}
    el.textContent=`${d.p.className} · ${where} · HP ${d.p.hp}/${d.p.maxHp} · ◆ ${d.p.gold}`;
  }catch{el.textContent='저장 데이터 확인 필요';}
}
function finishLoaded(){state.ended=false;finish(state.stats.ending||'BAD END');}
function getPlayerId(){let id=localStorage.getItem(PLAYER_ID_KEY);if(!id){id=`p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;localStorage.setItem(PLAYER_ID_KEY,id);}return id;}
function resetRankSubmitUI(){
  const box=$('rankSubmitStatus');const btn=$('submitScoreBtn');
  if(box){box.className='rank-submit-status hidden';box.innerHTML='';}
  if(btn){btn.disabled=false;btn.textContent='영구 랭킹에 기록 등록';}
}
function setRankSubmitStatus(kind,title,bodyHtml=''){
  const box=$('rankSubmitStatus');if(!box)return;
  box.className=`rank-submit-status ${kind}`;
  box.innerHTML=`<div class="rank-status-title">${escapeHtml(title)}</div>${bodyHtml}`;
}
function queuePendingScore(payload){
  let q=[];try{q=JSON.parse(localStorage.getItem(PENDING_KEY)||'[]');if(!Array.isArray(q))q=[];}catch{q=[];}
  const sig=JSON.stringify([payload.playerId,payload.stats?.ending,payload.stats?.progress,payload.stats?.kills,payload.stats?.goldHeld,payload.stats?.goldEarned]);
  const exists=q.some(x=>JSON.stringify([x.playerId,x.stats?.ending,x.stats?.progress,x.stats?.kills,x.stats?.goldHeld,x.stats?.goldEarned])===sig);
  if(!exists)q.push({...payload,queuedAt:Date.now()});
  localStorage.setItem(PENDING_KEY,JSON.stringify(q.slice(-20)));
}
async function verifyPermanentRecord(playerId,expectedBest){
  const r=await fetch(`/api/player/${encodeURIComponent(playerId)}?t=${Date.now()}`,{cache:'no-store'});
  if(!r.ok)throw new Error('VERIFY_HTTP');
  const d=await r.json();
  if(!d.ok||!d.found||d.storage!=='cloud'||!d.verified)throw new Error('VERIFY_NOT_CLOUD');
  if(Number(d.record?.score)!==Number(expectedBest))throw new Error('VERIFY_SCORE');
  return d;
}
async function verifySubmittedRun(runId,expectedScore){
  const r=await fetch(`/api/run/${encodeURIComponent(runId)}?t=${Date.now()}`,{cache:'no-store'});
  if(!r.ok)throw new Error('VERIFY_RUN_HTTP');
  const d=await r.json();
  if(!d.ok||!d.found||d.storage!=='cloud'||!d.verified)throw new Error('VERIFY_RUN_NOT_CLOUD');
  if(Number(d.record?.score)!==Number(expectedScore))throw new Error('VERIFY_RUN_SCORE');
  return d;
}
async function submitScore(){
  const btn=$('submitScoreBtn');
  if(btn?.disabled)return;
  const nickname=$('nickname').value.trim()||'익명';
  const playerId=getPlayerId();
  const payload={playerId,nickname,className:state.p.className,stats:{...state.stats,goldHeld:state.p.gold}};
  if(btn){btn.disabled=true;btn.textContent='영구 DB에 저장 확인 중...';}
  setRankSubmitStatus('keep','서버에 기록을 확인하고 있습니다.','<div>저장 후 실제 DB에서 다시 읽어 검증합니다.</div>');
  try{
    const r=await fetchTimed('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'},9000);
    let d={};try{d=await r.json();}catch{}
    if(!r.ok||!d.ok||!d.permanent||!d.verified||d.storage!=='cloud'||!d.runId||(Number(d.submittedRank||999)<=50&&d.leaderboardVisible!==true))throw new Error(d.error||`HTTP_${r.status}`);

    // Verify both the canonical personal best and this exact run.
    const verify=await verifyPermanentRecord(playerId,d.bestScore);
    const runVerify=await verifySubmittedRun(d.runId,d.submittedScore);
    const rank=verify.rank??d.rank;
    const rankText=rank?`${rank}위`:'순위 확인됨';
    const runRank=runVerify.rank??d.submittedRank;
    const runRankText=runRank?`${runRank}위`:'등록 확인됨';
    const submitted=Number(d.submittedScore||0).toLocaleString();
    const best=Number(d.bestScore||0).toLocaleString();

    if(d.recordStatus==='created'){
      setRankSubmitStatus('success','✓ 첫 플레이 기록 영구 등록 완료',`<div>이번 플레이 기록과 개인 최고기록을 모두 Supabase에서 다시 읽어 확인했습니다.</div><div class="rank-status-grid"><span>이번 점수</span><b>${submitted}</b><span>이번 기록 순위</span><b>${runRankText}</b><span>개인 최고</span><b>${best}</b><span>최고기록 순위</span><b>${rankText}</b></div>`);
    }else if(d.recordStatus==='updated'){
      setRankSubmitStatus('success','✓ 플레이 기록 등록 + 최고기록 갱신',`<div>이번 플레이를 별도 기록으로 저장했고 개인 최고도 갱신했습니다.</div><div class="rank-status-grid"><span>이번 점수</span><b>${submitted}</b><span>이번 기록 순위</span><b>${runRankText}</b><span>새 개인 최고</span><b>${best}</b><span>최고기록 순위</span><b>${rankText}</b></div>`);
    }else{
      setRankSubmitStatus('success','✓ 낮은 점수도 영구 기록 등록 완료',`<div>기존 최고기록은 유지하면서 <b>이번 플레이도 별도 기록으로 저장</b>했습니다.</div><div class="rank-status-grid"><span>이번 점수</span><b>${submitted}</b><span>이번 기록 순위</span><b>${runRankText}</b><span>개인 최고</span><b>${best}</b><span>최고기록 순위</span><b>${rankText}</b></div>`);
    }
    // Remove queued copies for this player after a verified permanent connection succeeds.
    try{const q=JSON.parse(localStorage.getItem(PENDING_KEY)||'[]');localStorage.setItem(PENDING_KEY,JSON.stringify((Array.isArray(q)?q:[]).filter(x=>x.playerId!==playerId)));}catch{}
    updateStorageStatus();
  }catch(err){
    queuePendingScore(payload);
    setRankSubmitStatus('error','✕ 영구 랭킹 저장 실패',`<div>이번 기록은 기기에 재전송 대기 상태로 보관했습니다. <b>영구 DB에 실제 저장된 것으로 처리하지 않았습니다.</b></div><div class="rank-status-grid"><span>이번 점수</span><b>${clientScore().toLocaleString()}</b><span>상태</span><b>재전송 대기</b></div>`);
    console.warn('[ranking submit]',err?.message||err);
  }finally{
    if(btn){btn.disabled=false;btn.textContent='기록 다시 확인 / 등록';}
  }
}
async function showLeaderboard(){
  $('modal').innerHTML='<h2>노말 모드 기록</h2><div class="modal-sub">영구 DB에서 실제 기록을 불러오는 중...</div>';showModal();
  const playerId=getPlayerId();
  try{
    const [lr,mr]=await Promise.all([
      fetchTimed(`/api/leaderboard?t=${Date.now()}`,{cache:'no-store'},7000),
      fetchTimed(`/api/player/${encodeURIComponent(playerId)}?t=${Date.now()}`,{cache:'no-store'},7000).catch(()=>null)
    ]);
    if(!lr.ok)throw new Error('LEADERBOARD_HTTP');
    const rows=await lr.json();if(!Array.isArray(rows))throw new Error('LEADERBOARD_FORMAT');
    let me=null;if(mr&&mr.ok){try{const md=await mr.json();if(md.ok&&md.found&&md.storage==='cloud')me=md;}catch{}}
    // Personal permanent record is always visible in this screen, even if a TOP50 response is temporarily inconsistent.
    if(me?.record && !rows.some(x=>x.playerId===playerId)) rows.push({...me.record,_personalFallback:true,_actualRank:me.rank});
    rows.sort((a,b)=>Number(b.score||0)-Number(a.score||0) || Number(a.time||0)-Number(b.time||0));
    const myCard=me?`<div class="my-rank-card"><b>내 영구 최고기록</b><div class="rank-status-grid"><span>점수</span><b>${Number(me.record.score).toLocaleString()}</b><span>현재 순위</span><b>${me.rank?me.rank+'위':'확인됨'}</b><span>직업</span><b>${escapeHtml(me.record.className)}</b><span>엔딩</span><b>${escapeHtml(me.record.ending)}</b></div></div>`:'<div class="modal-sub">이 기기로 등록한 영구 기록은 아직 없습니다.</div>';
    const listHtml=rows.length?rows.slice(0,50).map((x,i)=>`<div class="rank-row ${x.playerId===playerId?'mine':''}"><div class="rank-num">${x._actualRank||i+1}</div><div><b>${escapeHtml(x.nickname)}${x.playerId===playerId?' · 나':''}</b><div class="rank-meta">${escapeHtml(x.className)} · ${escapeHtml(x.ending)} · ${x.recordType==='run'?'플레이 기록':'기존 기록'}${x._personalFallback?' · 개인기록 재조회':''}</div></div><div class="rank-score">${Number(x.score).toLocaleString()}</div></div>`).join(''):(me?'<p class="modal-sub">내 영구 기록은 위에서 확인되었습니다. TOP50 목록을 다시 불러오는 중 문제가 있었습니다.</p>':'<p class="modal-sub">서버에 아직 등록된 노말 모드 기록이 없습니다.</p>');
    $('modal').innerHTML=`<h2>노말 모드 기록</h2><div class="modal-sub">Supabase 영구 DB · 모든 플레이 기록 TOP 50 · 예전 기록도 유지</div>${myCard}${listHtml}<button class="btn modal-close" onclick="closeModal()">닫기</button>`;
  }catch(err){
    $('modal').innerHTML='<h2>노말 모드 기록</h2><p class="modal-sub">영구 랭킹 DB에서 기록을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.</p><button class="btn modal-close" onclick="closeModal()">닫기</button>';
    console.warn('[leaderboard]',err?.message||err);
  }
}

async function updateStorageStatus(){
  const el=$('storageInfo'); if(!el)return;
  el.textContent='랭킹 저장 상태 확인 중…';el.className='storage-info';
  try{
    const r=await fetchTimed(`/api/storage?t=${Date.now()}`,{cache:'no-store'},5500);
    let d={};try{d=await r.json();}catch{}
    if(d.permanent&&d.connected){el.textContent='● 영구 랭킹 DB 연결됨';el.className='storage-info cloud';}
    else if(d.error==='SERVER_SECRET_KEY_REQUIRED'){el.textContent='● Supabase Secret Key 확인 필요';el.className='storage-info cloud-error';}
    else if(d.error==='CLOUD_DB_TIMEOUT'){el.textContent='△ 랭킹 DB 응답 지연 · 게임은 정상 이용 가능';el.className='storage-info local';}
    else if(d.configured&&!d.connected){el.textContent='△ 랭킹 DB 연결 오류 · 게임은 정상 이용 가능';el.className='storage-info cloud-error';}
    else{el.textContent='○ 영구 랭킹 DB 미연결';el.className='storage-info local';}
  }catch(err){
    el.textContent=(err?.name==='AbortError')?'△ 랭킹 확인 지연 · 게임은 정상 이용 가능':'○ 랭킹 서버 상태 확인 불가';
    el.className='storage-info local';
  }
}

async function flushPending(){
  let q=[];try{q=JSON.parse(localStorage.getItem(PENDING_KEY)||'[]');if(!Array.isArray(q))q=[];}catch{q=[];}
  if(!q.length)return;
  const remain=[];
  for(const payload of q){
    try{
      const r=await fetchTimed('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'},9000);
      let d={};try{d=await r.json();}catch{}
      if(!r.ok||!d.ok||!d.permanent||!d.verified||d.storage!=='cloud'){remain.push(payload);continue;}
      await verifyPermanentRecord(payload.playerId,d.bestScore);if(d.runId)await verifySubmittedRun(d.runId,d.submittedScore);
    }catch{remain.push(payload);}
  }
  localStorage.setItem(PENDING_KEY,JSON.stringify(remain));
}

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
  if(act==='summon-wraith')summonWraith();
  if(act==='save-exit')saveAndExit();
  if(act==='submit-score')submitScore();
  if(act==='continue-result')continueOutcome();
  const ga=e.target.closest('[data-game-action]')?.dataset.gameAction;
  if(ga)gameAction(ga);
});
window.selectClass=selectClass;window.recoverFromAnomaly=recoverFromAnomaly;window.summonWraith=summonWraith;window.openShop=openShop;window.openBag=openBag;window.openEncounterItems=openEncounterItems;window.closeModal=closeModal;window.continueOutcome=continueOutcome;window.saveAndExit=saveAndExit;

updateMenuSaveInfo();
updateStorageStatus();
flushPending();
