import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { app } from './app.js'
import { env } from './config/env.js'
import { cleanupOldFiles, ensureDir } from './utils/files.js'

async function assertBinary(binary: string, args: string[] = ['--version']): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(binary, args, { stdio: 'ignore', shell: false })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${binary} is not available`))
      }
    })
  })
}

async function bootstrap(): Promise<void> {
  await Promise.all([
    ensureDir(env.DOWNLOAD_DIR),
    ensureDir(env.TEMP_DIR),
    ensureDir(path.dirname(env.HISTORY_FILE)),
  ])

  try {
    await Promise.all([
      assertBinary(env.YTDLP_BIN),
      assertBinary(env.FFMPEG_BIN),
      fs.access(env.HISTORY_FILE).catch(() => fs.writeFile(env.HISTORY_FILE, '[]', 'utf-8')),
    ])
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Missing required binary'}\n`)
  }

  setInterval(() => {
    void cleanupOldFiles(env.TEMP_DIR, 24 * 60 * 60 * 1000)
  }, 60 * 60 * 1000)

  app.listen(env.PORT, () => {
    process.stdout.write(`Vivace-sity server running on port ${env.PORT}\n`)
  })
}

void bootstrap()
