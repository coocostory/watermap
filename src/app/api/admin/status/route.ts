import { NextResponse } from 'next/server'
import { getSystemStatus } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function GET() {
  // Check ADMIN_MODE env
  if (process.env.ADMIN_MODE !== 'true') {
    logger.warn({ module: 'admin:status' }, 'Status request denied - ADMIN_MODE not enabled')
    return NextResponse.json({ code: '403', message: 'Forbidden' }, { status: 403 })
  }

  try {
    const status = getSystemStatus()
    logger.info({ module: 'admin:status', stationCount: status.stationCount, recordCount: status.recordCount }, 'Fetched system status')
    return NextResponse.json({ code: '1001', data: status, message: '成功' })
  } catch (error) {
    logger.error({ module: 'admin:status', error: (error as Error).message }, 'Failed to fetch system status')
    return NextResponse.json(
      { code: '500', message: (error as Error).message },
      { status: 500 }
    )
  }
}
