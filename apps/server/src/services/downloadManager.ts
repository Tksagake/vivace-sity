import { spawn, type ChildProcessByStdio } from 'node:child_process'
import type { Readable } from 'node:stream'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  DownloadOptions,
  DownloadProgress,
  DownloadStatus,
  HistoryItem,
  MediaInfo,
} from '../types/download.js'
import { ensureDir, safeOutputTemplate, taskWorkspacePath } from '../utils/files.js'
import { fetchMediaInfo } from './ytdlpService.js'
import { HistoryStore } from '../store/historyStore.js'
import { ProgressHub } from './progressHub.js'

interface QueueTask {
  options: DownloadOptions
  createdAt: string
  media?: MediaInfo
  child?: ChildProcessByStdio<null, Readable, Readable>
  workspacePath: string
}

export class DownloadManager {
  private readonly queue: QueueTask[] = []
  private readonly active = new Map<string, QueueTask>()
  private readonly cancelled = new Set<string>()

  constructor(
    private readonly ytdlpBin: string,
    private readonly ffmpegBin: string,
    private readonly downloadDir: string,
    private readonly tempDir: string,
    private readonly maxConcurrent: number,
    private readonly taskRetentionMs: number,
    private readonly progressHub: ProgressHub,
    private readonly historyStore: HistoryStore,
  ) {}

  async getMediaInfo(url: string): Promise<MediaInfo> {
    return fetchMediaInfo(this.ytdlpBin, url)
  }

  async enqueue(input: Omit<DownloadOptions, 'id'>): Promise<{ id: string; status: DownloadStatus }> {
    const task: QueueTask = {
      options: {
        id: randomUUID(),
        ...input,
      },
      createdAt: new Date().toISOString(),
      workspacePath: '',
    }
    task.workspacePath = taskWorkspacePath(this.tempDir, task.options.id)

    this.queue.push(task)
    this.emit(task.options.id, 'queued', { message: 'Queued for download' })
    this.pump()

    return { id: task.options.id, status: 'queued' }
  }

  getSnapshot(id: string): DownloadProgress | undefined {
    return this.progressHub.getLatest(id)
  }

  cancel(id: string): boolean {
    const queuedIndex = this.queue.findIndex((task) => task.options.id === id)
    if (queuedIndex >= 0) {
      const [task] = this.queue.splice(queuedIndex, 1)
      this.emit(task.options.id, 'cancelled', { message: 'Cancelled in queue' })
      void this.persistHistory(task, 'cancelled')
      return true
    }

    const running = this.active.get(id)
    if (running?.child) {
      this.cancelled.add(id)
      this.killTaskProcess(running)
      this.emit(id, 'cancelled', { message: 'Cancellation requested' })
      void this.persistHistory(running, 'cancelled')
      return true
    }

    return false
  }

  listQueue(): DownloadProgress[] {
    const activeItems = [...this.active.values()].map((task) => this.progressHub.getLatest(task.options.id))
    const queuedItems = this.queue.map((task) => this.progressHub.getLatest(task.options.id))
    return [...activeItems, ...queuedItems].filter((item): item is DownloadProgress => Boolean(item))
  }

  private pump(): void {
    while (this.active.size < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()
      if (!task) {
        return
      }
      this.active.set(task.options.id, task)
      void this.startTask(task)
    }
  }

  private emit(id: string, status: DownloadStatus, patch: Partial<DownloadProgress> = {}): void {
    const current = this.progressHub.getLatest(id)
    this.progressHub.publish({
      id,
      status,
      percent: patch.percent ?? current?.percent ?? 0,
      speed: patch.speed ?? current?.speed ?? '--',
      eta: patch.eta ?? current?.eta ?? '--',
      downloaded: patch.downloaded ?? current?.downloaded ?? '--',
      total: patch.total ?? current?.total ?? '--',
      message: patch.message ?? current?.message,
      filePath: patch.filePath ?? current?.filePath,
    })
  }

  private buildArgs(task: QueueTask): string[] {
    const { url, format, resolution, subtitles, subtitleLanguage, playlist, audioQuality } = task.options
    const args: string[] = [
      '--newline',
      '--progress',
      '--progress-template',
      'download:VIVACE_PROGRESS %(progress.downloaded_bytes)s %(progress.total_bytes)s %(progress.speed)s %(progress.eta)s',
      '--no-warnings',
      '--ffmpeg-location',
      this.ffmpegBin,
      '--output',
      safeOutputTemplate(task.workspacePath),
    ]

    if (!playlist) {
      args.push('--no-playlist')
    }

    if (format === 'mp3') {
      args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', audioQuality)
    } else if (resolution !== 'best') {
      args.push('-f', `bestvideo[height<=${resolution}]+bestaudio/best[height<=${resolution}]`)
    } else {
      args.push('-f', 'bestvideo+bestaudio/best')
    }

    if (subtitles) {
      args.push('--write-subs', '--sub-langs', subtitleLanguage)
    }

    args.push(url)
    return args
  }

