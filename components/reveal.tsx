"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

// Pembungkus tipis: konten fade-in + geser naik sedikit saat pertama kali
// masuk viewport waktu di-scroll. `once` supaya tidak berulang tiap kali
// scroll lewat, `delay` buat efek stagger antar item di dalam grid.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
