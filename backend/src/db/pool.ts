import pg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pg;

export interface SessionRow {
  session_id: string;
  created_at: Date;
  expires_at: Date;
}

class DatabaseManager {
  private pool: pg.Pool | null = null;
  private fallbackRows: Map<string, SessionRow> = new Map();
  private usingFallback = false;

  constructor() {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      connectionTimeoutMillis: 2000,
      idleTimeoutMillis: 5000,
      max: 10
    });

    this.pool.on('error', (err) => {
      // Avoid leaking credentials in logs
      console.warn('[DB] PostgreSQL pool background error (falling back to memory storage if offline):', err.message);
    });
  }

  async initDatabase(): Promise<void> {
    try {
      const client = await this.pool!.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL
          );
          CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
        `);
        this.usingFallback = false;
        console.log('[DB] PostgreSQL initialized successfully (table: sessions).');
      } finally {
        client.release();
      }
    } catch (err: any) {
      this.usingFallback = true;
      console.warn(`[DB] PostgreSQL not reachable at ${config.DATABASE_URL.split('@')[1] || 'configured host'}. Running with in-memory session metadata adapter for local demonstration.`);
    }
  }

  isUsingFallback(): boolean {
    return this.usingFallback;
  }

  async saveSession(sessionId: string, expiresAt: Date): Promise<SessionRow> {
    const createdAt = new Date();
    if (!this.usingFallback && this.pool) {
      try {
        const res = await this.pool.query<SessionRow>(
          `INSERT INTO sessions (session_id, created_at, expires_at)
           VALUES ($1, $2, $3)
           RETURNING session_id, created_at, expires_at;`,
          [sessionId, createdAt, expiresAt]
        );
        return res.rows[0];
      } catch (err) {
        console.warn('[DB] Error writing to PostgreSQL, using memory fallback:', (err as Error).message);
        this.usingFallback = true;
      }
    }

    const row: SessionRow = { session_id: sessionId, created_at: createdAt, expires_at: expiresAt };
    this.fallbackRows.set(sessionId, row);
    return row;
  }

  async getSession(sessionId: string): Promise<SessionRow | null> {
    if (!this.usingFallback && this.pool) {
      try {
        const res = await this.pool.query<SessionRow>(
          `SELECT session_id, created_at, expires_at FROM sessions WHERE session_id = $1;`,
          [sessionId]
        );
        return res.rows[0] || null;
      } catch (err) {
        this.usingFallback = true;
      }
    }
    return this.fallbackRows.get(sessionId) || null;
  }

  async updateExpiry(sessionId: string, newExpiresAt: Date): Promise<void> {
    if (!this.usingFallback && this.pool) {
      try {
        await this.pool.query(
          `UPDATE sessions SET expires_at = $2 WHERE session_id = $1;`,
          [sessionId, newExpiresAt]
        );
        return;
      } catch (err) {
        this.usingFallback = true;
      }
    }
    const existing = this.fallbackRows.get(sessionId);
    if (existing) {
      existing.expires_at = newExpiresAt;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.usingFallback && this.pool) {
      try {
        await this.pool.query(`DELETE FROM sessions WHERE session_id = $1;`, [sessionId]);
      } catch (err) {
        this.usingFallback = true;
      }
    }
    this.fallbackRows.delete(sessionId);
  }

  async purgeExpiredSessions(): Promise<number> {
    const now = new Date();
    let count = 0;

    if (!this.usingFallback && this.pool) {
      try {
        const res = await this.pool.query(`DELETE FROM sessions WHERE expires_at <= $1;`, [now]);
        count += res.rowCount || 0;
      } catch (err) {
        this.usingFallback = true;
      }
    }

    for (const [id, row] of this.fallbackRows.entries()) {
      if (row.expires_at <= now) {
        this.fallbackRows.delete(id);
        count++;
      }
    }

    return count;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export const db = new DatabaseManager();
