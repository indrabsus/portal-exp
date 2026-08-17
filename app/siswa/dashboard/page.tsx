"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Award,
  BookOpen,
  CalendarClock,
  CalendarRange,
  CreditCard,
  FileText,
  GraduationCap,
  Loader2,
  NotebookPen,
  Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatCard = { label: string; value: string; sub?: string; icon: LucideIcon }

const MENU_SISWA = [
  { href: "/siswa/tugas", label: "Tugas", desc: "Kerjakan dan lihat hasil tugas dari guru.", icon: FileText },
  { href: "/siswa/nilai", label: "Nilai", desc: "Nilai dari penilaian di luar portal.", icon: NotebookPen },
  { href: "/siswa/materi", label: "Materi", desc: "Materi ajar untuk kelas Anda.", icon: BookOpen },
  { href: "/siswa/absen", label: "Absen", desc: "Riwayat kehadiran Anda.", icon: CalendarRange },
  { href: "/siswa/sertifikat", label: "Sertifikat", desc: "Sertifikat kompetensi yang sudah didapat.", icon: Award },
  { href: "/siswa/spp", label: "Status SPP", desc: "Riwayat pembayaran SPP, daftar ulang, PKL, dan ujian akhir.", icon: CreditCard },
  { href: "/siswa/ppdb", label: "Status PPDB", desc: "Status pendaftaran dan biaya masuk.", icon: GraduationCap },
  { href: "/siswa/proyek", label: "Project & Inovasi Saya", desc: "Bagikan project dan inovasi Anda.", icon: Sparkles },
]

type Tugas = { deadline: string | null; status_pengerjaan: string; judul: string }
type Nilai = { nilai: number | null }
type LogSpp = { keterangan: string; created_at: string }
type StatusPpdb = { siswa: { status: string } }

export default function SiswaDashboardPage() {
  const [cards, setCards] = useState<StatCard[] | null>(null)
  const [tenggatTerdekat, setTenggatTerdekat] = useState<{ nama: string; tenggat: string } | null>(null)
  const [tugasBelum, setTugasBelum] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const muat = async () => {
      try {
        const [tugasRes, nilaiRes, materiRes, sertifikatRes, sppRes, ppdbRes] = await Promise.all([
          apiFetch("/tugas-siswa"),
          apiFetch("/nilai-manual/siswa"),
          apiFetch("/materi-ajar/siswa"),
          apiFetch("/sertifikat/siswa"),
          apiFetch("/spp/siswa/status"),
          apiFetch("/ppdb/status-siswa"),
        ])

        if (cancelled) return

        const tugasList: Tugas[] = tugasRes.data || []
        const nilaiList: Nilai[] = nilaiRes.data || []
        const materiList: unknown[] = materiRes.data || []
        const sertifikatList: { status: string }[] = sertifikatRes.data || []
        const sppLog: LogSpp[] = sppRes.data || []
        const ppdb: StatusPpdb = ppdbRes.data

        const belum = tugasList.filter((t) => t.status_pengerjaan === "belum")
        const sudahDinilai = tugasList.filter((t) => t.status_pengerjaan === "dinilai").length

        const nilaiTerisi = nilaiList.map((n) => n.nilai).filter((n): n is number => n !== null)
        const rataRata = nilaiTerisi.length
          ? Math.round((nilaiTerisi.reduce((a, b) => a + b, 0) / nilaiTerisi.length) * 100) / 100
          : null

        const sertifikatAktif = sertifikatList.filter((s) => s.status === "aktif").length

        const tenggatList = belum
          .filter((t) => t.deadline && new Date(t.deadline).getTime() >= Date.now())
          .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        if (tenggatList.length > 0) {
          setTenggatTerdekat({ nama: tenggatList[0].judul, tenggat: tenggatList[0].deadline! })
        }

        setTugasBelum(belum.length)

        setCards([
          { label: "Tugas Belum Dikerjakan", value: String(belum.length), sub: `${sudahDinilai} sudah dinilai`, icon: FileText },
          {
            label: "Nilai Rata-rata",
            value: rataRata !== null ? String(rataRata) : "-",
            sub: `${nilaiList.length} penilaian`,
            icon: NotebookPen,
          },
          { label: "Materi Tersedia", value: String(materiList.length), icon: BookOpen },
          { label: "Sertifikat", value: String(sertifikatAktif), sub: `${sertifikatList.length} total`, icon: Award },
          {
            label: "Pembayaran SPP",
            value: String(sppLog.length),
            sub: sppLog.length > 0 ? `Terakhir: ${sppLog[0].keterangan}` : "Belum ada pembayaran",
            icon: CreditCard,
          },
          { label: "Status PPDB", value: ppdb?.siswa?.status?.toUpperCase() || "-", icon: GraduationCap },
        ])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat data dashboard.")
      }
    }

    muat()

    return () => {
      cancelled = true
    }
  }, [])

  const perluPerhatian = [
    tugasBelum > 0 && { href: "/siswa/tugas", label: `${tugasBelum} tugas belum dikerjakan` },
  ].filter((x): x is { href: string; label: string } => Boolean(x))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Siswa</h1>
        <p className="text-sm text-muted-foreground">Ringkasan tugas, nilai, absen, dan status Anda.</p>
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <card.icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tracking-tight truncate">{card.value}</p>
                  {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
                </CardContent>
              </Card>
            ))}

            <Card className="dashboard-card">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tenggat Terdekat</CardTitle>
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
            {perluPerhatian.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada yang perlu ditindaklanjuti saat ini.</p>
            ) : (
              perluPerhatian.map((item) => (
                <Link key={item.href + item.label} href={item.href}>
                  <Badge variant="secondary" className="cursor-pointer px-3 py-1.5 text-sm hover:bg-secondary/80">
                    {item.label}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-base font-bold">Menu Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MENU_SISWA.map((item) => (
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
