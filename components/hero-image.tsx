"use client"

import Image from "next/image"
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion"

// Foto hero: tetap menempel di belakang layar (fixed) selama halaman
// di-scroll. Mulai dari hero.jpg yang zoom-in pelan; begitu zoom-nya
// "selesai" (scroll ~600-900px), foto berganti ke staf-pengajar.jpg lewat
// transisi blur (hero.jpg blur+fade keluar, staf-pengajar blur masuk lalu
// jadi tajam), lalu lanjut zoom pelan sendiri.
export function HeroImage() {
  const { scrollY } = useScroll()

  const heroJpgOpacity = useTransform(scrollY, [0, 600, 900], [1, 1, 0])
  const heroJpgScale = useTransform(scrollY, [0, 900], [1, 1.25])
  const heroJpgBlurPx = useTransform(scrollY, [600, 900], [0, 14])
  const heroJpgFilter = useMotionTemplate`blur(${heroJpgBlurPx}px)`

  const stafOpacity = useTransform(scrollY, [600, 900], [0, 1])
  const stafScale = useTransform(scrollY, [600, 1500], [1.05, 1.22])
  const stafBlurPx = useTransform(scrollY, [600, 900], [14, 0])
  const stafFilter = useMotionTemplate`blur(${stafBlurPx}px)`

  return (
    <div className="fixed inset-0 overflow-hidden">
      <motion.div
        style={{ opacity: heroJpgOpacity, scale: heroJpgScale, filter: heroJpgFilter }}
        className="absolute inset-0"
      >
        <Image src="/hero.jpg" alt="" aria-hidden fill priority className="object-cover" />
      </motion.div>

      <motion.div
        style={{ opacity: stafOpacity, scale: stafScale, filter: stafFilter }}
        className="absolute inset-0"
      >
        <Image src="/staf-pengajar.jpg" alt="" aria-hidden fill priority className="object-cover" />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
    </div>
  )
}
