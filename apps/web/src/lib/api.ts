import type { DownloadRequest, DownloadTask, HistoryItem, MediaInfo } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: unknown } | null
    const message = typeof errorBody?.error === 'string' ? errorBody.error : 'Request failed'
    throw new Error(message)
  }

  return (await response.json()) as T
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
  const base = API_BASE.startsWith('http') ? API_BASE : window.location.origin + API_BASE
  return `${base}/stream/${id}`
}
