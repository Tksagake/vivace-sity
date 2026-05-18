import { useEffect } from 'react'

const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i

export function useClipboardDetector(onDetected: (url: string) => void): void {
  useEffect(() => {
    let active = true

    async function run(): Promise<void> {
      try {
        if (!navigator.clipboard?.readText) {
          return
        }
        const text = await navigator.clipboard.readText()
        if (active && youtubeRegex.test(text)) {
          onDetected(text.trim())
        }
      } catch {
        // Clipboard access can fail without permission.
      }
    }

    void run()
    return () => {
      active = false
    }
  }, [onDetected])
}
