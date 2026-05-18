import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { useEffect } from 'react'
import { useDownloaderStore } from '../store/useDownloaderStore'

export function Toasts(): JSX.Element {
  const toasts = useDownloaderStore((state) => state.toasts)
  const dismiss = useDownloaderStore((state) => state.dismissToast)

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dismiss(toast.id)
      }, 3000),
    )

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [toasts, dismiss])

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/20 bg-black/70 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-xl"
          >
            {toast.type === 'success' && <CircleCheck className="h-4 w-4 text-emerald-400" />}
            {toast.type === 'error' && <CircleAlert className="h-4 w-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="h-4 w-4 text-cyan-400" />}
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
