import { spawn } from 'node:child_process'
import type { MediaInfo } from '../types/download.js'

interface CommandResult {
  stdout: string
  stderr: string
}

export function runCommand(
  bin: string,
  args: string[],
  signal?: AbortSignal,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    if (signal) {
      signal.addEventListener('abort', () => {
        child.kill('SIGTERM')
      })
    }

    child.on('error', reject)

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(new Error(stderr.trim() || `Command failed with exit code ${code}`))
      }
    })
  })
}

export async function fetchMediaInfo(ytdlpBin: string, url: string): Promise<MediaInfo> {
  const { stdout } = await runCommand(ytdlpBin, ['-J', '--no-warnings', '--skip-download', url])
  const parsed = JSON.parse(stdout) as Record<string, unknown>

  return {
    title: String(parsed.title ?? 'Untitled'),
    uploader: String(parsed.uploader ?? 'Unknown creator'),
    duration: Number(parsed.duration ?? 0),
    thumbnail: String(parsed.thumbnail ?? ''),
    webpage_url: String(parsed.webpage_url ?? url),
  }
}
