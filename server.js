const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory leaderboard store with initial seed records
const scores = [
  { id: '1', player: 'NEON_RIDER', score: 18500, wave: 12, accuracy: 89, date: '2026-11-20T10:00:00Z' },
  { id: '2', player: 'CYBER_VIPER', score: 14200, wave: 9, accuracy: 84, date: '2026-11-21T14:30:00Z' },
  { id: '3', player: 'SYNTH_GHOST', score: 11950, wave: 8, accuracy: 91, date: '2026-11-22T08:15:00Z' },
  { id: '4', player: 'PULSE_KNIGHT', score: 9800, wave: 6, accuracy: 78, date: '2026-11-23T19:45:00Z' },
  { id: '5', player: 'PIXEL_ZERO', score: 7600, wave: 5, accuracy: 73, date: '2026-11-24T05:20:00Z' }
];

let totalGames = scores.length;

// System health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'cyber-pulse-arcade-api',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Leaderboard list
app.get('/api/scores', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const sorted = [...scores].sort((a, b) => b.score - a.score).slice(0, limit);
  res.json({ count: sorted.length, scores: sorted });
});

// Submit new high score
app.post('/api/scores', (req, res) => {
  const { player, score, wave, accuracy } = req.body || {};

  // Validation
  if (!player || typeof player !== 'string' || player.trim().length < 2 || player.trim().length > 20) {
    return res.status(400).json({ error: 'Player name must be between 2 and 20 characters.' });
  }

  const cleanPlayer = player.trim().replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
  const numScore = Number(score);
  const numWave = Number(wave);
  const numAccuracy = Number(accuracy) || 0;

  if (Number.isNaN(numScore) || numScore < 0 || numScore > 1000000) {
    return res.status(400).json({ error: 'Invalid score value.' });
  }

  if (Number.isNaN(numWave) || numWave < 1 || numWave > 100) {
    return res.status(400).json({ error: 'Invalid wave number.' });
  }

  const newEntry = {
    id: String(Date.now()),
    player: cleanPlayer || 'ANONYMOUS',
    score: Math.floor(numScore),
    wave: Math.floor(numWave),
    accuracy: Math.min(100, Math.max(0, Math.floor(numAccuracy))),
    date: new Date().toISOString()
  };

  scores.push(newEntry);
  totalGames += 1;

  scores.sort((a, b) => b.score - a.score);
  const rank = scores.findIndex(s => s.id === newEntry.id) + 1;

  res.status(201).json({
    success: true,
    message: 'Score recorded successfully!',
    rank,
    entry: newEntry
  });
});

// Global game stats
app.get('/api/stats', (req, res) => {
  const highestScore = scores.reduce((max, s) => (s.score > max ? s.score : max), 0);
  const topPlayer = scores[0] ? scores[0].player : 'NONE';
  const totalScoreSum = scores.reduce((acc, s) => acc + s.score, 0);

  res.json({
    totalGames,
    recordedScores: scores.length,
    highestScore,
    topPlayer,
    averageScore: scores.length ? Math.round(totalScoreSum / scores.length) : 0
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[CyberPulse Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = app;
