import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8787),
  DOWNLOAD_DIR: z.string().default('./downloads'),
  TEMP_DIR: z.string().default('./tmp'),
  HISTORY_FILE: z.string().default('./data/history.json'),
  YTDLP_BIN: z.string().default('yt-dlp'),
  FFMPEG_BIN: z.string().default('ffmpeg'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(120),
  MAX_CONCURRENT_DOWNLOADS: z.coerce.number().default(2),
  TASK_RETENTION_MS: z.coerce.number().default(15 * 60 * 1000),
  CORS_ORIGIN: z.string().default('*'),
})

export const env = envSchema.parse(process.env)
