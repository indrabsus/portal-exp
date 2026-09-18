"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ListChecks,
  Loader2,
  MessageSquare,
  School,
  Sparkles,
  Users,
} from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type GuruInfo = {
  id: string
  username: string
  DataUser?: {
    nama_lengkap: string | null
    nama_singkat: string | null
    gambar: string | null
  }
}

type MengajarItem = {
  id_pengajaran: string
  tingkat: string
  nama_kelas: string
  id_user: string
  created_at: string
  mapel?: { nama_pelajaran: string }
  tahun_ajaran?: { nama: string }
  guru?: GuruInfo
}

type AbsenRingkasan = {
  total_kelas: number
  sudah_absen_hari_ini: number
  belum_absen_hari_ini: number
}

export default function KurikulumDashboardPage() {
  const [mengajarList, setMengajarList] = useState<MengajarItem[]>([])
  const [absenRingkasan, setAbsenRingkasan] = useState<AbsenRingkasan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        setLoading(true)
        const [resMengajar, resAbsen] = await Promise.all([
          apiFetch("/mengajar"),
          apiFetch("/absen-kelas/ringkasan-hari-ini"),
        ])

        if (!isMounted) return

        setMengajarList(resMengajar.data || [])
        setAbsenRingkasan(resAbsen.data || null)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Gagal memuat dashboard kurikulum.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const uniqueGuruCount = new Set(mengajarList.map((m) => m.id_user)).size
  const uniqueMapelCount = new Set(mengajarList.map((m) => m.mapel?.nama_pelajaran).filter(Boolean)).size
  const uniqueKelasCount = new Set(mengajarList.map((m) => `${m.tingkat} ${m.nama_kelas}`)).size

  return (
    <div className="space-y-6">
      {/* Header Selamat Datang */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-sky-500/5 to-transparent p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                Bidang Kurikulum
              </Badge>
              <span className="text-xs text-muted-foreground">Portal Akademik</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Pusat Kendali & Pemantauan Kurikulum
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Pantau seluruh aktivitas rekapitulasi nilai tugas, ujian manual, dan kehadiran siswa
              yang diinput secara berkala oleh dewan guru.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
            <Button asChild size="sm" className="font-semibold shadow-sm">
              <Link href="/kurikulum/nilai">
                <ClipboardCheck className="mr-2 size-4" />
                Lihat Rekap Nilai
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/kurikulum/absen">
                <ListChecks className="mr-2 size-4" />
                Lihat Rekap Absensi
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Grid Statistik Utama */}
      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Memuat statistik kurikulum...</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Guru Pengajar
              </CardTitle>
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Users className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueGuruCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">Guru aktif terdaftar mengajar</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kelas & Rombel
              </CardTitle>
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <School className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueKelasCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">Rombongan belajar terdata</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mata Pelajaran
              </CardTitle>
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <GraduationCap className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueMapelCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">Mapel kurikulum berjalan</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Presensi Hari Ini
              </CardTitle>
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <CalendarCheck className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {absenRingkasan ? absenRingkasan.sudah_absen_hari_ini : 0}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  / {absenRingkasan ? absenRingkasan.total_kelas : 0} Sesi
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {absenRingkasan?.belum_absen_hari_ini
                  ? `${absenRingkasan.belum_absen_hari_ini} kelas belum presensi`
                  : "Presensi terisi"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Akses Cepat Menu Monitoring */}
      <div>
        <h2 className="text-base font-bold tracking-tight mb-3">Menu Pemantauan Utama</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/kurikulum/nilai"
            className="group block rounded-2xl border border-border/70 bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-card hover:shadow-md"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <ClipboardCheck className="size-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm">Rekap Nilai Siswa</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Lihat seluruh perolehan nilai tugas & ulangan manual yang diinput guru per kelas.
            </p>
          </Link>

          <Link
            href="/kurikulum/absen"
            className="group block rounded-2xl border border-border/70 bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-card hover:shadow-md"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <ListChecks className="size-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm">Rekap Absen Siswa</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Pantau tingkat kehadiran, izin, sakit, dan alpa siswa yang dicatat para pengajar.
            </p>
          </Link>

          <Link
            href="/kurikulum/mengajar"
            className="group block rounded-2xl border border-border/70 bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-card hover:shadow-md"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <School className="size-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm">Pembagian Mengajar</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Daftar alokasi mata pelajaran dan rombel kelas yang diampu oleh masing-masing guru.
            </p>
          </Link>

          <Link
            href="/kurikulum/chat"
            className="group block rounded-2xl border border-border/70 bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-card hover:shadow-md"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 transition-colors group-hover:bg-sky-600 group-hover:text-white">
              <MessageSquare className="size-5" />
            </div>
            <h3 className="mt-3 font-semibold text-sm">Chat Realtime</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Koordinasi langsung via obrolan instan dengan guru, kajur, staf, dan siswa.
            </p>
          </Link>
        </div>
      </div>

      {/* Tabel Distribusi Pengajaran Terkini */}
      <Card className="border-border/60 bg-card/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">Distribusi Pengajaran Terdaftar</CardTitle>
            <p className="text-xs text-muted-foreground">
              Daftar penugasan guru, mapel, dan kelas pada tahun ajaran aktif
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/kurikulum/mengajar">Semua Jadwal</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Memuat data...</div>
          ) : mengajarList.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Belum ada data pembagian mengajar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border/60 text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Guru Pengajar</th>
                    <th className="py-2.5 px-3 font-semibold">Mata Pelajaran</th>
                    <th className="py-2.5 px-3 font-semibold">Kelas</th>
                    <th className="py-2.5 px-3 font-semibold">Tahun Ajaran</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {mengajarList.slice(0, 8).map((m) => {
                    const namaGuru =
                      m.guru?.DataUser?.nama_lengkap ||
                      m.guru?.DataUser?.nama_singkat ||
                      m.guru?.username ||
                      "Guru"

                    return (
                      <tr key={m.id_pengajaran} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground">{namaGuru}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {m.mapel?.nama_pelajaran || "-"}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {m.tingkat} {m.nama_kelas}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {m.tahun_ajaran?.nama || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2">
                              <Link href={`/kurikulum/nilai?id_pengajaran=${m.id_pengajaran}`}>
                                Nilai
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2">
                              <Link href={`/kurikulum/absen?id_pengajaran=${m.id_pengajaran}`}>
                                Absen
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
