const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);
const io = new Server(server,{cors:{origin:true,credentials:false},pingTimeout:12000,pingInterval:10000});
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'scores.json');
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SECRET_KEY = String(process.env.SUPABASE_SECRET_KEY || '');
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const SUPABASE_KEY = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_KEY_IS_NEW = SUPABASE_KEY.startsWith('sb_secret_');
const CLOUD_CONFIGURED = !!(SUPABASE_URL && SUPABASE_KEY);
function keyRole(key){try{if(!key||!key.includes('.'))return '';const part=key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return String(JSON.parse(Buffer.from(part,'base64').toString('utf8'))?.role||'');}catch{return '';}}
const SUPABASE_KEY_ROLE=keyRole(SUPABASE_KEY);
const SUPABASE_PUBLIC_KEY=SUPABASE_KEY.startsWith('sb_publishable_')||SUPABASE_KEY_ROLE==='anon';
const CLOUD_WRITABLE=CLOUD_CONFIGURED&&!SUPABASE_PUBLIC_KEY;
const supabase = CLOUD_CONFIGURED ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken:false, persistSession:false, detectSessionInUrl:false },
  global: { headers: { 'X-Client-Info': 'fallen-rpg-render-server/0.9.30' } }
}) : null;

function withTimeout(promise, ms = 6000, code = 'UPSTREAM_TIMEOUT') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(code)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

