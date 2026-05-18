import { motion } from 'framer-motion'
import { ArrowDownToLine, LoaderCircle, Music2, Video } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { fetchInfo, startDownload } from '../lib/api'
import { useClipboardDetector } from '../hooks/useClipboardDetector'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useDownloaderStore } from '../store/useDownloaderStore'
import type { DownloadRequest, DownloadTask } from '../types'
import { AudioVisualizer } from './AudioVisualizer'
import { GlassCard } from './GlassCard'

const defaultRequest: DownloadRequest = {
  url: '',
  format: 'mp4',
  resolution: 'best',
  subtitles: false,
  subtitleLanguage: 'en',
  playlist: false,
  audioQuality: '2',
}

interface DownloaderPanelProps {
  onTaskCreated: (id: string) => void
}

export function DownloaderPanel({ onTaskCreated }: DownloaderPanelProps) {
  const url = useDownloaderStore((state) => state.url)
  const setUrl = useDownloaderStore((state) => state.setUrl)
  const metadata = useDownloaderStore((state) => state.metadata)
  const setMetadata = useDownloaderStore((state) => state.setMetadata)
  const loadingInfo = useDownloaderStore((state) => state.loadingInfo)
  const setLoadingInfo = useDownloaderStore((state) => state.setLoadingInfo)
  const upsertTask = useDownloaderStore((state) => state.upsertTask)
  const pushToast = useDownloaderStore((state) => state.pushToast)

  const [request, setRequest] = useState<DownloadRequest>(defaultRequest)
  const [submitting, setSubmitting] = useState(false)

  const currentUrl = useMemo(() => request.url || url, [request.url, url])

  const onFetchInfo = useCallback(async () => {
    if (!currentUrl) return
    try {
      setLoadingInfo(true)
      const info = await fetchInfo(currentUrl)
      setMetadata(info)
      pushToast({ type: 'info', message: 'Metadata loaded.' })
    } catch (error) {
      pushToast({ type: 'error', message: error instanceof Error ? error.message : 'Failed to fetch metadata.' })
    } finally {
      setLoadingInfo(false)
    }
  }, [currentUrl, pushToast, setLoadingInfo, setMetadata])

  const onSubmit = useCallback(async () => {
    if (!currentUrl) return
    try {
      setSubmitting(true)
      const payload = {
        ...request,
        url: currentUrl,
      }
      const response = await startDownload(payload)
      const optimisticTask: DownloadTask = {
        id: response.id,
        status: 'queued',
        percent: 0,
        speed: '--',
        eta: '--',
        downloaded: '--',
        total: '--',
        url: currentUrl,
      }
      upsertTask(optimisticTask)
      onTaskCreated(response.id)
      pushToast({ type: 'success', message: 'Download queued.' })
    } catch (error) {
      pushToast({ type: 'error', message: error instanceof Error ? error.message : 'Download request failed.' })
    } finally {
      setSubmitting(false)
    }
  }, [currentUrl, onTaskCreated, pushToast, request, upsertTask])

  const onPasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setUrl(text)
        setRequest((prev) => ({ ...prev, url: text }))
      }
    } catch {
      pushToast({ type: 'info', message: 'Clipboard permission is blocked.' })
    }
  }, [pushToast, setUrl])

  useClipboardDetector((detected) => {
    if (currentUrl) {
      return
    }
    setUrl(detected)
    setRequest((prev) => ({ ...prev, url: detected }))
  })

  useKeyboardShortcuts({
    onPasteFromClipboard,
    onSubmit,
  })

  return (
    <GlassCard className="space-y-5 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">Paste a YouTube link</h2>
        <span className="rounded-full border border-slate-400/40 bg-slate-800/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200">
          Ctrl/Cmd+Enter to download
        </span>
      </div>

      <label
        htmlFor="yt-url"
        onDrop={(event) => {
          event.preventDefault()
          const text = event.dataTransfer.getData('text')
          if (text) {
            setUrl(text)
            setRequest((prev) => ({ ...prev, url: text }))
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        className="group block rounded-2xl border border-slate-400/30 bg-slate-900/60 p-4 transition hover:border-slate-300/60"
      >
        <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-200">YouTube URL</div>
        <input
          id="yt-url"
          value={currentUrl}
          onChange={(event) => {
            setUrl(event.target.value)
            setRequest((prev) => ({ ...prev, url: event.target.value }))
          }}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <select
          value={request.format}
          onChange={(event) => setRequest((prev) => ({ ...prev, format: event.target.value as DownloadRequest['format'] }))}
          className="rounded-xl border border-white/25 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="mp4">MP4 Video</option>
          <option value="mp3">MP3 Audio</option>
        </select>

        <select
          value={request.resolution}
          onChange={(event) =>
            setRequest((prev) => ({
              ...prev,
              resolution: event.target.value as DownloadRequest['resolution'],
            }))
          }
          className="rounded-xl border border-white/25 bg-black/30 px-3 py-2 text-sm text-white"
        >
          {['best', '2160', '1440', '1080', '720', '480', '360'].map((resolution) => (
            <option key={resolution} value={resolution}>
              {resolution === 'best' ? 'Best Quality' : `${resolution}p`}
            </option>
          ))}
        </select>

        <select
          value={request.audioQuality}
          onChange={(event) =>
            setRequest((prev) => ({
              ...prev,
              audioQuality: event.target.value as DownloadRequest['audioQuality'],
            }))
          }
          className="rounded-xl border border-white/25 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="0">Audio Best</option>
          <option value="2">Audio High</option>
          <option value="5">Audio Medium</option>
          <option value="9">Audio Low</option>
        </select>

        <label className="flex items-center gap-2 rounded-xl border border-white/25 bg-black/30 px-3 py-2 text-sm text-white">
          <input
            type="checkbox"
            checked={request.subtitles}
            onChange={(event) => setRequest((prev) => ({ ...prev, subtitles: event.target.checked }))}
            className="accent-fuchsia-400"
          />
          Subtitles
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-white/25 bg-black/30 px-3 py-2 text-sm text-white md:col-span-2 lg:col-span-1">
          <input
            type="checkbox"
            checked={request.playlist}
            onChange={(event) => setRequest((prev) => ({ ...prev, playlist: event.target.checked }))}
            className="accent-cyan-400"
          />
          Playlist support
        </label>

        <input
          value={request.subtitleLanguage}
          onChange={(event) => setRequest((prev) => ({ ...prev, subtitleLanguage: event.target.value }))}
          placeholder="Subtitle lang (en)"
          className="rounded-xl border border-white/25 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={onFetchInfo}
          disabled={loadingInfo || !currentUrl}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-400/40 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingInfo ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Fetch metadata
        </button>
      </div>

      {loadingInfo && (
        <div className="grid gap-3 md:grid-cols-[120px_1fr]">
          <div className="h-[76px] animate-pulse rounded-xl bg-white/20" />
          <div className="space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/20" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/15" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      )}

      {metadata && !loadingInfo && (
        <motion.div layout className="grid gap-3 rounded-2xl border border-slate-500/30 bg-slate-900/50 p-3 md:grid-cols-[120px_1fr]">
          <img src={metadata.thumbnail} alt={metadata.title} className="h-[76px] w-[120px] rounded-lg object-cover" />
          <div className="space-y-1 text-sm text-slate-200">
            <div className="line-clamp-2 text-base font-semibold text-white">{metadata.title}</div>
            <div>{metadata.uploader}</div>
            <div className="text-xs text-slate-300">Duration: {Math.floor(metadata.duration / 60)}m {metadata.duration % 60}s</div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!currentUrl || submitting}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {request.format === 'mp3' ? <Music2 className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          {submitting ? 'Starting...' : 'Start download'}
          <ArrowDownToLine className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onPasteFromClipboard}
          className="rounded-xl border border-slate-400/40 bg-slate-900/60 px-4 py-2 text-sm text-white transition hover:bg-slate-800/70"
        >
          Paste from clipboard
        </button>
      </div>

      <AudioVisualizer />
    </GlassCard>
  )
}
