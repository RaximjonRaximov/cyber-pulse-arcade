// CYBER PULSE ARCADE ENGINE
// Built with pure HTML5 Canvas, Web Audio API, and Modern JS

(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER (Pure Web Audio API, zero assets) ---
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    laser() {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    }

    explosion(isBoss = false) {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(isBoss ? 150 : 220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + (isBoss ? 0.6 : 0.3));
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (isBoss ? 0.6 : 0.3));
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + (isBoss ? 0.6 : 0.3));
    }

    powerup() {
      if (!this.enabled || !this.ctx) return;
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (i * 0.05));
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + (i * 0.05));
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (i * 0.05) + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + (i * 0.05));
        osc.stop(this.ctx.currentTime + (i * 0.05) + 0.1);
      });
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }
  }

  // --- GAME STATE & CONSTANTS ---
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const sound = new SoundFX();

  const state = {
    running: false,
    score: 0,
    wave: 1,
    combo: 1,
    comboTimer: 0,
    shotsFired: 0,
    shotsHit: 0,
    shield: 100,
    maxShield: 100,
    screenShake: 0
  };

  const keys = {};
  const particles = [];
  const stars = [];
  const bullets = [];
  const enemyBullets = [];
  const enemies = [];
  const floatingTexts = [];

  let player = null;
  let animFrameId = null;
  let lastTime = 0;

  // --- RESIZE HANDLER ---
  function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // --- BACKGROUND STARFIELD ---
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 2 + 0.5,
      size: Math.random() * 2 + 0.5,
      color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f'
    });
  }

  // --- PLAYER OBJECT ---
  class PlayerShip {
    constructor() {
      this.width = 36;
      this.height = 42;
      this.x = canvas.width / 2;
      this.y = canvas.height - 100;
      this.vx = 0;
      this.vy = 0;
      this.speed = 6.5;
      this.lastShot = 0;
      this.shootCooldown = 160; // ms
      this.tripleShotTimer = 0;
    }

    update(dt) {
      let dx = 0;
      let dy = 0;

      if (keys['ArrowLeft'] || keys['KeyA'] || keys['left']) dx -= 1;
      if (keys['ArrowRight'] || keys['KeyD'] || keys['right']) dx += 1;
      if (keys['ArrowUp'] || keys['KeyW'] || keys['up']) dy -= 1;
      if (keys['ArrowDown'] || keys['KeyS'] || keys['down']) dy += 1;

      const boost = keys['ShiftLeft'] || keys['ShiftRight'] ? 1.4 : 1.0;
      this.vx = dx * this.speed * boost;
      this.vy = dy * this.speed * boost;

      this.x += this.vx;
      this.y += this.vy;

      // Bound within canvas
      this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
      this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));

      // Thruster particles
      if (Math.random() < 0.6) {
        particles.push(new Particle(
          this.x + (Math.random() * 10 - 5),
          this.y + this.height / 2,
          (Math.random() - 0.5) * 1.5,
          Math.random() * 3 + 2,
          '#00f3ff',
          Math.random() * 3 + 2,
          20
        ));
      }

      // Shooting
      if ((keys['Space'] || keys['fire']) && Date.now() - this.lastShot > this.shootCooldown) {
        this.shoot();
      }

      if (this.tripleShotTimer > 0) {
        this.tripleShotTimer -= dt;
      }
    }

    shoot() {
      this.lastShot = Date.now();
      state.shotsFired++;
      sound.laser();

      if (this.tripleShotTimer > 0) {
        bullets.push(new Bullet(this.x, this.y - 20, 0, -11));
        bullets.push(new Bullet(this.x - 12, this.y - 14, -2, -10));
        bullets.push(new Bullet(this.x + 12, this.y - 14, 2, -10));
      } else {
        bullets.push(new Bullet(this.x - 10, this.y - 16, 0, -11));
        bullets.push(new Bullet(this.x + 10, this.y - 16, 0, -11));
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Ship Neon Glow
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 15;

      // Ship body
      ctx.strokeStyle = '#00f3ff';
      ctx.fillStyle = '#061727';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(0, -this.height / 2);
      ctx.lineTo(this.width / 2, this.height / 2);
      ctx.lineTo(0, this.height / 3);
      ctx.lineTo(-this.width / 2, this.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Shield Aura
      if (state.shield > 25) {
        ctx.strokeStyle = `rgba(0, 255, 128, ${state.shield / 200})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.height * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // --- PROJECTILE CLASS ---
  class Bullet {
    constructor(x, y, vx, vy, isEnemy = false) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.isEnemy = isEnemy;
      this.radius = isEnemy ? 4 : 3;
      this.alive = true;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -20 || this.y > canvas.height + 20 || this.x < -20 || this.x > canvas.width + 20) {
        this.alive = false;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.fillStyle = this.isEnemy ? '#ff3344' : '#00f3ff';
      ctx.shadowColor = this.isEnemy ? '#ff3344' : '#00f3ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // --- ENEMY CLASSES ---
  class Enemy {
    constructor(wave) {
      this.isBoss = wave % 5 === 0 && Math.random() < 0.25;
      this.radius = this.isBoss ? 38 : (Math.random() * 8 + 14);
      this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
      this.y = -this.radius;
      this.hp = this.isBoss ? (30 + wave * 10) : (1 + Math.floor(wave / 2));
      this.maxHp = this.hp;
      this.speed = this.isBoss ? 1.0 : (Math.random() * 1.5 + 1.2 + wave * 0.15);
      this.angle = 0;
      this.points = this.isBoss ? 1000 : 150;
      this.shootCooldown = Math.random() * 120 + 80;
      this.shootTimer = 0;
      this.alive = true;
    }

    update() {
      this.y += this.speed;
      this.angle += 0.02;

      // Hunter/Boss attack
      this.shootTimer++;
      if (this.shootTimer > this.shootCooldown) {
        this.shootTimer = 0;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          enemyBullets.push(new Bullet(this.x, this.y, (dx / dist) * 4.5, (dy / dist) * 4.5, true));
        }
      }

      if (this.y > canvas.height + 50) {
        this.alive = false;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      ctx.shadowColor = this.isBoss ? '#ffee00' : '#ff007f';
      ctx.shadowBlur = this.isBoss ? 20 : 10;
      ctx.strokeStyle = this.isBoss ? '#ffee00' : '#ff007f';
      ctx.fillStyle = '#170617';
      ctx.lineWidth = 2;

      // Draw geometry
      ctx.beginPath();
      const sides = this.isBoss ? 8 : 4;
      for (let i = 0; i < sides; i++) {
        const rad = (i * 2 * Math.PI) / sides;
        const px = Math.cos(rad) * this.radius;
        const py = Math.sin(rad) * this.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Boss Health Bar
      if (this.isBoss) {
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(this.x - 40, this.y - this.radius - 12, 80, 6);
        ctx.fillStyle = '#ffee00';
        ctx.fillRect(this.x - 40, this.y - this.radius - 12, (this.hp / this.maxHp) * 80, 6);
      }

      ctx.restore();
    }
  }

  // --- PARTICLES & FLOATING TEXT ---
  class Particle {
    constructor(x, y, vx, vy, color, size, life) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.life = life;
      this.maxLife = life;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(text, x, y, color) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = 40;
    }
    update() {
      this.y -= 1.2;
      this.life--;
    }
    draw(ctx) {
      ctx.save();
      ctx.font = 'bold 16px Orbitron';
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.max(0, this.life / 40);
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // --- SPAWN SYSTEM ---
  let spawnCooldown = 1000;
  let lastSpawn = 0;

  function spawnWave() {
    const now = Date.now();
    if (now - lastSpawn > spawnCooldown) {
      lastSpawn = now;
      enemies.push(new Enemy(state.wave));
      if (enemies.length % 15 === 0) {
        state.wave++;
        document.getElementById('wave-display').textContent = state.wave;
        floatingTexts.push(new FloatingText(`WAVE ${state.wave} ENGAGED`, canvas.width / 2 - 80, canvas.height / 2, '#ffee00'));
        spawnCooldown = Math.max(400, 1000 - state.wave * 50);
      }
    }
  }

  // --- COLLISION LOGIC ---
  function checkCollisions() {
    // Bullets vs Enemies
    bullets.forEach(b => {
      enemies.forEach(e => {
        if (!b.alive || !e.alive) return;
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < e.radius + b.radius) {
          b.alive = false;
          e.hp--;
          state.shotsHit++;

          // Sparks
          for (let p = 0; p < 4; p++) {
            particles.push(new Particle(b.x, b.y, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, '#00f3ff', 2, 15));
          }

          if (e.hp <= 0) {
            e.alive = false;
            sound.explosion(e.isBoss);

            // Combo calculation
            state.combo++;
            state.comboTimer = 180;
            const pointsEarned = e.points * state.combo;
            state.score += pointsEarned;

            // Explosion particles
            const count = e.isBoss ? 45 : 18;
            for (let p = 0; p < count; p++) {
              particles.push(new Particle(
                e.x, e.y,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                e.isBoss ? '#ffee00' : '#ff007f',
                Math.random() * 4 + 2,
                30
              ));
            }

            floatingTexts.push(new FloatingText(`+${pointsEarned}`, e.x, e.y, '#00f3ff'));

            // Random power-up drop
            if (Math.random() < 0.15) {
              player.tripleShotTimer = 8000;
              sound.powerup();
              floatingTexts.push(new FloatingText('TRIPLE LASER!', player.x, player.y - 30, '#00ff66'));
            }
          }
        }
      });
    });

    // Enemy bullets vs Player
    enemyBullets.forEach(b => {
      if (!b.alive) return;
      const dist = Math.hypot(b.x - player.x, b.y - player.y);
      if (dist < player.height / 2 + b.radius) {
        b.alive = false;
        takeDamage(15);
      }
    });

    // Enemy ship vs Player ship
    enemies.forEach(e => {
      if (!e.alive) return;
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < player.height / 2 + e.radius) {
        e.alive = false;
        takeDamage(35);
      }
    });
  }

  function takeDamage(amount) {
    state.shield = Math.max(0, state.shield - amount);
    state.combo = 1;
    state.screenShake = 12;
    sound.explosion();

    const shieldBar = document.getElementById('shield-bar');
    shieldBar.style.width = `${state.shield}%`;
    if (state.shield < 30) {
      shieldBar.style.background = '#ff3344';
      shieldBar.style.boxShadow = '0 0 10px #ff3344';
    } else {
      shieldBar.style.background = 'linear-gradient(90deg, #00ff66, #00f3ff)';
      shieldBar.style.boxShadow = '0 0 10px #00f3ff';
    }

    if (state.shield <= 0) {
      gameOver();
    }
  }

  // --- GAME LOOP ---
  function loop(timestamp) {
    const dt = timestamp - lastTime || 16;
    lastTime = timestamp;

    ctx.save();

    // Screen Shake
    if (state.screenShake > 0) {
      const sx = (Math.random() - 0.5) * state.screenShake;
      const sy = (Math.random() - 0.5) * state.screenShake;
      ctx.translate(sx, sy);
      state.screenShake *= 0.85;
      if (state.screenShake < 0.5) state.screenShake = 0;
    }

    // Clear Canvas with subtle trail effect
    ctx.fillStyle = 'rgba(7, 7, 18, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) s.y = 0;
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    if (state.running) {
      // Combo decay
      if (state.comboTimer > 0) {
        state.comboTimer--;
      } else {
        state.combo = 1;
      }

      // Update HUD
      document.getElementById('score-display').textContent = state.score;
      document.getElementById('combo-display').textContent = `x${state.combo}`;

      player.update(dt);
      player.draw(ctx);

      spawnWave();
      checkCollisions();

      // Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        bullets[i].draw(ctx);
        if (!bullets[i].alive) bullets.splice(i, 1);
      }

      // Enemy Bullets
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].update();
        enemyBullets[i].draw(ctx);
        if (!enemyBullets[i].alive) enemyBullets.splice(i, 1);
      }

      // Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        enemies[i].draw(ctx);
        if (!enemies[i].alive) enemies.splice(i, 1);
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(ctx);
      if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // Floating text
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      floatingTexts[i].update();
      floatingTexts[i].draw(ctx);
      if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    ctx.restore();
    animFrameId = requestAnimationFrame(loop);
  }

  // --- GAME LIFECYCLE ---
  function startGame() {
    sound.init();
    state.running = true;
    state.score = 0;
    state.wave = 1;
    state.combo = 1;
    state.shield = state.maxShield;
    state.shotsFired = 0;
    state.shotsHit = 0;

    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;

    player = new PlayerShip();

    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('shield-bar').style.width = '100%';
    document.getElementById('score-display').textContent = '0';
    document.getElementById('wave-display').textContent = '1';
    document.getElementById('combo-display').textContent = 'x1';
  }

  function gameOver() {
    state.running = false;
    const accuracy = state.shotsFired > 0 ? Math.round((state.shotsHit / state.shotsFired) * 100) : 0;

    document.getElementById('final-wave').textContent = state.wave;
    document.getElementById('final-score').textContent = state.score;
    document.getElementById('final-accuracy').textContent = `${accuracy}%`;
    document.getElementById('game-over-screen').classList.add('active');
  }

  // --- API & LEADERBOARD LOGIC ---
  async function fetchLeaderboard() {
    const tableBody = document.getElementById('leaderboard-rows');
    tableBody.innerHTML = '<tr><td colspan="4" class="loading-cell">Loading ranking mainframe...</td></tr>';

    try {
      const res = await fetch('/api/scores?limit=10');
      const data = await res.json();
      tableBody.innerHTML = '';

      if (!data.scores || data.scores.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="loading-cell">No pilots recorded yet.</td></tr>';
        return;
      }

      data.scores.forEach((entry, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>#${idx + 1}</td>
          <td class="glow-cyan">${escapeHtml(entry.player)}</td>
          <td>${entry.wave}</td>
          <td class="glow-pink">${entry.score.toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
      });
    } catch (err) {
      tableBody.innerHTML = '<tr><td colspan="4" class="loading-cell">Backend offline: running in local mode.</td></tr>';
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  // --- EVENT LISTENERS ---
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-restart').addEventListener('click', startGame);

  document.getElementById('btn-sound').addEventListener('click', () => {
    sound.init();
    const active = sound.toggle();
    document.getElementById('btn-sound').textContent = active ? '🔊' : '🔇';
  });

  document.getElementById('btn-leaderboard').addEventListener('click', () => {
    document.getElementById('leaderboard-modal').classList.add('active');
    fetchLeaderboard();
  });

  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('leaderboard-modal').classList.remove('active');
  });

  // Mobile D-pad
  document.querySelectorAll('.dpad-btn').forEach(btn => {
    const dir = btn.dataset.dir;
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[dir] = true; });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[dir] = false; });
  });

  const fireBtn = document.getElementById('touch-fire');
  fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys['fire'] = true; });
  fireBtn.addEventListener('touchend', (e) => { e.preventDefault(); keys['fire'] = false; });

  // Submit Score Form
  document.getElementById('save-score-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('player-input');
    const playerCallsign = input.value.trim() || 'ANONYMOUS';
    const accuracy = state.shotsFired > 0 ? Math.round((state.shotsHit / state.shotsFired) * 100) : 0;

    const btnSubmit = document.getElementById('btn-submit-score');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'TRANSMITTING...';

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: playerCallsign,
          score: state.score,
          wave: state.wave,
          accuracy
        })
      });
      const data = await res.json();
      if (res.ok) {
        btnSubmit.textContent = `RANK #${data.rank}!`;
        setTimeout(() => {
          document.getElementById('leaderboard-modal').classList.add('active');
          fetchLeaderboard();
        }, 800);
      } else {
        btnSubmit.textContent = 'ERROR';
      }
    } catch (err) {
      btnSubmit.textContent = 'OFFLINE';
    }
  });

  // Start engine loop
  animFrameId = requestAnimationFrame(loop);

})();