app.use(express.json({ limit: '256kb' }));
app.use((req,res,next)=>{
  if(req.path==='/'||/\.(?:js|css|html)$/.test(req.path)) res.set('Cache-Control','no-store, max-age=0');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ---------- v0.9.30 one-time 4-digit device transfer ----------
const DEVICE_TRANSFER_TTL_MS=10*60*1000;
const DEVICE_TRANSFER_MAX_BYTES=192*1024;
const DEVICE_TRANSFER_LOAD_FAIL_LIMIT=12;
const DEVICE_TRANSFER_CREATE_LIMIT=8;
const deviceTransferCodes=new Map();
const deviceTransferAttempts=new Map();
const deviceTransferCreates=new Map();

function deviceTransferIp(req){
  const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
  return forwarded||String(req.socket?.remoteAddress||'unknown');
}
function pruneDeviceTransfers(){
  const now=Date.now();
  for(const [code,row] of deviceTransferCodes){
    if(!row||row.expiresAt<=now)deviceTransferCodes.delete(code);
  }
  for(const store of [deviceTransferAttempts,deviceTransferCreates]){
    for(const [ip,row] of store){
      if(!row||row.resetAt<=now)store.delete(ip);
    }
  }
}
function transferWindowRow(store,ip){
  const now=Date.now();
  let row=store.get(ip);
  if(!row||row.resetAt<=now)row={count:0,resetAt:now+10*60*1000};
  return row;
}
function deviceTransferCreateBlocked(req){
  pruneDeviceTransfers();
  const ip=deviceTransferIp(req);
  const row=transferWindowRow(deviceTransferCreates,ip);
  return row.count>=DEVICE_TRANSFER_CREATE_LIMIT;
}
function deviceTransferMarkCreate(req){
  const ip=deviceTransferIp(req);
  const row=transferWindowRow(deviceTransferCreates,ip);
  row.count++;
  deviceTransferCreates.set(ip,row);
}
function deviceTransferFail(req){
  pruneDeviceTransfers();
  const ip=deviceTransferIp(req);
  const row=transferWindowRow(deviceTransferAttempts,ip);
  row.count++;
  deviceTransferAttempts.set(ip,row);
}
function deviceTransferBlocked(req){
  pruneDeviceTransfers();
  const row=deviceTransferAttempts.get(deviceTransferIp(req));
  return !!row&&row.count>=DEVICE_TRANSFER_LOAD_FAIL_LIMIT&&row.resetAt>Date.now();
}
function normalizeDeviceTransferData(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('TRANSFER_DATA_REQUIRED');
  const playerId=String(input.playerId||'').trim();
  if(!/^p_[a-zA-Z0-9_-]{4,78}$/.test(playerId))throw new Error('TRANSFER_PLAYER_INVALID');
  const str=(v,max)=>typeof v==='string'?v.slice(0,max):'';
  const data={
    playerId,
    save:str(input.save,150000),
    meta:str(input.meta,30000),
    pvpSave:str(input.pvpSave,30000),
    pvpNickname:str(input.pvpNickname,100),
    gameVersion:n(input.gameVersion,999999)
  };
  if(Buffer.byteLength(JSON.stringify(data),'utf8')>DEVICE_TRANSFER_MAX_BYTES)throw new Error('TRANSFER_TOO_LARGE');
  return data;
}
function newDeviceTransferCode(){
  pruneDeviceTransfers();
  for(let i=0;i<80;i++){
    const code=String(crypto.randomInt(0,10000)).padStart(4,'0');
    if(!deviceTransferCodes.has(code))return code;
  }
  return null;
}

app.post('/api/device-transfer/create',(req,res)=>{
  res.set('Cache-Control','no-store');
  if(deviceTransferCreateBlocked(req))return res.status(429).json({ok:false,error:'TRANSFER_CREATE_RATE_LIMIT'});
  try{
    const data=normalizeDeviceTransferData(req.body?.data);
    const code=newDeviceTransferCode();
    if(!code)return res.status(503).json({ok:false,error:'TRANSFER_CODE_BUSY'});
    const now=Date.now();
    deviceTransferCodes.set(code,{data,createdAt:now,expiresAt:now+DEVICE_TRANSFER_TTL_MS});
    deviceTransferMarkCreate(req);
    return res.json({ok:true,code,expiresIn:Math.floor(DEVICE_TRANSFER_TTL_MS/1000)});
  }catch(e){
    const error=String(e?.message||'TRANSFER_CREATE_FAILED');
    return res.status(error==='TRANSFER_TOO_LARGE'?413:400).json({ok:false,error});
  }
});

app.post('/api/device-transfer/load',(req,res)=>{
  res.set('Cache-Control','no-store');
  if(deviceTransferBlocked(req))return res.status(429).json({ok:false,error:'TRANSFER_RATE_LIMIT'});
  const code=String(req.body?.code||'').replace(/\D/g,'').slice(0,4);
  if(!/^\d{4}$/.test(code)){
    deviceTransferFail(req);
    return res.status(400).json({ok:false,error:'TRANSFER_CODE_INVALID'});
  }
  pruneDeviceTransfers();
  const row=deviceTransferCodes.get(code);
  if(!row){
    deviceTransferFail(req);
    return res.status(404).json({ok:false,error:'TRANSFER_CODE_EXPIRED'});
  }
  deviceTransferCodes.delete(code);
  deviceTransferAttempts.delete(deviceTransferIp(req));
  return res.json({ok:true,data:row.data});
});


const ENDING_BONUS = {
  'BAD END': 0,
  '첫 칼날': 0,
  '말이 끝난 자리': 0,
  '성문 밖의 이름': 120,
  '의심은 칼보다 빨랐다': 160,
  '한 사람의 저항': 80,
  '군중 속의 몰락': 120,
  '경종 아래에서': 280,
  '더 들을 말은 없다': 320,
  '친위대장의 판결': 700,
  '전설은 늙지 않았다': 1450,
  '목책길의 매복': 260,
  '울리지 못한 신호': 320,
  '명예의 값': 1050,
  '대화가 끝난 뒤': 1100,
  '무너진 성문 앞에서': 1100,
  '왕의 마지막 분노': 1550,
  '값을 잘못 매긴 자': 80,
  '갈고리의 경고': 520,
  '끝난 거래': 560,
  '붉은 모자의 미소': 620,
  '아쉽네, 정말': 660,
  '초급이라는 착각': 430,
  '신호 이후': 470,
  '협회의 추격자는 멈추지 않는다': 1250,
  '세리아의 마지막 질문': 1150,
  '네 편은 네가 정했다': 1200,
  '이름 없는 최후': 0,
  '명예 회복': 5000,
  '반란': 10000,
  '모두와 친구': 25000,
  '위선적인 영웅': 12000,
  '피 묻은 중재자': 20000,
  '두 개의 깃발': 18000,
  '지배자': 30000,
  '길을 잃은 자': 420,
  '빈 호칭': 900,
  '팬텀': 1800,
  '끝없는 악몽': 2400,
  '노예': 6500,
  '검은 왕관의 몰락': 45000,
  '이름을 돌려준 자': 56000,
  '닫힌 성채의 새 주인': 50000,
  '폐쇄령의 마지막 이름': 5200,
  "검은 밀랍의 첫 번째 이름": 2100,
  "이름으로 낸 통행세": 2400,
  "도둑에게 없는 퇴로": 2600,
  "까마귀가 울린 뒤": 2800,
  "빌린 이름의 끝": 3000,
  "초대받지 못한 이름": 3000,
  "거짓 허가의 종착지": 3200,
  "손바닥에 남은 이름": 3500,
  "732번": 3500,
  "빈 감방의 대체자": 3900,
  "화로 앞의 검은 재": 3900,
  "하르트가 기억한 마지막 사람": 4300,
  "봉인과 함께 꺼진 이름": 4500,
  "검은 못의 성례": 4200,
  "너무 늦은 고해": 4600,
  "사슬문 아래": 4000,
  "명령보다 늦은 의심": 4700,
  "무명군의 새 병사": 4600,
  "카르센이 기억한 마지막 이름": 5000,
  "완벽한 폐쇄령": 5300,
  "왕좌가 기억한 이름": 6000,
  "말이 끝난 왕좌": 5700,
  "세 봉인은 주인을 살리지 못했다": 6400,
};

function n(v, max = 100000) {
  const x = Number(v);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(max, Math.floor(x)));
}


// Nicknames are public leaderboard text, so validate them on the server as well as in the browser.
const NICK_BLOCK_CONTAINS = [
  '섹스','야동','자위','질싸','노콘','딜도','오나홀','정액','강간','윤간','성폭행','성추행','야설','야짤','음란','포르노',
  '펠라','오럴섹스','구강성교','애널섹스','딸딸이','딸감','딸치','보빨','자빨','좆물','발기왕','꼴려','꼴림',
  '좆','씹새','씨발','시발','개씨발','개새끼','씹년','병신','창녀','매춘','후장','ㅅㅂ','ㅆㅂ','ㅂㅅ',
  'sex','porn','hentai','blowjob','handjob','fuck','pussy','penis','vagina','gangbang','creampie','masturbat','dildo','cumshot',
  'nsfw','horny','orgasm','semen','ejaculat','jerkoff','fapping','deepthroat','suckmydick','onlyfans','bdsm'
];
const NICK_BLOCK_EXACT = new Set([
  '보지','자지','성기','항문','꼬추','유두','ㅂㅈ','ㅈㅈ','sex','anal','cum','dick','cock','tits','boobs','nude','nudes','rape','slut','whore','bitch','fap','milf','xxx'
]);
const NICK_JAMO_CONTAINS = ['ㅅㅔㄱㅅㅡ','ㅈㅏㅇㅟ','ㅇㅑㄷㅗㅇ','ㅍㅔㄹㄹㅏ','ㅆㅣㅂㅏㄹ','ㅅㅣㅂㅏㄹ','ㅂㅕㅇㅅㅣㄴ','ㅈㅗㅈ'];
const NICK_BLOCK_CONTEXT = [
  /(?:보지|자지|꼬추|성기)(?:왕|맨|녀|남|맛|빨|박|킬러|헌터|마스터|짱|좋아)/u,
  /(?:왕|대물|큰|맛있는)(?:보지|자지|꼬추)/u
];
function nicknameForms(value) {
  const raw=String(value??'').trim();
  const compact=raw.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\u3131-\u318E\u1100-\u11FF]+/gu,'');
  const leet=compact.replace(/[@4]/g,'a').replace(/3/g,'e').replace(/[1!|]/g,'i').replace(/0/g,'o').replace(/[5$]/g,'s').replace(/7/g,'t');
  const dedup=leet.replace(/(.)\1+/gu,'$1');
  const jamo=compact.normalize('NFD').replace(/[^\u1100-\u11FF\u3131-\u318E]/g,'');
  return { raw, compact, leet, dedup, jamo };
}
function nicknameAllowed(value) {
  const {raw,compact,leet,dedup,jamo}=nicknameForms(value);
  if(!raw) return {ok:true,value:'익명'};
  const clipped=Array.from(raw.normalize('NFKC')).slice(0,12).join('').trim();
  if(!clipped) return {ok:true,value:'익명'};
  const forms=[compact,leet,dedup];
  const blocked=NICK_BLOCK_CONTAINS.some(w=>forms.some(f=>f.includes(w))) ||
    forms.some(f=>NICK_BLOCK_EXACT.has(f)) ||
    NICK_JAMO_CONTAINS.some(w=>compact.includes(w)||jamo.includes(w.normalize('NFD'))) ||
    NICK_BLOCK_CONTEXT.some(re=>forms.some(f=>re.test(f)));
  return blocked ? {ok:false,value:'익명'} : {ok:true,value:clipped};
}
function safeNickname(value){const r=nicknameAllowed(value);return r.ok?r.value:'검열된 이름';}

