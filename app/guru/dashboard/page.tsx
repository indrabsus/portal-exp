"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookMarked,
  BookOpen,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  FileText,
  ListChecks,
  Loader2,
  NotebookPen,
  School,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatCard = {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
}

const MENU_GURU = [
  { href: "/guru/absen", label: "Absen", desc: "Catat kehadiran Anda sendiri sebagai staf pengajar.", icon: CalendarRange },
  { href: "/guru/mengajar", label: "Pembagian Mengajar", desc: "Mata pelajaran dan kelas yang Anda ampu.", icon: School },
  { href: "/guru/absen-siswa", label: "Absen Siswa", desc: "Catat kehadiran siswa di kelas yang Anda ajar.", icon: ClipboardList },
  { href: "/guru/rekap-absen-siswa", label: "Rekap Absen Siswa", desc: "Lihat rekap kehadiran siswa per kelas.", icon: ListChecks },
  { href: "/guru/nilai-manual", label: "Nilai Manual", desc: "Input nilai di luar portal (ulangan tulis, praktik, dll).", icon: NotebookPen },
  { href: "/guru/materi", label: "Materi", desc: "Unggah materi ajar untuk kelas Anda.", icon: BookOpen },
  { href: "/guru/bank-soal", label: "Bank Soal", desc: "Kelola bank soal untuk mata pelajaran Anda.", icon: BookMarked },
  { href: "/guru/tugas", label: "Tugas", desc: "Buat dan kelola tugas untuk kelas Anda.", icon: FileText },
]

type Mengajar = { id_pengajaran: string; mapel?: { nama_pelajaran: string } }
type TugasRow = { status: "draft" | "terbit"; deadline: string | null; jumlah_soal: number; judul: string }
type NilaiManualRow = { judul: string; jumlah_dinilai: number; total_siswa: number; rata_rata: number | null }
type AbsenRingkasan = { total_kelas: number; sudah_absen_hari_ini: number; belum_absen_hari_ini: number }

export default function GuruDashboardPage() {
  const [cards, setCards] = useState<StatCard[] | null>(null)
  const [tenggatTerdekat, setTenggatTerdekat] = useState<{ nama: string; tenggat: string } | null>(null)
  const [tugasTanpaSoal, setTugasTanpaSoal] = useState(0)
  const [nilaiBelumLengkap, setNilaiBelumLengkap] = useState(0)
  const [belumAbsenHariIni, setBelumAbsenHariIni] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const muat = async () => {
      try {
        const [mengajarRes, tugasRes, materiRes, bankSoalRes, nilaiManualRes, absenRes] = await Promise.all([
          apiFetch("/mengajar"),
          apiFetch("/tugas"),
          apiFetch("/materi-ajar"),
          apiFetch("/bank-soal"),
          apiFetch("/nilai-manual"),
          apiFetch("/absen-kelas/ringkasan-hari-ini"),
        ])

        if (cancelled) return

        const mengajarList: Mengajar[] = mengajarRes.data || []
        const tugasList: TugasRow[] = tugasRes.data || []
        const materiList: unknown[] = materiRes.data || []
        const bankSoalList: unknown[] = bankSoalRes.data || []
        const nilaiManualList: NilaiManualRow[] = nilaiManualRes.data || []
        const absenRingkasan: AbsenRingkasan = absenRes.data || { total_kelas: 0, sudah_absen_hari_ini: 0, belum_absen_hari_ini: 0 }

        const jumlahMapel = new Set(mengajarList.map((m) => m.mapel?.nama_pelajaran).filter(Boolean)).size

        const tugasTerbit = tugasList.filter((t) => t.status === "terbit")
        const tugasDraft = tugasList.length - tugasTerbit.length
        const tanpaSoal = tugasList.filter((t) => t.jumlah_soal === 0).length

        const rataRataList = nilaiManualList.map((n) => n.rata_rata).filter((n): n is number => n !== null)
        const rataRataKeseluruhan = rataRataList.length
          ? Math.round((rataRataList.reduce((a, b) => a + b, 0) / rataRataList.length) * 100) / 100
          : null
        const belumLengkap = nilaiManualList.filter((n) => n.jumlah_dinilai < n.total_siswa).length

        const tenggatList = tugasTerbit
          .filter((t) => t.deadline && new Date(t.deadline).getTime() >= Date.now())
          .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        if (tenggatList.length > 0) {
          setTenggatTerdekat({ nama: tenggatList[0].judul, tenggat: tenggatList[0].deadline! })
        }

        setTugasTanpaSoal(tanpaSoal)
        setNilaiBelumLengkap(belumLengkap)
        setBelumAbsenHariIni(absenRingkasan.belum_absen_hari_ini)

        setCards([
          {
            label: "Kelas Diajar",
            value: String(mengajarList.length),
            sub: `${jumlahMapel} mata pelajaran`,
            icon: School,
          },
          {
            label: "Absen Hari Ini",
            value: `${absenRingkasan.sudah_absen_hari_ini}/${absenRingkasan.total_kelas}`,
            sub: "kelas sudah diambil kehadirannya",
            icon: CalendarRange,
          },
          {
            label: "Tugas Aktif",
            value: String(tugasTerbit.length),
            sub: `${tugasDraft} draft`,
            icon: FileText,
          },
          {
            label: "Materi Diunggah",
            value: String(materiList.length),
            icon: BookOpen,
          },
          {
            label: "Bank Soal",
            value: String(bankSoalList.length),
            icon: BookMarked,
          },
          {
            label: "Nilai Manual",
            value: String(nilaiManualList.length),
            sub: rataRataKeseluruhan !== null ? `Rata-rata keseluruhan: ${rataRataKeseluruhan}` : "Belum ada nilai",
            icon: NotebookPen,
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

  const perluPerhatian = [
    belumAbsenHariIni > 0 && { href: "/guru/absen-siswa", label: `${belumAbsenHariIni} kelas belum diabsen hari ini` },
    tugasTanpaSoal > 0 && { href: "/guru/tugas", label: `${tugasTanpaSoal} tugas belum ada soal` },
    nilaiBelumLengkap > 0 && { href: "/guru/nilai-manual", label: `${nilaiBelumLengkap} nilai manual belum lengkap` },
  ].filter((x): x is { href: string; label: string } => Boolean(x))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Guru</h1>
        <p className="text-sm text-muted-foreground">Ringkasan kelas, tugas, materi, dan nilai yang Anda kelola.</p>
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
          <CardTitle className="text-base font-bold">Menu Guru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MENU_GURU.map((item) => (
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
