import { NextResponse } from 'next/server'
import { initCrawlerOnce } from '@/lib/crawler-init'
import { getAllStations } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    await initCrawlerOnce()
    const stations = getAllStations()
    logger.info({ module: 'api:stations', stationCount: stations.length }, 'Fetched all stations')
    return NextResponse.json({ code: '1001', data: stations, message: '成功' })
  } catch (error) {
    logger.error({ module: 'api:stations', error: (error as Error).message }, 'Failed to fetch stations')
    return NextResponse.json(
      { code: '500', message: (error as Error).message },
      { status: 500 }
    )
  }
}