function scoreRun(s = {}) {
  const progress = n(s.progress, 500);
  const goldEarned = n(s.goldEarned, 100000);
  const goldHeld = n(s.goldHeld, 100000);
  const kills = n(s.kills, 200);
  const eliteKills = n(s.eliteKills, 50);
  const riskyWins = n(s.riskyWins, 50);
  const comebackWins = n(s.comebackWins, 50);
  const talkSolved = n(s.talkSolved, 300);
  const socialSuccess = n(s.socialSuccess, 300);
  const socialFail = n(s.socialFail, 300);
  const runSuccess = n(s.runSuccess, 300);
  const secrets = n(s.secrets, 100);
  const survivors = n(s.survivors, 100);
  const growths = n(s.growths, 100);
  const overTalks = n(s.overTalks, 100);
  const riskySocial = n(s.riskySocial, 100);
  const ending = String(s.ending || 'BAD END').slice(0, 30);

  let score = 0;
  score += progress * 115;
  score += goldEarned * 3;
  score += Math.floor(goldHeld * 1.2);
  score += kills * 170;
  score += eliteKills * 950;
  score += riskyWins * 650;
  score += comebackWins * 900;
  score += talkSolved * 210;
  score += socialSuccess * 300;
  score += riskySocial * 500;
  score += runSuccess * 85;
  score += secrets * 500;
  score += survivors * 220;
  score += growths * 140;
  score -= socialFail * 25;
  score -= overTalks * 90;
  score += Math.floor((ENDING_BONUS[ending] || 0) * (s.prideKept ? 1.5 : 1));
  return Math.max(0, Math.floor(score));
}

function readScores() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
function writeScores(rows) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(rows, null, 2));
}

async function cloudGetLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from('fallen_scores')
    .select('player_id,nickname,class_name,ending,score,kills,gold,progress,stats,updated_at')
    .neq('ending','PVP RATING')
    .order('score', { ascending:false })
    .order('updated_at', { ascending:true })
    .limit(Math.max(50, Math.min(1000, Math.max(Number(limit)||50, 300))));
  if (error) throw new Error(`SUPABASE_LEADERBOARD:${error.message}`);
  const mapped=(data || []).map(mapCloudRow);
  // Canonical best rows created by v0.9.5 are hidden from the run leaderboard to avoid duplicates.
  // Legacy rows have no recordType and remain visible so old scores are never lost from view.
  return mapped.filter(x => x.recordType !== 'best' && x.recordType !== 'pvp_rating').slice(0, Math.max(1, Math.min(200, Number(limit)||50)));
}

async function cloudGetPlayer(playerId) {
  const { data, error } = await supabase
    .from('fallen_scores')
    .select('player_id,nickname,class_name,ending,score,kills,gold,progress,stats,updated_at')
    .eq('player_id', playerId)
    .maybeSingle();
  if (error) throw new Error(`SUPABASE_PLAYER:${error.message}`);
  return data ? mapCloudRow(data) : null;
}

async function cloudUpdateNickname(playerId, nickname) {
  const { data, error } = await supabase
    .from('fallen_scores')
    .update({ nickname, updated_at:new Date().toISOString() })
    .eq('player_id', playerId)
    .select('player_id,nickname,class_name,ending,score,kills,gold,progress,stats,updated_at')
    .single();
  if (error) throw new Error(`SUPABASE_NICKNAME:${error.message}`);
  return data;
}

