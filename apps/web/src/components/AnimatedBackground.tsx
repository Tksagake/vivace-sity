import { motion } from 'framer-motion'

export function AnimatedBackground(): JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#8b5cf680,transparent_45%),radial-gradient(circle_at_bottom,#06b6d480,transparent_40%),linear-gradient(160deg,#070812_0%,#111827_45%,#0f172a_100%)]" />
      <motion.div
        className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-fuchsia-500/30 blur-3xl"
        animate={{ x: [0, 50, -20, 0], y: [0, 30, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity }}
      />
      <motion.div
        className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"
        animate={{ x: [0, -30, 20, 0], y: [0, -40, 10, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,#ffffff08_50%,transparent_100%)] opacity-30" />
    </div>
  )
}
