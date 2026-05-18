const express = require('express');
const pool = require('../db');

const router = express.Router();

/**
 * GET /api/scores
 * Returns leaderboard: wins, losses, draws, total, sorted by wins desc
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.name,
        COALESCE(SUM(CASE
          WHEN (g.player_x_id = p.id AND g.winner = 'X')
            OR (g.player_o_id = p.id AND g.winner = 'O')
          THEN 1 ELSE 0 END), 0)::int AS wins,
        COALESCE(SUM(CASE
          WHEN (g.player_x_id = p.id AND g.winner = 'O')
            OR (g.player_o_id = p.id AND g.winner = 'X')
          THEN 1 ELSE 0 END), 0)::int AS losses,
        COALESCE(SUM(CASE WHEN g.winner = 'D' THEN 1 ELSE 0 END), 0)::int AS draws,
        COUNT(g.id)::int AS total
      FROM players p
      LEFT JOIN games g ON g.player_x_id = p.id OR g.player_o_id = p.id
      GROUP BY p.id, p.name
      HAVING COUNT(g.id) > 0
      ORDER BY wins DESC, total ASC
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * POST /api/scores
 * Record a game result
 * Body: { playerXName, playerOName (nullable), winner ('X'/'O'/'D'), mode }
 */
router.post('/', async (req, res) => {
  const { playerXName, playerOName, winner, mode } = req.body;

  if (!playerXName || !winner || !mode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['X', 'O', 'D'].includes(winner)) {
    return res.status(400).json({ error: 'Invalid winner value' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert player X
    const pxRes = await client.query(
      `INSERT INTO players (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [playerXName]
    );
    const playerXId = pxRes.rows[0].id;

    // Upsert player O (if not AI)
    let playerOId = null;
    if (playerOName) {
      const poRes = await client.query(
        `INSERT INTO players (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [playerOName]
      );
      playerOId = poRes.rows[0].id;
    }

    // Insert game record
    await client.query(
      `INSERT INTO games (player_x_id, player_o_id, winner, mode)
       VALUES ($1, $2, $3, $4)`,
      [playerXId, playerOId, winner, mode]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving score:', err);
    res.status(500).json({ error: 'Failed to save score' });
  } finally {
    client.release();
  }
});

module.exports = router;
