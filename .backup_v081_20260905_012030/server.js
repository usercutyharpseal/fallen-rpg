const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'scores.json');

app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readScores() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeScores(rows) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(rows, null, 2));
}

const ENDING_BONUS = {
  'BAD END': 0,
  '명예 회복': 5000,
  '반란': 10000,
  '모두와 친구': 12000,
  '지배자': 15000,
};

function n(v, max = 100000) {
  const x = Number(v);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(max, Math.floor(x)));
}

function scoreRun(s = {}) {
  const progress = n(s.progress, 200);
  const goldEarned = n(s.goldEarned, 100000);
  const goldHeld = n(s.goldHeld, 100000);
  const kills = n(s.kills, 100);
  const eliteKills = n(s.eliteKills, 30);
  const riskyWins = n(s.riskyWins, 30);
  const talkSolved = n(s.talkSolved, 100);
  const socialSuccess = n(s.socialSuccess, 100);
  const socialFail = n(s.socialFail, 100);
  const runSuccess = n(s.runSuccess, 100);
  const secrets = n(s.secrets, 30);
  const survivors = n(s.survivors, 30);
  const growths = n(s.growths, 50);
  const ending = String(s.ending || 'BAD END').slice(0, 30);

  let score = 0;
  score += progress * 115;
  score += goldEarned * 3;
  score += Math.floor(goldHeld * 1.2);
  score += kills * 170;
  score += eliteKills * 950;
  score += riskyWins * 650;
  score += talkSolved * 170;
  score += socialSuccess * 185;
  score += runSuccess * 85;
  score += secrets * 500;
  score += survivors * 220;
  score += growths * 140;
  score -= socialFail * 25;
  score += ENDING_BONUS[ending] || 0;
  return Math.max(0, Math.floor(score));
}

app.get('/api/leaderboard', (req, res) => {
  const rows = readScores()
    .sort((a, b) => b.score - a.score || a.time - b.time)
    .slice(0, 50);
  res.json(rows);
});

app.post('/api/score', (req, res) => {
  const body = req.body || {};
  const playerId = String(body.playerId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  if (!playerId) return res.status(400).json({ ok: false, error: 'PLAYER_ID_REQUIRED' });

  const nickname = String(body.nickname || '익명').trim().slice(0, 12) || '익명';
  const className = String(body.className || '?').trim().slice(0, 12);
  const stats = body.stats || {};
  const ending = String(stats.ending || 'BAD END').slice(0, 30);
  const score = scoreRun(stats);

  const entry = {
    id: crypto.randomUUID(),
    playerId,
    nickname,
    className,
    ending,
    score,
    kills: n(stats.kills, 100),
    gold: n(stats.goldHeld, 100000),
    progress: n(stats.progress, 200),
    time: Date.now(),
  };

  let rows = readScores();
  const previous = rows.find(x => x.playerId === playerId);
  let isBest = false;

  if (!previous || score > previous.score) {
    rows = rows.filter(x => x.playerId !== playerId);
    rows.push(entry);
    isBest = true;
    writeScores(rows.slice(-2000));
  }

  const sorted = rows.sort((a, b) => b.score - a.score || a.time - b.time);
  const rank = sorted.findIndex(x => x.playerId === playerId) + 1;
  res.json({ ok: true, score, isBest, rank });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n몰락자 Normal Mode v0.8`);
  console.log(`http://localhost:${PORT}\n`);
});
