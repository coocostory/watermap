import { NextRequest, NextResponse } from 'next/server'
import { insertWaterLevel } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  if (process.env.ADMIN_MODE !== 'true') {
    logger.warn({ module: 'admin:import:history' }, 'Import request denied - ADMIN_MODE not enabled')
    return NextResponse.json({ code: '403', message: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { stcd, tm, z, sw, q } = body

    if (!stcd || !tm || typeof z !== 'number') {
      logger.warn({ module: 'admin:import:history', stcd, tm, z }, 'Invalid input data')
      return NextResponse.json(
        { code: '400', message: 'stcd, tm and z are required' },
        { status: 400 }
      )
    }

    logger.info({ module: 'admin:import:history', stcd, tm, z, sw: sw ?? 0, q: q ?? 0 }, 'Importing water level record')

    insertWaterLevel({ stcd, tm, z, sw: sw ?? 0, q: q ?? 0 })

    logger.info({ module: 'admin:import:history', stcd, tm }, 'Water level record imported successfully')
    return NextResponse.json({ code: '1001', message: '成功' })
  } catch (error) {
    logger.error({ module: 'admin:import:history', error: (error as Error).message }, 'Import failed')
    return NextResponse.json(
      { code: '500', message: (error as Error).message },
      { status: 500 }
    )
  }
}
