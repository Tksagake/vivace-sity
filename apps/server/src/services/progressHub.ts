import type { Response } from 'express'
import type { DownloadProgress } from '../types/download.js'

export class ProgressHub {
  private readonly subscribers = new Map<string, Set<Response>>()
  private readonly latest = new Map<string, DownloadProgress>()
  private readonly evictionTimers = new Map<string, NodeJS.Timeout>()

  private static readonly terminalStatuses = new Set<DownloadProgress['status']>([
    'completed',
    'cleaned',
    'failed',
    'cancelled',
  ])

  subscribe(id: string, response: Response): void {
    const list = this.subscribers.get(id) ?? new Set<Response>()
    list.add(response)
    this.subscribers.set(id, list)

    const current = this.latest.get(id)
    if (current) {
      try {
        response.write(`data: ${JSON.stringify(current)}\n\n`)
      } catch {
        this.unsubscribe(id, response)
      }
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
    const existingEviction = this.evictionTimers.get(progress.id)
    if (existingEviction) {
      clearTimeout(existingEviction)
      this.evictionTimers.delete(progress.id)
    }

    this.latest.set(progress.id, progress)
    const list = this.subscribers.get(progress.id)
    if (list) {
      const payload = `data: ${JSON.stringify(progress)}\n\n`
      for (const response of list) {
        if (response.writableEnded || response.destroyed) {
          this.unsubscribe(progress.id, response)
          continue
        }
        try {
          response.write(payload)
        } catch {
          this.unsubscribe(progress.id, response)
        }
      }
    }

    if (ProgressHub.terminalStatuses.has(progress.status)) {
      this.clearSubscribers(progress.id)
      const timer = setTimeout(() => {
        this.latest.delete(progress.id)
        this.evictionTimers.delete(progress.id)
      }, 15 * 60 * 1000)
      this.evictionTimers.set(progress.id, timer)
    }
  }

  getLatest(id: string): DownloadProgress | undefined {
    return this.latest.get(id)
  }

  clearSubscribers(id: string): void {
    const list = this.subscribers.get(id)
    if (!list) {
      return
    }

    for (const response of list) {
      if (!response.writableEnded) {
        response.end()
      }
    }
    this.subscribers.delete(id)
  }
}
