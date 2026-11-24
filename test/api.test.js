const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server.js');

let server;
let baseUrl;

test.before((t, done) => {
  server = http.createServer(app);
  server.listen(0, () => {
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

test.after((t, done) => {
  server.close(done);
});

test('GET /api/health returns status ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'cyber-pulse-arcade-api');
  assert.ok(typeof data.uptime === 'number');
});

test('GET /api/scores returns seed leaderboard list', async () => {
  const res = await fetch(`${baseUrl}/api/scores?limit=5`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.scores));
  assert.ok(data.scores.length >= 1);
  assert.ok(data.scores[0].score >= data.scores[data.scores.length - 1].score);
});

test('POST /api/scores submits new valid highscore', async () => {
  const payload = {
    player: 'TEST_PILOT',
    score: 99999,
    wave: 15,
    accuracy: 95
  };

  const res = await fetch(`${baseUrl}/api/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.rank, 1);
  assert.equal(data.entry.player, 'TEST_PILOT');
  assert.equal(data.entry.score, 99999);
});

test('POST /api/scores rejects invalid score submission', async () => {
  const invalidPayload = {
    player: '',
    score: -100
  };

  const res = await fetch(`${baseUrl}/api/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidPayload)
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error);
});

test('GET /api/stats returns cumulative aggregate stats', async () => {
  const res = await fetch(`${baseUrl}/api/stats`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.totalGames > 0);
  assert.ok(data.highestScore >= 99999);
  assert.equal(data.topPlayer, 'TEST_PILOT');
});
