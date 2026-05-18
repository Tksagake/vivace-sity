import { Moon, Sun } from 'lucide-react'
import { useDownloaderStore } from '../store/useDownloaderStore'

export function ThemeToggle() {
  const theme = useDownloaderStore((state) => state.theme)
  const toggleTheme = useDownloaderStore((state) => state.toggleTheme)

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-slate-400/40 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-slate-800/70"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {theme}
    </button>
  )
}
