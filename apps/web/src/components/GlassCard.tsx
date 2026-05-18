import type { PropsWithChildren } from 'react'
import clsx from 'clsx'

interface GlassCardProps extends PropsWithChildren {
  className?: string
}

export function GlassCard({ className, children }: GlassCardProps) {
  return (
    <section
      className={clsx(
        'rounded-3xl border border-white/20 bg-white/10 p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl',
        className,
      )}
    >
      {children}
    </section>
  )
}
