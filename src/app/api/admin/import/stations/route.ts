import { NextRequest, NextResponse } from 'next/server'
import { setStationLocation } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  if (process.env.ADMIN_MODE !== 'true') {
    logger.warn({ module: 'admin:import:stations' }, 'Import request denied - ADMIN_MODE not enabled')
    return NextResponse.json({ code: '403', message: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { stcd, latitude, longitude } = body

    if (!stcd || typeof latitude !== 'number' || typeof longitude !== 'number') {
      logger.warn({ module: 'admin:import:stations', stcd, latitude, longitude }, 'Invalid input data')
      return NextResponse.json(
        { code: '400', message: 'stcd, latitude and longitude are required' },
        { status: 400 }
      )
    }

    logger.info({ module: 'admin:import:stations', stcd, latitude, longitude }, 'Importing station location')

    setStationLocation(stcd, latitude, longitude)

    logger.info({ module: 'admin:import:stations', stcd, latitude, longitude }, 'Station location imported successfully')
    return NextResponse.json({ code: '1001', message: '成功' })
  } catch (error) {
    logger.error({ module: 'admin:import:stations', error: (error as Error).message }, 'Import failed')
    return NextResponse.json(
      { code: '500', message: (error as Error).message },
      { status: 500 }
    )
  }
}
