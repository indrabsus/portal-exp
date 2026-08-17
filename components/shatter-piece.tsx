"use client"

import { useRef, type ReactNode } from "react"
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "framer-motion"

function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// Satu "keping" konten (heading, card, gambar — apa saja) yang benar2 pecah:
// terlempar jauh, berputar keras, mengecil drastis, mengabur, lalu hilang —
// begitu discroll melewati atas layar. Dipasang per elemen (bukan satu
// section sekaligus sebagai satu balok kaku) supaya tiap keping punya arah,
// rotasi, dan waktu mulai yang beda2 — kesan pecahan berantakan, bukan cuma
// geser pelan. Baru mulai pecah setelah elemen sempat fokus di tengah layar.
export function ShatterPiece({
  children,
  className,
  seed = 0,
}: {
  children: ReactNode
  className?: string
  seed?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["center center", "end 20%"] })

  const dirX = (seededRandom(seed + 1) - 0.5) * 2
  const dirRotate = (seededRandom(seed + 2) - 0.5) * 2
  const startDelay = seededRandom(seed + 3) * 0.2
  const yExtra = seededRandom(seed + 4) * 120

  const input: [number, number] = [startDelay, 1]

  const x = useTransform(scrollYProgress, input, [0, shouldReduceMotion ? 0 : dirX * 260])
  const y = useTransform(scrollYProgress, input, [0, shouldReduceMotion ? 0 : 140 + yExtra])
  const rotate = useTransform(scrollYProgress, input, [0, shouldReduceMotion ? 0 : dirRotate * 55])
  const scale = useTransform(scrollYProgress, input, [1, shouldReduceMotion ? 1 : 0.45])
  const opacity = useTransform(scrollYProgress, [startDelay, Math.min(1, startDelay + 0.55)], [1, 0])
  const blurPx = useTransform(scrollYProgress, input, [0, shouldReduceMotion ? 0 : 26])
  const filter = useMotionTemplate`blur(${blurPx}px)`

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ x, y, rotate, scale, opacity, filter }}>{children}</motion.div>
    </div>
  )
}
