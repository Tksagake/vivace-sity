import type { PropsWithChildren } from 'react'
import clsx from 'clsx'

interface GlassCardProps extends PropsWithChildren {
  className?: string
}

export function GlassCard({ className, children }: GlassCardProps) {
  return (
    <section
      className={clsx(
        'rounded-2xl border border-slate-300/20 bg-slate-900/70 p-5 shadow-sm',
        className,
      )}
    >
      {children}
    </section>
  )
}
