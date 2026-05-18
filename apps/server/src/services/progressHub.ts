import type { Response } from 'express'
import type { DownloadProgress } from '../types/download.js'

export class ProgressHub {
  private readonly subscribers = new Map<string, Set<Response>>()
  private readonly latest = new Map<string, DownloadProgress>()

  subscribe(id: string, response: Response): void {
    const list = this.subscribers.get(id) ?? new Set<Response>()
    list.add(response)
    this.subscribers.set(id, list)

    const current = this.latest.get(id)
    if (current) {
      response.write(`data: ${JSON.stringify(current)}\n\n`)
    }
  }

  unsubscribe(id: string, response: Response): void {
    const list = this.subscribers.get(id)
    if (!list) {
      return
    }

    list.delete(response)
    if (list.size === 0) {
      this.subscribers.delete(id)
    }
  }

  publish(progress: DownloadProgress): void {
    this.latest.set(progress.id, progress)
    const list = this.subscribers.get(progress.id)
    if (!list) {
      return
    }

    const payload = `data: ${JSON.stringify(progress)}\n\n`
    list.forEach((response) => response.write(payload))
  }

  getLatest(id: string): DownloadProgress | undefined {
    return this.latest.get(id)
  }
}
