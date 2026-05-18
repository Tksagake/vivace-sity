import type { DownloadRequest, DownloadTask, HistoryItem, MediaInfo } from '../types'

const configuredApiBase = import.meta.env.VITE_API_BASE_URL

function normalizeBase(base: string): string {
  if (!base) return ''
  return base.replace(/\/+$/, '')
}

function joinPath(base: string, path: string): string {
  return `${normalizeBase(base)}${path.startsWith('/') ? path : `/${path}`}`
}

function createApiBaseCandidates(): string[] {
  if (configuredApiBase) {
    const base = normalizeBase(configuredApiBase)
    return base === '/api' ? ['/api', ''] : [base]
  }
  return ['/api', '']
}

const API_BASE_CANDIDATES = createApiBaseCandidates()
let resolvedApiBase = API_BASE_CANDIDATES[0] ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let fallbackError: Error | null = null

  for (const base of API_BASE_CANDIDATES) {
    const response = await fetch(joinPath(base, path), {
      headers: {
        'Content-Type': 'application/json',
      },
      ...init,
    })

    if (response.ok) {
      resolvedApiBase = base
      return (await response.json()) as T
    }

    const errorBody = (await response.json().catch(() => null)) as { error?: unknown } | null
    const message = typeof errorBody?.error === 'string' ? errorBody.error : 'Request failed'

    if (response.status === 404 && base === '/api') {
      fallbackError = new Error(message)
      continue
    }

    throw new Error(message)
  }

  throw fallbackError ?? new Error('Request failed')
}

export function fetchInfo(url: string): Promise<MediaInfo> {
  return request<MediaInfo>('/info', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

export function startDownload(payload: DownloadRequest): Promise<{ id: string; status: string }> {
  return request('/download', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function cancelDownload(id: string): Promise<{ id: string; status: string }> {
  return request(`/cancel/${id}`, {
    method: 'POST',
  })
}

export function fetchHistory(): Promise<HistoryItem[]> {
  return request('/history')
}

export function fetchProgress(id: string): Promise<DownloadTask> {
  return request(`/progress/${id}`)
}

export function getProgressStreamUrl(id: string): string {
  const base = resolvedApiBase
  if (base.startsWith('http')) {
    return `${base}/stream/${id}`
  }
  return `${window.location.origin}${joinPath(base, `/stream/${id}`)}`
}
