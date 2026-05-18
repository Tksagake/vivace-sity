import { motion } from 'framer-motion'

const bars = Array.from({ length: 18 })

export function AudioVisualizer() {
  return (
    <div className="mt-4 flex h-10 items-end justify-center gap-1 opacity-50">
      {bars.map((_, index) => (
        <motion.span
          key={index}
          className="w-1 rounded-full bg-slate-400"
          animate={{
            height: ['25%', `${30 + ((index * 3) % 25)}%`, '28%'],
          }}
          transition={{
            duration: 1.6 + (index % 4) * 0.18,
            repeat: Infinity,
            repeatType: 'mirror',
          }}
        />
      ))}
    </div>
  )
}
