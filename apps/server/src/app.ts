import path from 'node:path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { env } from './config/env.js'
import { DownloadController } from './controllers/downloadController.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { createApiRouter } from './routes/api.js'
import { DownloadManager } from './services/downloadManager.js'
import { ProgressHub } from './services/progressHub.js'
import { HistoryStore } from './store/historyStore.js'

const progressHub = new ProgressHub()
const historyStore = new HistoryStore(env.HISTORY_FILE)
const downloadManager = new DownloadManager(
  env.YTDLP_BIN,
  env.FFMPEG_BIN,
  env.DOWNLOAD_DIR,
  env.MAX_CONCURRENT_DOWNLOADS,
  progressHub,
  historyStore,
)
const controller = new DownloadController(downloadManager, historyStore)

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
  }),
)

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? '127.0.0.1'),
  }),
)

app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'vivace-sity-server' })
})

app.use('/api', createApiRouter(controller, progressHub))
app.use('/downloads', express.static(path.resolve(env.DOWNLOAD_DIR)))

const webDistPath = path.resolve(process.cwd(), '../web/dist')
app.use(express.static(webDistPath))

app.get('*', (_req, res) => {
  res.sendFile(path.join(webDistPath, 'index.html'))
})

app.use(notFound)
app.use(errorHandler)

export { app }
