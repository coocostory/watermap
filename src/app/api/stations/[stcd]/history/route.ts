import { NextRequest, NextResponse } from 'next/server'
import { getStationHistory } from '@/lib/db'
import { logger } from '@/lib/logger'

const VALID_RANGES = ['24h', '7d', '30d']

/** Format date as YYYY-MM-DD HH:mm:ss in local time (matches DB format) */
function formatLocalDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stcd: string }> }
) {
  try {
    const { stcd } = await params
    const { searchParams } = new URL(request.url)

    const rangeParam = searchParams.get('range')
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    // If start/end provided, use them directly
    if (start && end) {
      const history = getStationHistory(stcd, start, end)
      logger.info({ module: 'api:history', stcd, start, end, recordCount: history.length }, 'Fetched station history with custom range')
      return NextResponse.json({ code: '1001', data: history, message: '成功' })
    }

    // Otherwise use range (default to 24h)
    const range = rangeParam || '24h'
    if (!VALID_RANGES.includes(range)) {
      logger.warn({ module: 'api:history', stcd, range }, 'Invalid range parameter')
      return NextResponse.json(
        { code: '400', message: 'range must be one of 24h|7d|30d' },
        { status: 400 }
      )
    }

    // Compute startTime from range
    const now = new Date()
    switch (range) {
      case '24h':
        now.setHours(now.getHours() - 24)
        break
      case '7d':
        now.setDate(now.getDate() - 7)
        break
      case '30d':
        now.setDate(now.getDate() - 30)
        break
    }
    const startTime = formatLocalDate(now)
    const endTime = formatLocalDate(new Date())

    const history = getStationHistory(stcd, startTime, endTime)
    logger.info({ module: 'api:history', stcd, range, recordCount: history.length }, 'Fetched station history')

    return NextResponse.json({ code: '1001', data: history, message: '成功' })
  } catch (error) {
    logger.error({ module: 'api:history', error: (error as Error).message }, 'Failed to fetch station history')
    return NextResponse.json(
      { code: '500', message: (error as Error).message },
      { status: 500 }
    )
  }
}
