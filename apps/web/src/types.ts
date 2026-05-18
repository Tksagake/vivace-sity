export type DownloadFormat = 'mp4' | 'mp3'
export type DownloadStatus =
  | 'queued'
  | 'fetching-info'
  | 'downloading'
  | 'postprocessing'
  | 'completed'
  | 'cleaned'
  | 'failed'
  | 'cancelled'

export interface MediaInfo {
  title: string
  uploader: string
  duration: number
  thumbnail: string
  webpage_url: string
}

export interface DownloadTask {
  id: string
  status: DownloadStatus
  percent: number
  speed: string
  eta: string
  downloaded: string
  total: string
  message?: string
  filePath?: string
  url?: string
}

export interface HistoryItem extends DownloadTask {
  createdAt: string
  updatedAt: string
  title?: string
  url: string
}

export interface DownloadRequest {
  url: string
  format: DownloadFormat
  resolution: 'best' | '2160' | '1440' | '1080' | '720' | '480' | '360'
  subtitles: boolean
  subtitleLanguage: string
  playlist: boolean
  audioQuality: '0' | '2' | '5' | '9'
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}
