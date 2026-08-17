"use client"

import type { ReactNode } from "react"
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "framer-motion"

function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// Bikin konten (teks, logo, tombol, card — apa saja) "pecah" saat discroll:
// melayang, berputar, mengabur, lalu memudar. Dipetakan dari posisi scroll
// halaman (scrollY) ke rentang piksel `range` — beri tiap elemen rentang yang
// sedikit bergeser satu sama lain supaya pecahnya terasa bertahap/berurutan,
// bukan serentak semua.
export function ShatterOut({
  children,
  className,
  seed = 0,
  range = [80, 520],
}: {
  children: ReactNode
  className?: string
  seed?: number
  range?: [number, number]
}) {
  const { scrollY } = useScroll()
  const shouldReduceMotion = useReducedMotion()
  const progress = useTransform(scrollY, range, [0, 1])

  const dirX = (seededRandom(seed + 1) - 0.5) * 2
  const dirRotate = (seededRandom(seed + 2) - 0.5) * 2
  const fallExtra = seededRandom(seed + 3) * 60

  const x = useTransform(progress, [0, 1], [0, shouldReduceMotion ? 0 : dirX * 140])
  const y = useTransform(progress, [0, 1], [0, shouldReduceMotion ? 0 : 60 + fallExtra])
  const rotate = useTransform(progress, [0, 1], [0, shouldReduceMotion ? 0 : dirRotate * 30])
  const scale = useTransform(progress, [0, 1], [1, shouldReduceMotion ? 1 : 0.82])
  const opacity = useTransform(progress, [0, 0.85], [1, 0])
  const blurPx = useTransform(progress, [0, 1], [0, shouldReduceMotion ? 0 : 10])
  const filter = useMotionTemplate`blur(${blurPx}px)`

  return (
    <motion.div style={{ x, y, rotate, scale, opacity, filter }} className={className}>
      {children}
    </motion.div>
  )
}