  private killTaskProcess(task: QueueTask): void {
    const child = task.child
    if (!child?.pid) {
      return
    }

    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
        stdio: 'ignore',
        shell: false,
      })
      killer.unref()
      return
    }

    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
  }

  private parseTemplateProgress(line: string): Partial<DownloadProgress> | undefined {
    const match = line.match(/^download:VIVACE_PROGRESS\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/)
    if (!match) {
      return undefined
    }

    const downloadedBytes = Number(match[1])
    const totalBytes = Number(match[2])
    const speed = match[3] === 'NA' ? '--' : match[3]
    const eta = match[4] === 'NA' ? '--' : match[4]

    if (!Number.isFinite(downloadedBytes) || !Number.isFinite(totalBytes) || totalBytes <= 0) {
      return {
        speed,
        eta,
      }
    }

    const percent = Math.min(100, Math.max(0, (downloadedBytes / totalBytes) * 100))
    return {
      percent,
      downloaded: `${Math.round(downloadedBytes / 1024 / 1024)}MB`,
      total: `${Math.round(totalBytes / 1024 / 1024)}MB`,
      speed,
      eta,
    }
  }

  private async startTask(task: QueueTask): Promise<void> {
    const id = task.options.id
    try {
      await ensureDir(task.workspacePath)
      this.emit(id, 'fetching-info', { message: 'Fetching metadata' })
      task.media = await this.getMediaInfo(task.options.url)
      this.emit(id, 'downloading', { message: `Downloading ${task.media.title}` })

      const args = this.buildArgs(task)
      const child = spawn(this.ytdlpBin, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        detached: process.platform !== 'win32',
      })
      task.child = child

      const handleProgressLine = (line: string): void => {
        const templateProgress = this.parseTemplateProgress(line)
        if (templateProgress) {
          this.emit(id, 'downloading', {
            ...templateProgress,
          })
          return
        }

        if (line.includes('[ffmpeg]') || line.toLowerCase().includes('merging formats')) {
          this.emit(id, 'postprocessing', { message: 'Post-processing media with FFmpeg' })
        }
      }

      child.stdout.on('data', (buffer) => {
        const text = buffer.toString()
        text
          .split('\n')
          .map((line: string) => line.trim())
          .filter(Boolean)
          .forEach(handleProgressLine)
      })

      child.stderr.on('data', (buffer) => {
        const text = buffer.toString()
        text
          .split('\n')
          .map((line: string) => line.trim())
          .filter(Boolean)
          .forEach(handleProgressLine)
      })

      await new Promise<void>((resolve, reject) => {
        child.on('error', reject)
        child.on('close', (code) => {
          if (code === 0) {
            resolve()
          } else {
            reject(new Error(`yt-dlp exited with code ${code}`))
          }
        })
      })

      const outputFiles = await this.promoteTaskOutputs(task)
      this.emit(id, 'completed', {
        percent: 100,
        eta: '0s',
        message: 'Download completed',
        filePath: outputFiles[0] ?? path.resolve(this.downloadDir),
      })
      await this.persistHistory(task, 'completed')
    } catch (error) {
      if (this.cancelled.has(id)) {
        return
      }
      this.emit(id, 'failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      await this.persistHistory(task, 'failed')
    } finally {
      this.active.delete(id)
      this.cancelled.delete(id)
      this.scheduleWorkspaceCleanup(task)
      this.pump()
    }
  }

  private async promoteTaskOutputs(task: QueueTask): Promise<string[]> {
    await ensureDir(this.downloadDir)
    const files = await fs.readdir(task.workspacePath)
    const outputs: string[] = []

    for (const file of files) {
      if (!file.includes(`-${task.options.id}.`)) {
        continue
      }

      const from = path.join(task.workspacePath, file)
      const to = path.join(this.downloadDir, file)
      await fs.rename(from, to)
      outputs.push(path.resolve(to))
    }

    return outputs
  }

  private scheduleWorkspaceCleanup(task: QueueTask): void {
    setTimeout(() => {
      void fs.rm(task.workspacePath, { recursive: true, force: true })
      const snapshot = this.progressHub.getLatest(task.options.id)
      if (snapshot?.status === 'completed') {
        this.emit(task.options.id, 'cleaned', {
          message: 'Temporary files cleaned',
        })
      }
    }, this.taskRetentionMs)
  }

  private async persistHistory(task: QueueTask, status: DownloadStatus): Promise<void> {
    const snapshot = this.progressHub.getLatest(task.options.id)
    const now = new Date().toISOString()

    const item: HistoryItem = {
      id: task.options.id,
      status,
      url: task.options.url,
      title: task.media?.title,
      percent: snapshot?.percent ?? 0,
      speed: snapshot?.speed ?? '--',
      eta: snapshot?.eta ?? '--',
      downloaded: snapshot?.downloaded ?? '--',
      total: snapshot?.total ?? '--',
      message: snapshot?.message,
      filePath: snapshot?.filePath,
      createdAt: task.createdAt,
      updatedAt: now,
    }

    await this.historyStore.push(item)
  }
}
