/**
 * Singleton flag persisted across module reloads in development mode.
 * Uses global to survive module-level state resets.
 */
declare global {
  // eslint-disable-next-line no-var
  var __crawlerInitialized: boolean | undefined
}

let initialized = globalThis.__crawlerInitialized ?? false

/**
 * Initialize the crawler - runs startCrawler() exactly once per process lifetime.
 * Safe in dev mode where module may be reloaded.
 */
export async function initCrawlerOnce(): Promise<void> {
  if (initialized) {
    return
  }

  if (process.env.NODE_ENV === 'test') {
    return
  }

  initialized = true
  globalThis.__crawlerInitialized = true

  const { startCrawler } = await import('./cron')
  startCrawler()
}
