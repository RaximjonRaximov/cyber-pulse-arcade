# ⚡ CYBER PULSE // Retro Arcade & Leaderboard API

[![CI Pipeline](https://github.com/RaximjonRaximov/cyber-pulse-arcade/actions/workflows/ci.yml/badge.svg)](https://github.com/RaximjonRaximov/cyber-pulse-arcade/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

> **CYBER PULSE** is an adrenaline-fueled cyberpunk retro arcade shooter and sound visualizer powered by pure HTML5 Canvas, the Web Audio API, and an Express REST backend with real-time leaderboard management.

---

## 🌟 Key Features

- **🎮 High-Octane Canvas Engine:**
  - 60+ FPS vector-rendered player spacecraft with inertia physics and thruster exhaust.
  - Multi-tier enemy ecosystem: Scout Drones, Stalker Cruisers, and Giant Wave Bosses.
  - Dynamic combo multipliers that reward flawless dodges and high-speed kills.
  - Procedural power-up drop system: *Triple Lasers*, *Plasma Shield Overcharge*, and *Time Warp*.
  - Cyberpunk screen-shake physics, laser sparks, explosion debris, and floating combat text.

- **🔊 Pure Web Audio Synthesizer:**
  - Procedural sound generation directly in code without downloading static `.mp3` or `.wav` assets.
  - Square-wave explosion bass rumbles, sawtooth laser zaps, and harmonious arpeggio power-up chimes.

- **⚡ Full-Stack REST API Backend:**
  - `GET /api/health` — Microservice uptime and telemetry.
  - `GET /api/scores` — Global leaderboard rankings (sorted descending, paginated).
  - `POST /api/scores` — Anti-cheat verified high-score transmission.
  - `GET /api/stats` — Aggregate metrics: total games, average scores, and reigning champion.

- **📱 Cross-Platform Ready:**
  - Full keyboard support (`WASD`, arrow keys, Spacebar, Shift boost).
  - Virtual Touch D-pad and responsive fire button for mobile screens.
  - Dark glassmorphic HUD styled with neon glows (`#00f3ff`, `#ff007f`, `#ffee00`).

- **🐳 Production Ready:**
  - Multi-stage lightweight `Dockerfile` (Alpine Linux).
  - Built-in test suite with zero test dependencies (`node:test`).
  - Automated GitHub Actions CI pipeline.

---

## 🚀 Quick Start

### 1. Local Run (Node.js)

```bash
# Clone the repository
git clone https://github.com/RaximjonRaximov/cyber-pulse-arcade.git
cd cyber-pulse-arcade

# Install dependencies
npm install

# Run automated tests
npm test

# Start the game server
npm start
```

Now open **`http://localhost:3000`** in your browser.

---

### 2. Run with Docker

```bash
# Build Docker image
docker build -t cyber-pulse-arcade .

# Run container
docker run -d -p 3000:3000 --name cyber-arcade cyber-pulse-arcade
```

---

## 🕹️ Controls Guide

| Action | Desktop Key | Mobile Screen |
| :--- | :--- | :--- |
| **Move Pilot** | `W`, `A`, `S`, `D` / Arrow Keys | Virtual D-Pad |
| **Fire Lasers** | `Spacebar` / Mouse Click | Red `FIRE` Button |
| **Hyperspace Boost** | `Shift` Key | - |
| **Toggle Audio** | Top HUD Speaker Icon | Top HUD Speaker Icon |
| **Leaderboard** | Top HUD Trophy Icon | Top HUD Trophy Icon |

---

## 📡 API Reference

### 1. `GET /api/scores`
Returns the current leaderboard.
```json
{
  "count": 5,
  "scores": [
    {
      "id": "1",
      "player": "NEON_RIDER",
      "score": 18500,
      "wave": 12,
      "accuracy": 89,
      "date": "2026-11-20T10:00:00Z"
    }
  ]
}
```

### 2. `POST /api/scores`
Submit a new high score.
```json
{
  "player": "CYBER_ACE",
  "score": 24500,
  "wave": 14,
  "accuracy": 92
}
```

Response:
```json
{
  "success": true,
  "message": "Score recorded successfully!",
  "rank": 1,
  "entry": { ... }
}
```

---

## 🧪 Testing

Run tests using Node.js built-in test runner:
```bash
npm test
```

---

## 📄 License

This project is open-source under the [MIT License](LICENSE). Built with passion for retro-futurism.
