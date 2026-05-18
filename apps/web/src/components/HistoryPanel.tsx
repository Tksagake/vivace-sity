import { Download } from 'lucide-react'
import { useDownloaderStore } from '../store/useDownloaderStore'
import { GlassCard } from './GlassCard'

export function HistoryPanel(): JSX.Element {
  const history = useDownloaderStore((state) => state.history)
  const loading = useDownloaderStore((state) => state.loadingHistory)

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recently Downloaded</h3>
        <Download className="h-4 w-4 text-cyan-200" />
      </div>

      {loading && <p className="text-sm text-slate-300">Loading history…</p>}
      {!loading && history.length === 0 && <p className="text-sm text-slate-300">No media exported yet.</p>}

      <ul className="space-y-3">
        {history.slice(0, 8).map((item) => (
          <li key={item.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200">
            <div className="line-clamp-1 font-medium text-white">{item.title ?? 'Untitled media'}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{item.status}</span>
              <span>•</span>
              <span>{new Date(item.updatedAt).toLocaleString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}
