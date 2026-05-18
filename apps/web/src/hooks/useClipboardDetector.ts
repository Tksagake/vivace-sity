import { useEffect } from 'react'

const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i

export function useClipboardDetector(onDetected: (url: string) => void): void {
  useEffect(() => {
    let active = true
    let hasRead = false

    async function run(): Promise<void> {
      try {
        if (hasRead) {
          return
        }
        if (!navigator.clipboard?.readText) {
          return
        }
        const text = await navigator.clipboard.readText()
        if (active && youtubeRegex.test(text)) {
          hasRead = true
          onDetected(text.trim())
        }
      } catch {
        // Clipboard access can fail without permission.
      }
    }

    const onFocus = (): void => {
      void run()
    }

    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      window.removeEventListener('focus', onFocus)
    }
  }, [onDetected])
}
