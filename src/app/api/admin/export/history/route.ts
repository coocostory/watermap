import { NextResponse } from 'next/server'
import { getAllWaterLevels } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function GET() {
  if (process.env.ADMIN_MODE !== 'true') {
    logger.warn({ module: 'admin:export:history' }, 'Import request denied - ADMIN_MODE not enabled')
    return NextResponse.json({ code: '403', message: 'Forbidden' }, { status: 403 })
  }

  try {
    const levels = getAllWaterLevels()
    const now = new Date()
    const date = now.toISOString().slice(0, 10).replace(/-/g, '')
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const filename = `water_levels_${date}_${time}.csv`

    logger.info({ module: 'admin:export:history', recordCount: levels.length, filename }, 'Exporting water level history')

    // Build CSV content
    const header = '站点代码,站点名,时间,水位,超警戒,流量\n'
    const rows = levels.map(l => {
      const sw = l.sw !== null && l.sw !== undefined ? l.sw : ''
      const q = l.q !== null && l.q !== undefined ? l.q : ''
      return `${l.stcd},${l.stnm || ''},${l.tm},${l.z},${sw},${q}`
    }).join('\n')

    const csv = header + rows

    logger.info({ module: 'admin:export:history', filename, recordCount: levels.length }, 'Water level history exported successfully')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error({ module: 'admin:export:history', error: (error as Error).message }, 'Export failed')
    return NextResponse.json(
      { code: '500', message: (error as Error).message },
      { status: 500 }
    )
  }
}
