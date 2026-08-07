/* eslint-disable no-restricted-imports */
import * as SQLite from 'expo-sqlite';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('db');

/**
 * SQLite para dados relacionais e offline-first (listas grandes, fila de
 * sincronização, histórico). Migrations são versionadas via `user_version`:
 * para evoluir o schema, ADICIONE um item ao array — nunca edite um existente.
 */
const MIGRATIONS: readonly string[] = [
  // v1
  `CREATE TABLE IF NOT EXISTS outbox (
     id          TEXT PRIMARY KEY NOT NULL,
     endpoint    TEXT NOT NULL,
     payload     TEXT NOT NULL,
     created_at  INTEGER NOT NULL,
     attempts    INTEGER NOT NULL DEFAULT 0
   );`,
  // v2
  `CREATE TABLE IF NOT EXISTS messages (
     id          TEXT PRIMARY KEY NOT NULL,
     room_id     TEXT NOT NULL,
     author_id   TEXT NOT NULL,
     body        TEXT NOT NULL,
     sent_at     INTEGER NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_messages_room ON messages (room_id, sent_at DESC);`,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('app.db', { useNewConnection: false });
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  if (current >= MIGRATIONS.length) return;

  for (let version = current; version < MIGRATIONS.length; version += 1) {
    const sql = MIGRATIONS[version];
    if (sql === undefined) continue;
    log.info(`Aplicando migration v${version + 1}`);
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
    });
  }
  await db.execAsync(`PRAGMA user_version = ${MIGRATIONS.length}`);
}

/** Conexão única e preguiçosa. Migrations rodam uma vez, no primeiro acesso. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= open();
  return dbPromise;
}

export async function resetDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DELETE FROM outbox; DELETE FROM messages;');
}
