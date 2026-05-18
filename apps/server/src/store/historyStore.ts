import fs from 'node:fs/promises'
import path from 'node:path'
import { ensureDir } from '../utils/files.js'
import type { HistoryItem } from '../types/download.js'

export class HistoryStore {
  private readonly historyFile: string

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
    const parent = path.dirname(this.historyFile)
    await ensureDir(parent)
    const current = await this.readAll()
    const next = [item, ...current].slice(0, 200)
    await fs.writeFile(this.historyFile, JSON.stringify(next, null, 2), 'utf-8')
  }
}
