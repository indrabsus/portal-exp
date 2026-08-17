"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type JurusanCarouselItem = {
  kode: string
  nama: string
  ketua: string | null
  foto: string | null
}

// Carousel satu-fokus (bukan grid rame): satu jurusan tampil besar,
// pindah ke jurusan lain lewat crossfade + geser halus (AnimatePresence),
// auto-maju tiap beberapa detik, bisa juga dikontrol manual lewat panah/dot.
export function JurusanCarousel({ items }: { items: JurusanCarouselItem[] }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => {
      setDirection(1)
      setIndex((i) => (i + 1) % items.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [items.length])

  if (items.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">Data jurusan belum tersedia.</p>
  }

  const go = (dir: number) => {
    setDirection(dir)
    setIndex((i) => (i + dir + items.length) % items.length)
  }

  const current = items[index]

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="relative h-80 overflow-hidden rounded-3xl shadow-2xl shadow-black/20 sm:h-[26rem]">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={current.kode}
            initial={{ opacity: 0, x: direction > 0 ? 36 : -36, scale: 1.03 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction > 0 ? -36 : 36, scale: 0.98 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {current.foto ? (
              <Image
                src={current.foto}
                alt={current.nama}
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
                priority={index === 0}
              />
            ) : (
              <div className="size-full bg-gradient-to-br from-primary/30 to-accent/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <span className="mb-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                {current.kode}
              </span>
              <h3 className="text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">{current.nama}</h3>
              {current.ketua && (
                <p className="mt-1.5 text-sm text-white/80 drop-shadow-sm">
                  Ketua Program Keahlian: <span className="font-medium text-white">{current.ketua}</span>
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Jurusan sebelumnya"
            className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Jurusan berikutnya"
            className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="mt-5 flex justify-center gap-2">
            {items.map((it, i) => (
              <button
                key={it.kode}
                type="button"
                onClick={() => {
                  setDirection(i > index ? 1 : -1)
                  setIndex(i)
                }}
                aria-label={`Ke jurusan ${it.nama}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-7 bg-primary" : "w-1.5 bg-primary/25 hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
