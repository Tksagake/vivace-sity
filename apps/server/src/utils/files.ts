import fs from 'node:fs/promises'
import path from 'node:path'
import sanitize from 'sanitize-filename'

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

export function safeOutputTemplate(baseDir: string): string {
  const safeName = sanitize('%(title)s') || 'media'
  return path.join(baseDir, `${safeName}-%(id)s.%(ext)s`)
}

export async function cleanupOldFiles(dir: string, maxAgeMs: number): Promise<void> {
  const now = Date.now()
  const entries = await fs.readdir(dir, { withFileTypes: true })

  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const filePath = path.join(dir, entry.name)
        const stat = await fs.stat(filePath)
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.rm(filePath, { force: true })
        }
      }),
  )
}
