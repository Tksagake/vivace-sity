import { motion } from 'framer-motion'

const bars = Array.from({ length: 28 })

export function AudioVisualizer() {
  return (
    <div className="mt-4 flex h-16 items-end justify-center gap-1 opacity-80">
      {bars.map((_, index) => (
        <motion.span
          key={index}
          className="w-1.5 rounded-full bg-gradient-to-b from-cyan-300 to-fuchsia-400"
          animate={{
            height: ['20%', `${35 + ((index * 7) % 60)}%`, '30%'],
          }}
          transition={{
            duration: 1.2 + (index % 6) * 0.16,
            repeat: Infinity,
            repeatType: 'mirror',
          }}
        />
      ))}
    </div>
  )
}
