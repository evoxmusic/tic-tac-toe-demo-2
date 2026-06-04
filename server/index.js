require('dotenv').config();

const express = require('express');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');
const path = require('path');
const pool = require('./db');
const scoresRouter = require('./routes/scores');
const setupGameSockets = require('./sockets/game');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const BG_COLOR = process.env.BG_COLOR;

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ===== MIDDLEWARE =====
app.use(express.json());

// ===== INDEX (inject configurable background color via BG_COLOR) =====
// Serves index.html, overriding the --bg-primary CSS variable when BG_COLOR
// is set. Backward-compatible: without BG_COLOR the page renders unchanged.
function serveIndex(req, res) {
  fs.readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error loading page');
    if (BG_COLOR) {
      const safe = String(BG_COLOR).replace(/[<>"]/g, '');
      const override = `<style>:root{--bg-primary:${safe} !important;}</style>`;
      html = html.replace('</head>', `${override}\n</head>`);
    }
    res.type('html').send(html);
  });
}
app.get('/', serveIndex);
app.get('/index.html', serveIndex);

app.use(express.static(PUBLIC_DIR));

// ===== API ROUTES =====
app.use('/api/scores', scoresRouter);

// ===== SOCKET.IO =====
setupGameSockets(io);

// ===== AUTO-MIGRATE ON STARTUP =====
async function autoMigrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        player_x_id INTEGER REFERENCES players(id),
        player_o_id INTEGER REFERENCES players(id),
        winner VARCHAR(1) NOT NULL,
        mode VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_games_player_x ON games(player_x_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_games_player_o ON games(player_o_id);`);
    console.log('Database tables ready.');
  } catch (err) {
    console.error('Auto-migration failed:', err.message);
    console.log('App will start but database features may not work until Postgres is available.');
  } finally {
    client.release();
  }
}

// ===== START SERVER =====
// Listen immediately so healthchecks pass, then migrate in background
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║       Tic Tac Toe Server              ║
  ║       http://localhost:${PORT}           ║
  ╚═══════════════════════════════════════╝
  `);
  // Run migration after server is already accepting connections
  autoMigrate().catch((err) => {
    console.warn('Could not run migration, database features may be limited:', err.message);
  });
});
