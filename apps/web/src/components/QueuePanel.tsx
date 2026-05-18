import { motion } from 'framer-motion'
import { Ban, Gauge, Timer } from 'lucide-react'
import { cancelDownload } from '../lib/api'
import { useDownloaderStore } from '../store/useDownloaderStore'
import type { DownloadTask } from '../types'
import { GlassCard } from './GlassCard'

function StatusBadge({ status }: { status: DownloadTask['status'] }) {
  const tone =
    status === 'completed'
      ? 'text-emerald-300 border-emerald-300/40 bg-emerald-400/10'
      : status === 'failed'
        ? 'text-rose-300 border-rose-300/40 bg-rose-400/10'
      : status === 'cancelled'
          ? 'text-orange-300 border-orange-300/40 bg-orange-400/10'
          : 'text-slate-200 border-slate-300/30 bg-slate-700/40'

  return <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${tone}`}>{status}</span>
}

export function QueuePanel() {
  const queue = useDownloaderStore((state) => state.queue)
  const upsertTask = useDownloaderStore((state) => state.upsertTask)

  const sorted = Object.values(queue).sort((a, b) => b.percent - a.percent)

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Queue</h3>
        <span className="text-xs uppercase tracking-[0.14em] text-slate-300">{sorted.length} active / recent</span>
      </div>

      {sorted.length === 0 && <p className="text-sm text-slate-300">No active downloads.</p>}

      <div className="space-y-3">
        {sorted.map((task) => (
          <motion.article key={task.id} layout className="rounded-2xl border border-slate-500/30 bg-slate-900/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <StatusBadge status={task.status} />
              <button
                type="button"
                onClick={async () => {
                  if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
                    return
                  }
                  await cancelDownload(task.id)
                  upsertTask({ ...task, status: 'cancelled', message: 'Cancelled by user' })
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-40"
                disabled={task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'}
              >
                <Ban className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>

            <div className="mb-2 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-slate-300 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, task.percent))}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" />
                {task.speed}
              </span>
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" />
                ETA {task.eta}
              </span>
              <span>
                {task.downloaded} / {task.total}
              </span>
            </div>

            {task.message && <p className="mt-2 text-xs text-slate-400">{task.message}</p>}
          </motion.article>
        ))}
      </div>
    </GlassCard>
  )
}
