import fs from 'node:fs/promises'
import path from 'node:path'
import { ensureDir } from '../utils/files.js'
import type { HistoryItem } from '../types/download.js'

export class HistoryStore {
  private readonly historyFile: string
  private writeChain: Promise<void> = Promise.resolve()

  constructor(historyFile: string) {
    this.historyFile = historyFile
  }

  async readAll(): Promise<HistoryItem[]> {
    try {
      const data = await fs.readFile(this.historyFile, 'utf-8')
      return JSON.parse(data) as HistoryItem[]
    } catch {
      return []
    }
  }

  async push(item: HistoryItem): Promise<void> {
    this.writeChain = this.writeChain.then(async () => {
      const parent = path.dirname(this.historyFile)
      await ensureDir(parent)
      const current = await this.readAll()
      const next = [item, ...current].slice(0, 200)
      const tempPath = `${this.historyFile}.tmp`
      await fs.writeFile(tempPath, JSON.stringify(next, null, 2), 'utf-8')
      await fs.rename(tempPath, this.historyFile)
    })

    await this.writeChain
  }
}
