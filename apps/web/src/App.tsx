import { useEffect, useRef } from 'react'
import { getProgressStreamUrl } from './lib/api'
import { DownloaderPanel } from './components/DownloaderPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { QueuePanel } from './components/QueuePanel'
import { ThemeToggle } from './components/ThemeToggle'
import { Toasts } from './components/Toasts'
import { useDownloaderStore } from './store/useDownloaderStore'
import type { DownloadTask } from './types'

function App() {
  const hydrateHistory = useDownloaderStore((state) => state.hydrateHistory)
  const upsertTask = useDownloaderStore((state) => state.upsertTask)
  const theme = useDownloaderStore((state) => state.theme)

  const streamsRef = useRef<Map<string, EventSource>>(new Map())

  useEffect(() => {
    void hydrateHistory()
  }, [hydrateHistory])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const streams = streamsRef.current
    return () => {
      streams.forEach((stream) => stream.close())
      streams.clear()
    }
  }, [])

  const attachStream = (id: string): void => {
    if (streamsRef.current.has(id)) return

    const stream = new EventSource(getProgressStreamUrl(id), {
      withCredentials: false,
    })

    stream.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as DownloadTask
        upsertTask(data)

        if (['completed', 'failed', 'cancelled'].includes(data.status)) {
          stream.close()
          streamsRef.current.delete(id)
        }
      } catch {
        // ignore malformed event
      }
    }

    stream.onerror = () => {
      stream.close()
      streamsRef.current.delete(id)
    }

    streamsRef.current.set(id, stream)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Toasts />

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Vivace-sity</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
              Download YouTube video and audio locally.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
              A straightforward downloader powered by yt-dlp and FFmpeg.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <section className="space-y-6">
          <DownloaderPanel onTaskCreated={attachStream} />
          <div className="grid gap-6 lg:grid-cols-2">
            <QueuePanel />
            <HistoryPanel />
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
