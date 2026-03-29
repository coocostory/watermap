import cron, { type ScheduledTask } from 'node-cron'
import { crawlWaterLevels } from './crawler'
import { logger } from './logger'

const CRAWL_INTERVAL = parseInt(process.env.CRAWL_INTERVAL || '30', 10)

let task: ScheduledTask | null = null

/**
 * Start the crawler scheduler
 */
export function startCrawler(): void {
  if (task) {
    logger.info({ module: 'cron' }, 'Crawler already started')
    return
  }

  const expression = `*/${CRAWL_INTERVAL} * * * *`
  logger.info({ module: 'cron', interval: CRAWL_INTERVAL, expression }, 'Starting crawler')

  task = cron.schedule(expression, async () => {
    try {
      await crawlWaterLevels()
    } catch (error) {
      logger.error({ module: 'cron', error: (error as Error).message }, 'Crawl error')
    }
  })

  logger.info({ module: 'cron' }, 'Crawler started')
}

/**
 * Stop the crawler scheduler
 */
export function stopCrawler(): void {
  if (task) {
    task.stop()
    task = null
    logger.info({ module: 'cron' }, 'Crawler stopped')
  }
}