async function cloudUpsert(entry, stats) {
  const body = {
    player_id: entry.playerId,
    nickname: entry.nickname,
    class_name: entry.className,
    ending: entry.ending,
    score: entry.score,
    kills: entry.kills,
    gold: entry.gold,
    progress: entry.progress,
    stats:{ ...stats, recordType:'best', ownerPlayerId:entry.playerId },
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('fallen_scores')
    .upsert(body, { onConflict:'player_id' })
    .select('player_id,nickname,class_name,ending,score,kills,gold,progress,stats,updated_at')
    .single();
  if (error) throw new Error(`SUPABASE_UPSERT:${error.message}`);
  return data;
}

async function cloudInsertRun(entry, stats) {
  const runId = `run_${Date.now().toString(36)}_${crypto.randomBytes(5).toString('hex')}`;
  const body = {
    player_id: runId,
    nickname: entry.nickname,
    class_name: entry.className,
    ending: entry.ending,
    score: entry.score,
    kills: entry.kills,
    gold: entry.gold,
    progress: entry.progress,
    stats:{ ...stats, recordType:'run', ownerPlayerId:entry.playerId },
    updated_at:new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('fallen_scores')
    .insert(body)
    .select('player_id,nickname,class_name,ending,score,kills,gold,progress,stats,updated_at')
    .single();
  if (error) throw new Error(`SUPABASE_RUN_INSERT:${error.message}`);
  return mapCloudRow(data);
}

async function cloudGetRun(runId) {
  const { data, error } = await supabase
    .from('fallen_scores')
    .select('player_id,nickname,class_name,ending,score,kills,gold,progress,stats,updated_at')
    .eq('player_id', runId)
    .maybeSingle();
  if (error) throw new Error(`SUPABASE_RUN:${error.message}`);
  return data ? mapCloudRow(data) : null;
}

async function cloudRunRank(score) {
  // Ranking is based on visible run/legacy records, not hidden canonical-best mirror rows.
  const { data, error } = await supabase
    .from('fallen_scores')
    .select('player_id,score,stats,ending')
    .neq('ending','PVP RATING')
    .order('score', { ascending:false })
    .limit(1000);
  if (error) throw new Error(`SUPABASE_RUN_RANK:${error.message}`);
  const visible=(data||[]).filter(x => !['best','pvp_rating'].includes(String(x?.stats?.recordType||'')));
  return visible.filter(x => Number(x.score||0) > Number(score||0)).length + 1;
}

async function cloudRank(score) {
  // Personal-best rank counts canonical/legacy player rows only, never per-run rows.
  const { data, error } = await supabase
    .from('fallen_scores')
    .select('player_id,score,stats,ending')
    .neq('ending','PVP RATING')
    .order('score', { ascending:false })
    .limit(1000);
  if (error) throw new Error(`SUPABASE_RANK:${error.message}`);
  const bestRows=(data||[]).filter(x => !String(x.player_id||'').startsWith('run_') && String(x?.stats?.recordType||'')!=='pvp_rating');
  return bestRows.filter(x => Number(x.score||0) > Number(score||0)).length + 1;
}

async function verifyCloudRecord(playerId, expectedScore) {
  const row = await cloudGetPlayer(playerId);
  if (!row) throw new Error('VERIFY_RECORD_MISSING');
  if (Number(row.score) !== Number(expectedScore)) {
    throw new Error(`VERIFY_SCORE_MISMATCH:${row.score}:${expectedScore}`);
  }
  return row;
}

function mapCloudRow(x) {
  const meta=(x && typeof x.stats==='object' && x.stats) ? x.stats : {};
  const recordType=String(meta.recordType||'legacy');
  const ownerPlayerId=String(meta.ownerPlayerId||'');
  const hardEndings=new Set(['검은 왕관의 몰락','이름을 돌려준 자','닫힌 성채의 새 주인','폐쇄령의 마지막 이름','검은 밀랍의 첫 번째 이름','이름으로 낸 통행세','도둑에게 없는 퇴로','까마귀가 울린 뒤','빌린 이름의 끝','초대받지 못한 이름','거짓 허가의 종착지','손바닥에 남은 이름','732번','빈 감방의 대체자','화로 앞의 검은 재','하르트가 기억한 마지막 사람','봉인과 함께 꺼진 이름','검은 못의 성례','너무 늦은 고해','사슬문 아래','명령보다 늦은 의심','무명군의 새 병사','카르센이 기억한 마지막 이름','완벽한 폐쇄령','왕좌가 기억한 이름','말이 끝난 왕좌','세 봉인은 주인을 살리지 못했다']);
  const rawMode=String(meta.gameMode||'').trim().toLowerCase();
  const rawRoute=String(meta.hardRoute||'').trim();
  const ending=String(x.ending||'').trim();
  const gameMode=(rawMode==='hard'||rawRoute.length>0||hardEndings.has(ending))?'hard':'normal';
  return {
    rowId:x.player_id,
    playerId:ownerPlayerId||x.player_id,
    recordType,
    gameMode,
    hardRoute:gameMode==='hard'?String(rawRoute||'algon').slice(0,40):'',
    nickname:safeNickname(x.nickname),
    className:x.class_name,
    ending:x.ending,
    score:Number(x.score||0),
    kills:Number(x.kills||0),
    gold:Number(x.gold||0),
    progress:Number(x.progress||0),
    time:x.updated_at?Date.parse(x.updated_at):Date.now(),
  };
}


// ---------- Normal PVP rating ----------
function pvpRowId(playerId){return `pvp_${String(playerId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,72)}`;}
function mapPvpRow(x){const st=(x&&typeof x.stats==='object'&&x.stats)||{};return {playerId:String(st.ownerPlayerId||String(x.player_id||'').replace(/^pvp_/,'')),nickname:safeNickname(x.nickname),className:String(st.lastClass||x.class_name||''),rating:Number(st.rating||x.score||1000),wins:Number(st.wins||0),losses:Number(st.losses||0),draws:Number(st.draws||0),games:Number(st.games||0),updatedAt:x.updated_at||''};}
async function cloudGetPvpProfile(playerId){
  if(!CLOUD_CONFIGURED)return {playerId,rating:1000,wins:0,losses:0,draws:0,games:0,nickname:'',className:''};
  const {data,error}=await supabase.from('fallen_scores').select('player_id,nickname,class_name,score,stats,updated_at').eq('player_id',pvpRowId(playerId)).maybeSingle();
  if(error)throw new Error(`PVP_PROFILE:${error.message}`);return data?mapPvpRow(data):{playerId,rating:1000,wins:0,losses:0,draws:0,games:0,nickname:'',className:''};
}
async function cloudSavePvpProfile(profile){
  if(!CLOUD_WRITABLE)return profile;
  const body={player_id:pvpRowId(profile.playerId),nickname:safeNickname(profile.nickname||'익명'),class_name:String(profile.className||'').slice(0,12),ending:'PVP RATING',score:Math.max(0,Math.round(profile.rating||1000)),kills:0,gold:0,progress:0,stats:{recordType:'pvp_rating',ownerPlayerId:profile.playerId,rating:Math.max(0,Math.round(profile.rating||1000)),wins:Number(profile.wins||0),losses:Number(profile.losses||0),draws:Number(profile.draws||0),games:Number(profile.games||0),lastClass:String(profile.className||'')},updated_at:new Date().toISOString()};
  const {data,error}=await supabase.from('fallen_scores').upsert(body,{onConflict:'player_id'}).select('player_id,nickname,class_name,score,stats,updated_at').single();if(error)throw new Error(`PVP_SAVE:${error.message}`);return mapPvpRow(data);
}
async function cloudGetPvpLeaderboard(limit=50){
  if(!CLOUD_CONFIGURED)return [];
  const {data,error}=await supabase.from('fallen_scores').select('player_id,nickname,class_name,score,stats,updated_at').eq('ending','PVP RATING').order('score',{ascending:false}).limit(Math.max(1,Math.min(50,Number(limit)||50)));if(error)throw new Error(`PVP_BOARD:${error.message}`);
  return (data||[]).filter(x=>String(x?.stats?.recordType||'')==='pvp_rating').map(mapPvpRow).sort((a,b)=>b.rating-a.rating||b.wins-a.wins);
}
function eloPair(a,b,resultA){const ra=Number(a||1000),rb=Number(b||1000),ea=1/(1+Math.pow(10,(rb-ra)/400)),eb=1-ea,k=32;const sa=resultA==='win'?1:resultA==='loss'?0:.5,sb=1-sa;return [Math.max(0,Math.round(ra+k*(sa-ea))),Math.max(0,Math.round(rb+k*(sb-eb)))];}
function pvpSnapshotScore(payload){const st=(payload&&payload.stats)||{};return scoreRun({...st,goldHeld:n(st.goldHeld??payload.gold,100000)});}

const pvpQueue=[];
const pvpMatches=new Map();
const pvpSocketPlayer=new Map();
function publicPvpPlayer(p){return {playerId:p.playerId,nickname:p.nickname,classId:p.classId,className:p.className,score:Number(p.score||0),progress:Number(p.progress||0),hp:Number(p.hp||0),gold:Number(p.gold||0),finished:!!p.finished,connected:p.connected!==false};}
function removeFromQueue(socketId){for(let i=pvpQueue.length-1;i>=0;i--)if(pvpQueue[i].socketId===socketId)pvpQueue.splice(i,1);}
function removePlayerFromQueue(playerId){for(let i=pvpQueue.length-1;i>=0;i--)if(pvpQueue[i].playerId===playerId)pvpQueue.splice(i,1);}
function pvpOpponent(match,playerId){return match.players.find(x=>x.playerId!==playerId);}
function emitOpponent(match,p){const o=pvpOpponent(match,p.playerId);if(!o)return;io.to(p.socketId).emit('pvp:opponent',publicPvpPlayer(o));}
function broadcastPvp(match){for(const p of match.players)emitOpponent(match,p);}
async function finalizePvpMatch(match,forcedWinnerId=null,reason='finished'){
  if(!match||match.resolved)return;match.resolved=true;clearTimeout(match.deadlineTimer);
  const [a,b]=match.players;let resultA='draw';
  if(forcedWinnerId)resultA=forcedWinnerId===a.playerId?'win':'loss';
  else{const ta=[a.score,a.progress,a.hp,a.gold],tb=[b.score,b.progress,b.hp,b.gold];for(let i=0;i<ta.length;i++){if(Number(ta[i])>Number(tb[i])){resultA='win';break;}if(Number(ta[i])<Number(tb[i])){resultA='loss';break;}}}
  const resultB=resultA==='win'?'loss':resultA==='loss'?'win':'draw';
  let pa={playerId:a.playerId,rating:1000,wins:0,losses:0,draws:0,games:0},pb={playerId:b.playerId,rating:1000,wins:0,losses:0,draws:0,games:0};
  try{[pa,pb]=await Promise.all([cloudGetPvpProfile(a.playerId),cloudGetPvpProfile(b.playerId)]);}catch(e){console.error('[pvp profiles]',e.message);}
  const [newA,newB]=eloPair(pa.rating,pb.rating,resultA);
  function nextProfile(base,p,result,newRating){return {...base,playerId:p.playerId,nickname:p.nickname,className:p.className,rating:newRating,games:Number(base.games||0)+1,wins:Number(base.wins||0)+(result==='win'?1:0),losses:Number(base.losses||0)+(result==='loss'?1:0),draws:Number(base.draws||0)+(result==='draw'?1:0)};}
  const na=nextProfile(pa,a,resultA,newA),nb=nextProfile(pb,b,resultB,newB);try{await Promise.all([cloudSavePvpProfile(na),cloudSavePvpProfile(nb)]);}catch(e){console.error('[pvp rating save]',e.message);}
  const pack=(self,opp,result,oldR,newR)=>({matchId:match.id,reason,you:{...publicPvpPlayer(self),result,oldRating:Number(oldR||1000),newRating:Number(newR||1000),delta:Number(newR||1000)-Number(oldR||1000)},opponent:{...publicPvpPlayer(opp)}});
  io.to(a.socketId).emit('pvp:result',pack(a,b,resultA,pa.rating,newA));io.to(b.socketId).emit('pvp:result',pack(b,a,resultB,pb.rating,newB));
  setTimeout(()=>pvpMatches.delete(match.id),60000);
}
async function createPvpMatch(a,b){
  const id=`m_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;const match={id,players:[a,b],createdAt:Date.now(),resolved:false};pvpMatches.set(id,match);
  for(const p of match.players){p.matchId=id;p.connected=true;p.finished=false;p.score=0;p.progress=0;p.hp=0;p.gold=0;pvpSocketPlayer.set(p.socketId,p);}
  match.deadlineTimer=setTimeout(()=>finalizePvpMatch(match,null,'timeout'),30*60*1000);
  io.to(a.socketId).emit('pvp:match',{matchId:id,you:publicPvpPlayer(a),opponent:publicPvpPlayer(b),limitSeconds:1800});io.to(b.socketId).emit('pvp:match',{matchId:id,you:publicPvpPlayer(b),opponent:publicPvpPlayer(a),limitSeconds:1800});broadcastPvp(match);
}
function tryPvpMatch(){
  for(let i=pvpQueue.length-1;i>=0;i--) if(!io.sockets.sockets.get(pvpQueue[i].socketId)) pvpQueue.splice(i,1);
  while(pvpQueue.length>=2){
    const a=pvpQueue.shift();
    const idx=pvpQueue.findIndex(x=>x.playerId!==a.playerId && io.sockets.sockets.get(x.socketId));
    if(idx<0){pvpQueue.unshift(a);break;}
    const b=pvpQueue.splice(idx,1)[0];
    createPvpMatch(a,b).catch(e=>console.error('[pvp match]',e.message));
  }
}

function localLeaderboard() {
  return readScores().sort((a,b)=>b.score-a.score || a.time-b.time).slice(0,50);
}
function localSubmit(entry) {
  let rows = readScores();
  const previous = rows.find(x => x.playerId === entry.playerId);
  let isBest = false;
  if (!previous || entry.score > previous.score) {
    rows = rows.filter(x => x.playerId !== entry.playerId);
    rows.push({ ...entry, id: crypto.randomUUID(), time: Date.now() });
    isBest = true;
    rows.sort((a,b)=>b.score-a.score || a.time-b.time);
    writeScores(rows.slice(0,2000));
  }
  rows.sort((a,b)=>b.score-a.score || a.time-b.time);
  const best = rows.find(x => x.playerId === entry.playerId) || entry;
  return { isBest, bestScore: Number(best.score || entry.score), rank: rows.findIndex(x => x.playerId === entry.playerId) + 1 };
}

app.get('/api/storage', async (_req, res) => {
  if (!CLOUD_CONFIGURED) {
    return res.json({ ok:true, mode:'local', configured:false, connected:false, permanent:false });
  }
  if(SUPABASE_PUBLIC_KEY){
    return res.status(503).json({ok:false,mode:'cloud-error',configured:true,connected:false,permanent:false,error:'SERVER_SECRET_KEY_REQUIRED'});
  }
  try {
    await withTimeout(cloudGetLeaderboard(1), 4500, 'CLOUD_STORAGE_TIMEOUT');
    return res.json({ ok:true, mode:'cloud', configured:true, connected:true, permanent:true });
  } catch (e) {
    console.error('[storage cloud]', e.message);
    const timedOut=String(e.message||'').includes('TIMEOUT');
    return res.status(timedOut?504:503).json({ ok:false, mode:'cloud-error', configured:true, connected:false, permanent:false, error:timedOut?'CLOUD_DB_TIMEOUT':'CLOUD_DB_UNREACHABLE' });
  }
});

app.get('/api/leaderboard', async (_req, res) => {
  res.set('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');
  if (CLOUD_CONFIGURED) {
    try {
      const rows = await cloudGetLeaderboard(50);
      console.log(`[leaderboard] cloud rows=${rows.length}`);
      return res.json(rows);
    } catch (e) {
      console.error('[leaderboard cloud]', e.message);
      return res.status(503).json({ ok:false, error:'CLOUD_LEADERBOARD_UNAVAILABLE', detail:String(e.message||'').slice(0,180) });
    }
  }
  const rows=localLeaderboard();
  console.log(`[leaderboard] local rows=${rows.length}`);
  return res.json(rows);
});

app.get('/api/player/:playerId', async (req, res) => {
  const playerId = String(req.params.playerId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0,80);
  if (!playerId) return res.status(400).json({ ok:false, error:'PLAYER_ID_REQUIRED' });

  if (CLOUD_CONFIGURED) {
    try {
      const row = await cloudGetPlayer(playerId);
      if (!row) return res.json({ ok:true, found:false, storage:'cloud' });
      const rank = await cloudRank(row.score);
      return res.json({ ok:true, found:true, storage:'cloud', verified:true, rank, record:row });
    } catch (e) {
      console.error('[player cloud]', e.message);
      return res.status(503).json({ ok:false, error:'CLOUD_PLAYER_LOOKUP_FAILED' });
    }
  }

  const row = readScores().find(x => x.playerId === playerId);
  if (!row) return res.json({ ok:true, found:false, storage:'local' });
  const rows = readScores().sort((a,b)=>b.score-a.score || a.time-b.time);
  return res.json({ ok:true, found:true, storage:'local', verified:false, rank:rows.findIndex(x=>x.playerId===playerId)+1, record:row });
});

app.get('/api/run/:runId', async (req, res) => {
  const runId = String(req.params.runId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0,120);
  if (!runId) return res.status(400).json({ ok:false, error:'RUN_ID_REQUIRED' });
  if (!CLOUD_CONFIGURED) return res.status(503).json({ ok:false, error:'PERMANENT_DB_NOT_CONFIGURED' });
  try {
    const row=await cloudGetRun(runId);
    if (!row || row.recordType!=='run') return res.json({ ok:true, found:false, storage:'cloud' });
    const rank=await cloudRunRank(row.score);
    return res.json({ ok:true, found:true, verified:true, storage:'cloud', rank, record:row });
  } catch (e) {
    console.error('[run cloud]', e.message);
    return res.status(503).json({ ok:false, error:'CLOUD_RUN_LOOKUP_FAILED' });
  }
});

app.get('/api/pvp/profile/:playerId',async(req,res)=>{const playerId=String(req.params.playerId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);if(!playerId)return res.status(400).json({ok:false});try{const p=await withTimeout(cloudGetPvpProfile(playerId),5000,'PVP_PROFILE_TIMEOUT');return res.json({ok:true,...p});}catch(e){return res.status(503).json({ok:false,error:'PVP_PROFILE_UNAVAILABLE'});}});
app.get('/api/pvp/leaderboard',async(_req,res)=>{res.set('Cache-Control','no-store');try{return res.json(await withTimeout(cloudGetPvpLeaderboard(50),6500,'PVP_BOARD_TIMEOUT'));}catch(e){return res.status(503).json({ok:false,error:'PVP_LEADERBOARD_UNAVAILABLE'});}});

io.on('connection',socket=>{
  socket.on('pvp:queue',payload=>{try{removeFromQueue(socket.id);const playerId=String(payload?.playerId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);const nick=nicknameAllowed(payload?.nickname||'');const classId=String(payload?.classId||'').slice(0,24),className=String(payload?.className||'').slice(0,12);if(!playerId||!nick.ok)return socket.emit('pvp:error',{message:'이름 또는 플레이어 정보가 올바르지 않습니다.'});removePlayerFromQueue(playerId);const active=[...pvpMatches.values()].some(m=>!m.resolved&&m.players.some(x=>x.playerId===playerId));if(active)return socket.emit('pvp:error',{message:'이미 진행 중인 PVP 경기가 있습니다.'});const p={socketId:socket.id,playerId,nickname:nick.value,classId,className,connected:true};pvpQueue.push(p);pvpSocketPlayer.set(socket.id,p);socket.emit('pvp:queue',{position:pvpQueue.length});tryPvpMatch();}catch(e){socket.emit('pvp:error',{message:'매칭을 시작하지 못했습니다.'});}});
  socket.on('pvp:cancel',()=>{removeFromQueue(socket.id);pvpSocketPlayer.delete(socket.id);});
  socket.on('pvp:update',payload=>{const match=pvpMatches.get(String(payload?.matchId||''));if(!match||match.resolved)return;const p=match.players.find(x=>x.playerId===String(payload?.playerId||''));if(!p||p.socketId!==socket.id)return;p.score=pvpSnapshotScore(payload);p.progress=n(payload?.progress??payload?.stats?.progress,500);p.hp=n(payload?.hp,999);p.gold=n(payload?.gold,100000);p.connected=true;broadcastPvp(match);});
  socket.on('pvp:finish',payload=>{const match=pvpMatches.get(String(payload?.matchId||''));if(!match||match.resolved)return;const p=match.players.find(x=>x.playerId===String(payload?.playerId||''));if(!p||p.socketId!==socket.id)return;p.score=pvpSnapshotScore(payload);p.progress=n(payload?.progress??payload?.stats?.progress,500);p.hp=n(payload?.hp,999);p.gold=n(payload?.gold,100000);p.finished=true;p.ending=String(payload?.ending||payload?.stats?.ending||'').slice(0,30);broadcastPvp(match);if(match.players.every(x=>x.finished))finalizePvpMatch(match,null,'finished');});
  socket.on('pvp:forfeit',payload=>{const match=pvpMatches.get(String(payload?.matchId||''));if(!match||match.resolved)return;const loser=match.players.find(x=>x.playerId===String(payload?.playerId||''));if(!loser)return;const winner=pvpOpponent(match,loser.playerId);if(winner)finalizePvpMatch(match,winner.playerId,'forfeit');});
  socket.on('pvp:resume',payload=>{const match=pvpMatches.get(String(payload?.matchId||''));if(!match||match.resolved)return socket.emit('pvp:error',{message:'이미 끝난 경기입니다.'});const p=match.players.find(x=>x.playerId===String(payload?.playerId||''));if(!p)return;clearTimeout(p.disconnectTimer);p.socketId=socket.id;p.connected=true;pvpSocketPlayer.set(socket.id,p);const o=pvpOpponent(match,p.playerId);socket.emit('pvp:match',{matchId:match.id,you:publicPvpPlayer(p),opponent:publicPvpPlayer(o),resumed:true,limitSeconds:Math.max(0,Math.floor((match.createdAt+30*60*1000-Date.now())/1000))});broadcastPvp(match);});
  socket.on('disconnect',()=>{removeFromQueue(socket.id);const p=pvpSocketPlayer.get(socket.id);pvpSocketPlayer.delete(socket.id);if(!p?.matchId)return;const match=pvpMatches.get(p.matchId);if(!match||match.resolved)return;p.connected=false;broadcastPvp(match);p.disconnectTimer=setTimeout(()=>{if(match.resolved||p.connected)return;const winner=pvpOpponent(match,p.playerId);if(winner)finalizePvpMatch(match,winner.playerId,'disconnect');},20000);});
});

app.post('/api/score', async (req, res) => {
  const body = req.body || {};
  const playerId = String(body.playerId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0,80);
  if (!playerId) return res.status(400).json({ ok:false, error:'PLAYER_ID_REQUIRED' });

  const nickCheck=nicknameAllowed(body.nickname || '익명');
  if(!nickCheck.ok)return res.status(400).json({ok:false,error:'NICKNAME_NOT_ALLOWED'});
  const nickname=nickCheck.value;
  const className = String(body.className || '?').trim().slice(0,12);
  const stats = body.stats || {};
  const ending = String(stats.ending || 'BAD END').slice(0,30);
  const score = scoreRun(stats);
  const entry = {
    playerId, nickname, className, ending, score,
    gameMode:String(stats.gameMode||'').toLowerCase()==='hard'?'hard':'normal',
    hardRoute:String(stats.hardRoute||'').slice(0,40),
    kills:n(stats.kills,200), gold:n(stats.goldHeld,100000), progress:n(stats.progress,500)
  };

  if (CLOUD_CONFIGURED) {
    if(!CLOUD_WRITABLE)return res.status(503).json({ok:false,permanent:false,verified:false,queued:true,storage:'local-backup',submittedScore:score,error:'SERVER_SECRET_KEY_REQUIRED'});
    try {
      const previous = await cloudGetPlayer(playerId);
      const previousScore = previous ? Number(previous.score || 0) : null;
      const shouldUpdate = !previous || score > previousScore;
      const recordStatus = !previous ? 'created' : shouldUpdate ? 'updated' : 'registered';

      // Every finished run is permanently inserted, even when it is lower than the old best.
      const insertedRun = await cloudInsertRun(entry, stats);
      const verifiedRun = await cloudGetRun(insertedRun.rowId);
      if (!verifiedRun || Number(verifiedRun.score)!==Number(score) || verifiedRun.recordType!=='run') {
        throw new Error('VERIFY_RUN_MISSING_OR_MISMATCH');
      }

      let bestScore = previous ? previousScore : score;
      let verifiedRow = previous;
      if (shouldUpdate) {
        if (previous && previous.recordType === 'legacy') {
          await cloudInsertRun({
            playerId, nickname:previous.nickname, className:previous.className, ending:previous.ending,
            score:previous.score, kills:previous.kills, gold:previous.gold, progress:previous.progress
          }, { recordType:'run', ownerPlayerId:playerId, migratedLegacy:true });
        }
        await cloudUpsert(entry, stats);
        verifiedRow = await verifyCloudRecord(playerId, score);
        bestScore = verifiedRow.score;
      } else {
        if (previous.nickname !== nickname) await cloudUpdateNickname(playerId, nickname);
        verifiedRow = await verifyCloudRecord(playerId, previousScore);
        if (verifiedRow.nickname !== nickname) throw new Error('VERIFY_NICKNAME_MISMATCH');
        bestScore = verifiedRow.score;
      }

      const bestRank = await cloudRank(bestScore);
      const submittedRank = await cloudRunRank(score);
      localSubmit({ ...entry, score:bestScore, nickname:verifiedRow.nickname, ending:verifiedRow.ending, className:verifiedRow.className });

      const leaderboardProbe = await cloudGetLeaderboard(50);
      const visibleInTop50 = leaderboardProbe.some(x => x.rowId === verifiedRun.rowId);
      if (submittedRank <= 50 && !visibleInTop50) throw new Error('VERIFY_LEADERBOARD_RUN_MISSING');
      return res.json({
        ok:true,
        permanent:true,
        verified:true,
        storage:'cloud',
        recordStatus,
        isBest:shouldUpdate,
        submittedScore:score,
        previousBest:previousScore,
        bestScore,
        rank:bestRank,
        submittedRank,
        runId:verifiedRun.rowId,
        leaderboardVisible: submittedRank > 50 || visibleInTop50,
        record:verifiedRow,
        runRecord:verifiedRun,
      });
    } catch (e) {
      console.error('[score cloud]', e.message);
      // Keep a temporary local copy, but NEVER report this as a successful permanent registration.
      localSubmit(entry);
      return res.status(503).json({
        ok:false,
        permanent:false,
        verified:false,
        queued:true,
        storage:'local-backup',
        submittedScore:score,
        error:'CLOUD_SAVE_OR_VERIFY_FAILED'
      });
    }
  }

  const local = localSubmit(entry);
  return res.status(202).json({
    ok:false,
    permanent:false,
    verified:false,
    queued:true,
    storage:'local',
    submittedScore:score,
    bestScore:local.bestScore,
    rank:local.rank,
    error:'PERMANENT_DB_NOT_CONFIGURED'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok:true, storage:CLOUD_CONFIGURED?'cloud-configured':'local', version:'0.9.30' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n몰락자 v0.9.30`);
  console.log(`http://localhost:${PORT}`);
  console.log(`랭킹 설정: ${CLOUD_CONFIGURED ? 'Supabase 환경변수 있음 (실연결은 /api/storage에서 검증)' : '로컬 파일'}\n`);
});
