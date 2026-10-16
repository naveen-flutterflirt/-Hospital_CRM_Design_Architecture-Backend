import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

// Neon PostgreSQL requires SSL connection
const isPlaceholderUrl = !env.DATABASE_URL || env.DATABASE_URL.includes('ep-placeholder');

// Sanitize connection string so pg uses the explicit ssl configuration without printing deprecation warnings
const cleanConnectionString = env.DATABASE_URL
  ? env.DATABASE_URL.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '')
  : '';

export const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  // Catch idle client drops from Neon serverless gracefully
  if (err.message && (
    err.message.includes('Connection terminated') ||
    err.message.includes('timeout') ||
    err.message.includes('socket')
  )) {
    return;
  }
  console.error('PostgreSQL client notice:', err.message);
});

/**
 * Execute raw SQL query with parameters and automatic retry for idle Neon wakeups
 * @param {string} text - SQL statement
 * @param {Array} [params] - Query parameters
 * @param {number} [retries=2] - Number of retries on transient connection drops
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = [], retries = 2) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    const isConnError = error.message && (
      error.message.includes('Connection terminated') ||
      error.message.includes('connection timeout') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('client has been closed')
    );

    if (isConnError && retries > 0) {
      // Exponential delay before retry to allow Neon compute to resume
      await new Promise((resolve) => setTimeout(resolve, 800));
      return await query(text, params, retries - 1);
    }
    console.error('Database query error:', { text, error: error.message });
    throw error;
  }
}

/**
 * Execute a transaction block
 * @param {Function} callback - Async function receiving transaction client
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test Neon DB connection status
 */
export async function checkConnection() {
  if (isPlaceholderUrl) {
    return {
      connected: false,
      message: 'DATABASE_URL is set to placeholder. Please configure your Neon DB URL in .env',
    };
  }

  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    return {
      connected: true,
      time: res.rows[0].current_time,
      database: res.rows[0].db_name,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
}
