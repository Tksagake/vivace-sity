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
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    progressHub.subscribe(id, res)
    res.write(': connected\n\n')

    req.on('close', () => {
      progressHub.unsubscribe(id, res)
      res.end()
    })
  })

  return router
}
