"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Award,
  CalendarClock,
  Loader2,
  MessageSquareText,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { formatRupiah } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatCard = {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
}

const MENU_KAJUR = [
  { href: "/kajur/sertifikat-manual", label: "Sertifikat Manual", desc: "Terbitkan sertifikat manual untuk siswa jurusan Anda.", icon: Award },
  { href: "/kajur/inovasi-siswa", label: "Project & Inovasi Siswa", desc: "ACC atau tolak project siswa jurusan Anda.", icon: Sparkles },
  { href: "/kajur/catatan-siswa", label: "Catatan Siswa", desc: "Catat progres etika, kehadiran, dan hal lainnya.", icon: MessageSquareText },
  { href: "/kajur/keuangan-siswa", label: "Keuangan Siswa", desc: "Kelola target iuran dan lacak pembayaran siswa.", icon: Wallet },
]

type SiswaJurusan = { id_siswa: string; tingkat?: string }
type SertifikatRow = { status: "aktif" | "dicabut" }
type ProjectRow = { status: "pending" | "approved" | "rejected" }
type CatatanSiswaRow = { jumlah_positif: number; jumlah_negatif: number }
type KategoriRow = {
  status: "aktif" | "selesai" | "dibatalkan"
  total_terkumpul: number
  nama_kategori: string
  tenggat: string | null
}

export default function KajurDashboardPage() {
  const [cards, setCards] = useState<StatCard[] | null>(null)
  const [tenggatTerdekat, setTenggatTerdekat] = useState<{ nama: string; tenggat: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const muat = async () => {
      try {
        const [siswaRes, sertifikatRes, projectRes, catatanRes, kategoriRes] = await Promise.all([
          apiFetch("/sertifikat/siswa-jurusan"),
          apiFetch("/sertifikat/manual"),
          apiFetch("/project-siswa/kajur"),
          apiFetch("/catatan-siswa/siswa-jurusan"),
          apiFetch("/keuangan-siswa/kategori"),
        ])

        if (cancelled) return

        const siswaList: SiswaJurusan[] = siswaRes.data || []
        const sertifikatList: SertifikatRow[] = sertifikatRes.data || []
        const projectList: ProjectRow[] = projectRes.data || []
        const catatanList: CatatanSiswaRow[] = catatanRes.data || []
        const kategoriList: KategoriRow[] = kategoriRes.data || []

        const jumlahPerTingkat = { "10": 0, "11": 0, "12": 0 } as Record<string, number>
        siswaList.forEach((s) => {
          if (s.tingkat && jumlahPerTingkat[s.tingkat] !== undefined) jumlahPerTingkat[s.tingkat] += 1
        })

        const sertifikatAktif = sertifikatList.filter((s) => s.status === "aktif").length
        const projectPending = projectList.filter((p) => p.status === "pending").length
        const projectApproved = projectList.filter((p) => p.status === "approved").length

        const totalPositif = catatanList.reduce((sum, s) => sum + s.jumlah_positif, 0)
        const totalNegatif = catatanList.reduce((sum, s) => sum + s.jumlah_negatif, 0)

        const kategoriAktif = kategoriList.filter((k) => k.status === "aktif")
        const totalTerkumpulAktif = kategoriAktif.reduce((sum, k) => sum + k.total_terkumpul, 0)

        const kategoriDenganTenggat = kategoriAktif
          .filter((k) => k.tenggat)
          .sort((a, b) => new Date(a.tenggat!).getTime() - new Date(b.tenggat!).getTime())
        if (kategoriDenganTenggat.length > 0) {
          setTenggatTerdekat({
            nama: kategoriDenganTenggat[0].nama_kategori,
            tenggat: kategoriDenganTenggat[0].tenggat!,
          })
        }

        setCards([
          {
            label: "Total Siswa Jurusan",
            value: siswaList.length.toLocaleString("id-ID"),
            sub: `Kelas 10: ${jumlahPerTingkat["10"]} · 11: ${jumlahPerTingkat["11"]} · 12: ${jumlahPerTingkat["12"]}`,
            icon: Users,
          },
          {
            label: "Sertifikat Aktif",
            value: String(sertifikatAktif),
            sub: `${sertifikatList.length} total diterbitkan`,
            icon: Award,
          },
          {
            label: "Project Menunggu ACC",
            value: String(projectPending),
            sub: `${projectApproved} sudah disetujui`,
            icon: Sparkles,
          },
          {
            label: "Catatan Siswa",
            value: String(totalPositif + totalNegatif),
            sub: `${totalPositif} positif · ${totalNegatif} negatif`,
            icon: MessageSquareText,
          },
          {
            label: "Kategori Keuangan Aktif",
            value: String(kategoriAktif.length),
            sub: `${formatRupiah(totalTerkumpulAktif)} terkumpul`,
            icon: Wallet,
          },
        ])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data dashboard.")
        }
      }
    }

    muat()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Kepala Jurusan</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan siswa, sertifikat, project, catatan, dan keuangan jurusan Anda.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!cards && !error ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : (
        cards && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.label} className="dashboard-card">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <card.icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tracking-tight truncate">{card.value}</p>
                  {card.sub && (
                    <p className="text-xs text-muted-foreground">{card.sub}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            <Card className="dashboard-card">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tenggat Terdekat
                </CardTitle>
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarClock className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                {tenggatTerdekat ? (
                  <>
                    <p className="text-lg font-bold tracking-tight truncate">
                      {new Date(tenggatTerdekat.tenggat).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{tenggatTerdekat.nama}</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold tracking-tight text-muted-foreground">-</p>
                    <p className="text-xs text-muted-foreground">Tidak ada tenggat aktif</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )
      )}

      {cards && (
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Perlu Perhatian</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(() => {
              const projectPending = Number(cards.find((c) => c.label === "Project Menunggu ACC")?.value || 0)
              if (projectPending === 0) {
                return <p className="text-sm text-muted-foreground">Tidak ada yang perlu ditindaklanjuti saat ini.</p>
              }
              return (
                <Link href="/kajur/inovasi-siswa">
                  <Badge variant="secondary" className="cursor-pointer px-3 py-1.5 text-sm hover:bg-secondary/80">
                    {projectPending} project menunggu ACC
                  </Badge>
                </Link>
              )
            })()}
          </CardContent>
        </Card>
      )}

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-base font-bold">Menu Kajur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MENU_KAJUR.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/70">
                  <item.icon className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
