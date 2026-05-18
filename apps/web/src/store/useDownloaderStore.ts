import { create } from 'zustand'
import { fetchHistory } from '../lib/api'
import type { DownloadTask, HistoryItem, MediaInfo, Toast } from '../types'

interface DownloaderState {
  url: string
  metadata?: MediaInfo
  queue: Record<string, DownloadTask>
  history: HistoryItem[]
  toasts: Toast[]
  loadingInfo: boolean
  loadingHistory: boolean
  theme: 'dark' | 'light'
  setUrl: (url: string) => void
  setMetadata: (metadata?: MediaInfo) => void
  setLoadingInfo: (value: boolean) => void
  upsertTask: (task: DownloadTask) => void
  removeTask: (id: string) => void
  hydrateHistory: () => Promise<void>
  pushToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  toggleTheme: () => void
}

export const useDownloaderStore = create<DownloaderState>((set, get) => ({
  url: '',
  queue: {},
  history: [],
  toasts: [],
  loadingInfo: false,
  loadingHistory: false,
  theme: 'dark',

  setUrl: (url) => set({ url }),
  setMetadata: (metadata) => set({ metadata }),
  setLoadingInfo: (value) => set({ loadingInfo: value }),

  upsertTask: (task) => {
    set((state) => ({
      queue: {
        ...state.queue,
        [task.id]: {
          ...state.queue[task.id],
          ...task,
        },
      },
    }))

    if (task.status === 'completed') {
      get().pushToast({ type: 'success', message: 'Track exported successfully.' })
      void get().hydrateHistory()
    }

    if (task.status === 'failed') {
      get().pushToast({ type: 'error', message: task.message ?? 'Download failed.' })
      void get().hydrateHistory()
    }

    if (task.status === 'cancelled') {
      get().pushToast({ type: 'info', message: 'Download cancelled.' })
      void get().hydrateHistory()
    }
  },

  removeTask: (id) =>
    set((state) => {
      const next = { ...state.queue }
      delete next[id]
      return { queue: next }
    }),

  hydrateHistory: async () => {
    set({ loadingHistory: true })
    try {
      const history = await fetchHistory()
      set({ history })
    } catch {
      set({ history: [] })
    } finally {
      set({ loadingHistory: false })
    }
  },

  pushToast: (toast) => {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
}))
