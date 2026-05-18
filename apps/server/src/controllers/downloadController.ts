import type { Request, Response } from 'express'
import { z } from 'zod'
import type { DownloadManager } from '../services/downloadManager.js'
import { HistoryStore } from '../store/historyStore.js'
import { downloadRequestSchema, idParamSchema, infoRequestSchema } from '../utils/validators.js'

export class DownloadController {
  constructor(
    private readonly manager: DownloadManager,
    private readonly historyStore: HistoryStore,
  ) {}

  info = async (req: Request, res: Response): Promise<void> => {
    const parsed = infoRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) })
      return
    }

    const info = await this.manager.getMediaInfo(parsed.data.url)
    res.json(info)
  }

  download = async (req: Request, res: Response): Promise<void> => {
    const parsed = downloadRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) })
      return
    }

    const task = await this.manager.enqueue(parsed.data)
    res.status(202).json(task)
  }

  progress = (req: Request, res: Response): void => {
    const parsed = idParamSchema.safeParse(req.params)
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) })
      return
    }

    const snapshot = this.manager.getSnapshot(parsed.data.id)
    if (!snapshot) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    res.json(snapshot)
  }

  cancel = (req: Request, res: Response): void => {
    const parsed = idParamSchema.safeParse(req.params)
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) })
      return
    }

    const cancelled = this.manager.cancel(parsed.data.id)
    if (!cancelled) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    res.status(202).json({ id: parsed.data.id, status: 'cancelled' })
  }

  history = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.historyStore.readAll()
    res.json(items)
  }

  queue = (_req: Request, res: Response): void => {
    res.json(this.manager.listQueue())
  }
}
