import { Router } from 'express'
import type { DownloadController } from '../controllers/downloadController.js'
import type { ProgressHub } from '../services/progressHub.js'

export function createApiRouter(controller: DownloadController, progressHub: ProgressHub): Router {
  const router = Router()

  router.post('/info', controller.info)
  router.post('/download', controller.download)
  router.get('/progress/:id', controller.progress)
  router.post('/cancel/:id', controller.cancel)
  router.get('/history', controller.history)
  router.get('/queue', controller.queue)

  router.get('/stream/:id', (req, res) => {
    const id = req.params.id

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) {
        try {
          res.write(': ping\n\n')
        } catch {
          cleanup()
        }
      }
    }, 15000)

    progressHub.subscribe(id, res)
    res.write(`data: ${JSON.stringify({ type: 'connected', taskId: id })}\n\n`)

    const cleanup = (): void => {
      clearInterval(heartbeat)
      progressHub.unsubscribe(id, res)
      if (!res.writableEnded) {
        res.end()
      }
    }

    req.on('close', cleanup)
    req.on('error', cleanup)
    res.on('error', cleanup)
  })

  return router
}
