const pool = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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

    // Index for leaderboard queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_player_x ON games(player_x_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_player_o ON games(player_o_id);
    `);

    await client.query('COMMIT');
    console.log('Database migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
