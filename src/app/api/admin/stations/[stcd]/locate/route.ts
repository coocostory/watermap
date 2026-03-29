import { NextRequest, NextResponse } from 'next/server'
import { setStationLocation, clearStationLocation } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stcd: string }> }
) {
  // Check ADMIN_MODE env
  if (process.env.ADMIN_MODE !== 'true') {
    logger.warn({ module: 'admin:locate' }, 'Locate request denied - ADMIN_MODE not enabled')
    return NextResponse.json({ code: '403', message: 'Forbidden' }, { status: 403 })
  }

  try {
    const { stcd } = await params
    const body = await request.json()
    const { latitude, longitude } = body

    // Validate both are numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      logger.warn({ module: 'admin:locate', stcd, latitude, longitude }, 'Invalid coordinates')
      return NextResponse.json(
        { code: '400', message: 'latitude and longitude must be numbers' },
        { status: 400 }
      )
    }

    setStationLocation(stcd, latitude, longitude)
    logger.info({ module: 'admin:locate', stcd, latitude, longitude }, 'Station location set')
    return NextResponse.json({ code: '1001', message: '成功' })
  } catch (error) {
    logger.error({ module: 'admin:locate', error: (error as Error).message }, 'Failed to set station location')
    return NextResponse.json(
      { code: '500', message: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stcd: string }> }
) {
  // Check ADMIN_MODE env
  if (process.env.ADMIN_MODE !== 'true') {
    logger.warn({ module: 'admin:locate' }, 'Locate delete request denied - ADMIN_MODE not enabled')
    return NextResponse.json({ code: '403', message: 'Forbidden' }, { status: 403 })
  }

  try {
    const { stcd } = await params
    clearStationLocation(stcd)
    logger.info({ module: 'admin:locate', stcd }, 'Station location cleared')
    return NextResponse.json({ code: '1001', message: '成功' })
  } catch (error) {
    logger.error({ module: 'admin:locate', error: (error as Error).message }, 'Failed to clear station location')
    return NextResponse.json(
      { code: '500', message: (error as Error).message },
      { status: 500 }
    )
  }
}
