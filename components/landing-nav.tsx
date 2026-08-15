"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

const LINKS = [
  { href: "#tentang", label: "Tentang" },
  { href: "#jurusan", label: "Jurusan" },
  { href: "#prestasi", label: "Prestasi" },
  { href: "#inovasi", label: "Inovasi" },
  { href: "#fasilitas", label: "Fasilitas" },
  { href: "#lokasi", label: "Lokasi" },
]

export function LandingNav({ namaSekolah }: { namaSekolah: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Logo" width={36} height={36} className="h-9 w-auto object-contain" />
          <span className="font-bold tracking-tight">{namaSekolah}</span>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/login"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/80"
          >
            Masuk Portal
          </Link>
        </div>

        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg border border-border lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-2">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
            >
              Masuk Portal
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
