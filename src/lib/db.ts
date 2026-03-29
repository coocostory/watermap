import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { Station, WaterLevel, StationWithLevel } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'watermap.db')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const db = new Database(DB_PATH)

// Enable WAL mode
db.pragma('journal_mode = WAL')

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    stcd TEXT PRIMARY KEY,
    stnm TEXT NOT NULL,
    rvnm TEXT NOT NULL,
    addvcd TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    wrz REAL,
    grz REAL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS water_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stcd TEXT NOT NULL,
    tm TEXT NOT NULL,
    z REAL NOT NULL,
    sw REAL NOT NULL,
    q REAL NOT NULL,
    UNIQUE(stcd, tm)
  );

  CREATE INDEX IF NOT EXISTS idx_water_levels_stcd_tm ON water_levels(stcd, tm);

  CREATE TABLE IF NOT EXISTS admin_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

/**
 * Get all stations with their latest water level
 */
export function getAllStations(): StationWithLevel[] {
  const stmt = db.prepare(`
    SELECT
      s.stcd,
      s.stnm,
      s.rvnm,
      s.addvcd,
      s.latitude,
      s.longitude,
      s.wrz,
      s.grz,
      s.updated_at,
      w.z AS latest_z,
      w.tm AS latest_tm,
      w.sw AS latest_sw
    FROM stations s
    LEFT JOIN (
      SELECT stcd, z, tm, sw
      FROM water_levels w1
      WHERE tm = (
        SELECT MAX(tm)
        FROM water_levels w2
        WHERE w2.stcd = w1.stcd
      )
    ) w ON s.stcd = w.stcd
    ORDER BY s.stnm
  `)

  return stmt.all() as StationWithLevel[]
}

/**
 * Get water level history for a station within time range
 */
export function getStationHistory(
  stcd: string,
  startTime: string,
  endTime: string
): WaterLevel[] {
  const stmt = db.prepare(`
    SELECT id, stcd, tm, z, sw, q
    FROM water_levels
    WHERE stcd = ? AND tm >= ? AND tm <= ?
    ORDER BY tm ASC
  `)

  return stmt.all(stcd, startTime, endTime) as WaterLevel[]
}

/**
 * Get system status
 */
export function getSystemStatus(): {
  stationCount: number
  levelCount: number
  lastCrawlTime: string | null
} {
  const stationCount = (db.prepare('SELECT COUNT(*) as count FROM stations').get() as { count: number }).count
  const levelCount = (db.prepare('SELECT COUNT(*) as count FROM water_levels').get() as { count: number }).count
  const lastCrawl = db.prepare("SELECT value FROM admin_config WHERE key = 'last_crawl'").get() as { value: string } | undefined

  return {
    stationCount,
    levelCount,
    lastCrawlTime: lastCrawl?.value ?? null
  }
}

/**
 * Insert or update a station (partial data OK)
 */
export function upsertStation(data: Partial<Station> & { stcd: string; stnm: string }): void {
  const stmt = db.prepare(`
    INSERT INTO stations (stcd, stnm, rvnm, addvcd, latitude, longitude, wrz, grz, updated_at)
    VALUES (@stcd, @stnm, @rvnm, @addvcd, @latitude, @longitude, @wrz, @grz, @updated_at)
    ON CONFLICT(stcd) DO UPDATE SET
      stnm = excluded.stnm,
      rvnm = excluded.rvnm,
      addvcd = excluded.addvcd,
      latitude = COALESCE(excluded.latitude, stations.latitude),
      longitude = COALESCE(excluded.longitude, stations.longitude),
      wrz = excluded.wrz,
      grz = excluded.grz,
      updated_at = excluded.updated_at
  `)

  stmt.run(data)
}

/**
 * Insert a water level reading
 */
export function insertWaterLevel(data: Omit<WaterLevel, 'id'>): void {
  const stmt = db.prepare(`
    INSERT INTO water_levels (stcd, tm, z, sw, q)
    VALUES (@stcd, @tm, @z, @sw, @q)
    ON CONFLICT(stcd, tm) DO NOTHING
  `)

  stmt.run(data)
}

/**
 * Batch upsert stations and water levels in a transaction
 */
export function batchUpsert(
  stations: Station[],
  levels: Omit<WaterLevel, 'id'>[],
  crawlTime: string
): void {
  const transaction = db.transaction(() => {
    for (const station of stations) {
      upsertStation(station)
    }

    for (const level of levels) {
      insertWaterLevel(level)
    }

    // Update last crawl time
    db.prepare(`
      INSERT INTO admin_config (key, value)
      VALUES ('last_crawl', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(crawlTime)
  })

  transaction()
}

/**
 * Update station location (latitude/longitude)
 */
export function setStationLocation(stcd: string, lat: number, lng: number): void {
  db.prepare(`
    UPDATE stations
    SET latitude = ?, longitude = ?
    WHERE stcd = ?
  `).run(lat, lng, stcd)
}

/**
 * Clear station location (set lat/lng to NULL)
 */
export function clearStationLocation(stcd: string): void {
  db.prepare(`
    UPDATE stations
    SET latitude = NULL, longitude = NULL
    WHERE stcd = ?
  `).run(stcd)
}

/**
 * Get all water level records
 */
export function getAllWaterLevels(): (Omit<WaterLevel, 'id'> & { stnm?: string })[] {
  const stmt = db.prepare(`
    SELECT w.stcd, w.tm, w.z, w.sw, w.q, s.stnm
    FROM water_levels w
    LEFT JOIN stations s ON w.stcd = s.stcd
    ORDER BY w.stcd, w.tm
  `)

  return stmt.all() as (Omit<WaterLevel, 'id'> & { stnm?: string })[]
}

export { db }
