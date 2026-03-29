import pino from 'pino'

// Note: pino-pretty uses worker threads which don't work well with Next.js bundling
// In production, use plain JSON logs. In dev, pino will output newline-delimited JSON.
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label.toUpperCase() })
  },
  timestamp: pino.stdTimeFunctions.isoTime
})
