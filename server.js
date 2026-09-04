const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'scores.json');
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SECRET_KEY = String(process.env.SUPABASE_SECRET_KEY || '');
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const SUPABASE_KEY = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_KEY_IS_NEW = SUPABASE_KEY.startsWith('sb_secret_');
const CLOUD_CONFIGURED = !!(SUPABASE_URL && SUPABASE_KEY);
const supabase = CLOUD_CONFIGURED ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken:false, persistSession:false, detectSessionInUrl:false },
  global: { headers: { 'X-Client-Info': 'fallen-rpg-render-server/0.9.4' } }
}) : null;

app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, 'public')));

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
  '모두와 친구': 18000,
  '지배자': 15000,
};

function n(v, max = 100000) {
  const x = Number(v);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(max, Math.floor(x)));
}

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
  const ending = String(s.ending || 'BAD END').slice(0, 30);

  let score = 0;
  score += progress * 115;
  score += goldEarned * 3;
  score += Math.floor(goldHeld * 1.2);
  score += kills * 170;
  score += eliteKills * 950;
  score += riskyWins * 650;
  score += comebackWins * 900;
  score += talkSolved * 170;
  score += socialSuccess * 185;
  score += runSuccess * 85;
  score += secrets * 500;
  score += survivors * 220;
  score += growths * 140;
  score -= socialFail * 25;
  score -= overTalks * 90;
  score += ENDING_BONUS[ending] || 0;
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
    .select('player_id,nickname,class_name,ending,score,kills,gold,progress,updated_at')
    .order('score', { ascending:false })
    .order('updated_at', { ascending:true })
    .limit(Math.max(1, Math.min(200, Number(limit)||50)));
  if (error) throw new Error(`SUPABASE_LEADERBOARD:${error.message}`);
  return (data || []).map(mapCloudRow);
}

async function cloudGetPlayer(playerId) {
  const { data, error } = await supabase
    .from('fallen_scores')
    .select('player_id,nickname,class_name,ending,score,kills,gold,progress,updated_at')
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
    .select('player_id,nickname,class_name,ending,score,kills,gold,progress,updated_at')
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
    stats,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('fallen_scores')
    .upsert(body, { onConflict:'player_id' })
    .select('player_id,nickname,class_name,ending,score,kills,gold,progress,updated_at')
    .single();
  if (error) throw new Error(`SUPABASE_UPSERT:${error.message}`);
  return data;
}

async function cloudRank(score) {
  const { count, error } = await supabase
    .from('fallen_scores')
    .select('player_id', { count:'exact', head:true })
    .gt('score', Math.floor(score));
  if (error) throw new Error(`SUPABASE_RANK:${error.message}`);
  return Number(count || 0) + 1;
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
  return {
    playerId: x.player_id,
    nickname: x.nickname,
    className: x.class_name,
    ending: x.ending,
    score: Number(x.score || 0),
    kills: Number(x.kills || 0),
    gold: Number(x.gold || 0),
    progress: Number(x.progress || 0),
    time: x.updated_at ? Date.parse(x.updated_at) : Date.now(),
  };
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
  try {
    await cloudGetLeaderboard(1);
    return res.json({ ok:true, mode:'cloud', configured:true, connected:true, permanent:true });
  } catch (e) {
    console.error('[storage cloud]', e.message);
    return res.json({ ok:false, mode:'cloud-error', configured:true, connected:false, permanent:false, error:'CLOUD_DB_UNREACHABLE' });
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

app.post('/api/score', async (req, res) => {
  const body = req.body || {};
  const playerId = String(body.playerId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0,80);
  if (!playerId) return res.status(400).json({ ok:false, error:'PLAYER_ID_REQUIRED' });

  const nickname = String(body.nickname || '익명').trim().slice(0,12) || '익명';
  const className = String(body.className || '?').trim().slice(0,12);
  const stats = body.stats || {};
  const ending = String(stats.ending || 'BAD END').slice(0,30);
  const score = scoreRun(stats);
  const entry = {
    playerId, nickname, className, ending, score,
    kills:n(stats.kills,200), gold:n(stats.goldHeld,100000), progress:n(stats.progress,500)
  };

  if (CLOUD_CONFIGURED) {
    try {
      const previous = await cloudGetPlayer(playerId);
      const previousScore = previous ? Number(previous.score || 0) : null;
      const shouldUpdate = !previous || score > previousScore;
      const recordStatus = !previous ? 'created' : shouldUpdate ? 'updated' : 'kept';

      let bestScore = previous ? previousScore : score;
      let verifiedRow = previous;

      if (shouldUpdate) {
        await cloudUpsert(entry, stats);
        verifiedRow = await verifyCloudRecord(playerId, score);
        bestScore = verifiedRow.score;
      } else {
        // A lower run does not replace the best gameplay record, but the display nickname may still be changed.
        if (previous.nickname !== nickname) await cloudUpdateNickname(playerId, nickname);
        // Even when this run is lower, verify that the permanent best record really exists.
        verifiedRow = await verifyCloudRecord(playerId, previousScore);
        if (verifiedRow.nickname !== nickname) throw new Error('VERIFY_NICKNAME_MISMATCH');
        bestScore = verifiedRow.score;
      }

      const rank = await cloudRank(bestScore);
      // Keep a best-effort local mirror for diagnostics; cloud remains the source of truth.
      localSubmit({ ...entry, score:bestScore, nickname:verifiedRow.nickname, ending:verifiedRow.ending, className:verifiedRow.className });
      // The public ranking must be able to read the same row too. Never report success when
      // the player row exists but the TOP 50 query cannot actually see it.
      const leaderboardProbe = await cloudGetLeaderboard(50);
      const visibleInTop50 = leaderboardProbe.some(x => x.playerId === playerId);
      if (rank <= 50 && !visibleInTop50) throw new Error('VERIFY_LEADERBOARD_ROW_MISSING');
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
        rank,
        leaderboardVisible: rank > 50 || visibleInTop50,
        record:verifiedRow,
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
  res.json({ ok:true, storage:CLOUD_CONFIGURED?'cloud-configured':'local', version:'0.9.4' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n몰락자 Normal Mode v0.9.4`);
  console.log(`http://localhost:${PORT}`);
  console.log(`랭킹 설정: ${CLOUD_CONFIGURED ? 'Supabase 환경변수 있음 (실연결은 /api/storage에서 검증)' : '로컬 파일'}\n`);
});
