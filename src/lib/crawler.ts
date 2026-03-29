import axios from 'axios'
import { batchUpsert } from './db'
import { logger } from './logger'
import type { Station, WaterLevel } from '@/types'

interface CrawlerStation {
  stcd: string
  stnm: string
  rvnm?: string
  addvcd?: string
  wrz?: number
  grz?: number
  tm: string
  z?: number
  ogrsw?: number
  q?: number
}

interface ApiResponse {
  code?: string
  data?: {
    pageinfo?: CrawlerStation[]
  }
  message?: string
}

/**
 * Crawl water level data from the API and upsert to database
 */
export async function crawlWaterLevels(): Promise<void> {
  const DATA_SOURCE_URL = process.env.DATA_SOURCE_URL
  if (!DATA_SOURCE_URL) {
    logger.error({ module: 'crawler' }, 'DATA_SOURCE_URL not configured')
    throw new Error('DATA_SOURCE_URL not configured')
  }

  logger.info({ module: 'crawler', url: DATA_SOURCE_URL }, 'Starting crawl')

  try {
    const response = await axios.post<ApiResponse>(
      DATA_SOURCE_URL,
      new URLSearchParams({
        uid: '',
        qyid: '',
        hlname: '',
        czname: '',
        jjsw: '',
        ogrsw: '',
        num: '1',
        size: '500',
        v: '2'
      }),
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'https://cqsw.slj.cq.gov.cn',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Dest': 'empty',
          'Accept-Language': 'zh-CN,zh;q=0.9'
        },
        timeout: 30000
      }
    )

    // Validate API response code
    if (response.data?.code !== '1001') {
    logger.error({ module: 'crawler', apiCode: response.data?.code, message: response.data?.message }, 'API error')
      throw new Error(`API returned code: ${response.data?.code}`)
    }

    const items = response.data?.data?.pageinfo ?? []
    logger.info({ module: 'crawler', itemCount: items.length }, 'API response received')

    // Build station map to avoid duplicates
    const stationMap = new Map<string, Station>()
    const levels: Omit<WaterLevel, 'id'>[] = []
    const crawlTime = new Date().toISOString()

    for (const item of items) {
      // Add to station map if not exists
      if (!stationMap.has(item.stcd)) {
        stationMap.set(item.stcd, {
          stcd: item.stcd,
          stnm: item.stnm.trim(),
          rvnm: item.rvnm?.trim() || '',
          addvcd: item.addvcd?.trim() || '',
          latitude: null,
          longitude: null,
          wrz: item.wrz ?? null,
          grz: item.grz ?? null,
          updated_at: crawlTime
        })
      }

      // Add level data (z defaults to 0, avoiding NOT NULL constraint violation)
      levels.push({
        stcd: item.stcd,
        tm: item.tm,
        z: item.z ?? 0,
        sw: item.ogrsw ?? 0,
        q: item.q ?? 0
      })
    }

    // Call batchUpsert once with both arrays
    const stations = Array.from(stationMap.values())
    batchUpsert(stations, levels, crawlTime)

    logger.info({ module: 'crawler', stationCount: stations.length, readingCount: levels.length }, 'Crawl completed')
  } catch (error) {
    logger.error({ module: 'crawler', error: (error as Error).message }, 'Crawl failed')
    throw error
  }
}
