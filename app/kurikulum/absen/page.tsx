"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  History,
  ListChecks,
  Loader2,
  Printer,
  School,
  Search,
  Users,
} from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type GuruInfo = {
  id: string
  username: string
  DataUser?: {
    nama_lengkap: string | null
    nama_singkat: string | null
  }
}

type Mengajar = {
  id_pengajaran: string
  tingkat: string
  nama_kelas: string
  id_user: string
  mapel?: { nama_pelajaran: string }
  tahun_ajaran?: { nama: string }
  guru?: GuruInfo
}

type RekapSiswaRow = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  total_sesi: number
  hadir: number
  sakit: number
  izin: number
  alpa: number
}

type SesiRiwayat = {
  id_absen_kelas: string
  tanggal: string
  jumlah_siswa: number
  rekap: {
    hadir: number
    sakit: number
    izin: number
    alpa: number
  }
}

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"

export default function KurikulumRekapAbsenPage() {
  const searchParams = useSearchParams()
  const initialIdPengajaran = searchParams.get("id_pengajaran") || ""

  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [selectedPengajaranId, setSelectedPengajaranId] = useState(initialIdPengajaran)

  // Filters
  const [filterGuru, setFilterGuru] = useState("all")
  const [filterTingkat, setFilterTingkat] = useState("all")
  const [searchSiswa, setSearchSiswa] = useState("")
  const [activeTab, setActiveTab] = useState<"rekap" | "riwayat">("rekap")

  const [rekapSiswa, setRekapSiswa] = useState<RekapSiswaRow[]>([])
  const [totalSesi, setTotalSesi] = useState(0)
  const [riwayatSesi, setRiwayatSesi] = useState<SesiRiwayat[]>([])

  const [loadingMengajar, setLoadingMengajar] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Muat penugasan mengajar
  useEffect(() => {
    let active = true

    apiFetch("/mengajar")
      .then((res) => {
        if (!active) return
        const list: Mengajar[] = res.data || []
        setMengajarList(list)

        if (list.length > 0) {
          if (initialIdPengajaran && list.some((m) => m.id_pengajaran === initialIdPengajaran)) {
            setSelectedPengajaranId(initialIdPengajaran)
          } else {
            setSelectedPengajaranId(list[0].id_pengajaran)
          }
        }
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : "Gagal memuat pembagian mengajar.")
      })
      .finally(() => {
        if (active) setLoadingMengajar(false)
      })

    return () => {
      active = false
    }
  }, [initialIdPengajaran])

  // 2. Muat data absensi (rekap + riwayat sesi)
  const muatDataAbsen = useCallback(async (pengajaranId: string) => {
    if (!pengajaranId) return
    setLoadingData(true)
    setError(null)

    try {
      const [rekapRes, riwayatRes] = await Promise.all([
        apiFetch(`/absen-kelas/rekap?id_pengajaran=${pengajaranId}`),
        apiFetch(`/absen-kelas/riwayat?id_pengajaran=${pengajaranId}`),
      ])

      if (rekapRes.status === "success") {
        setRekapSiswa(rekapRes.data || [])
        setTotalSesi(rekapRes.total_sesi || 0)
      }

      if (riwayatRes.status === "success") {
        setRiwayatSesi(riwayatRes.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data presensi.")
      setRekapSiswa([])
      setRiwayatSesi([])
      setTotalSesi(0)
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (selectedPengajaranId) {
      muatDataAbsen(selectedPengajaranId)
    }
  }, [selectedPengajaranId, muatDataAbsen])

  // Opsi Guru & Filter Mengajar
  const guruOptions = useMemo(() => {
    const map = new Map<string, string>()
    mengajarList.forEach((m) => {
      const nama =
        m.guru?.DataUser?.nama_lengkap ||
        m.guru?.DataUser?.nama_singkat ||
        m.guru?.username ||
        "Guru"
      map.set(m.id_user, nama)
    })
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }))
  }, [mengajarList])

  const filteredMengajarList = useMemo(() => {
    return mengajarList.filter((m) => {
      if (filterGuru !== "all" && m.id_user !== filterGuru) return false
      if (filterTingkat !== "all" && m.tingkat !== filterTingkat) return false
      return true
    })
  }, [mengajarList, filterGuru, filterTingkat])

  const selectedPengajaran = useMemo(() => {
    return mengajarList.find((m) => m.id_pengajaran === selectedPengajaranId)
  }, [mengajarList, selectedPengajaranId])

  // Filter siswa
  const displayedRekap = useMemo(() => {
    if (!searchSiswa.trim()) return rekapSiswa
    const q = searchSiswa.toLowerCase()
    return rekapSiswa.filter(
      (s) =>
        s.nama_lengkap.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q))
    )
  }, [rekapSiswa, searchSiswa])

  // Statistik Presensi
  const stats = useMemo(() => {
    if (rekapSiswa.length === 0 || totalSesi === 0) {
      return { totalSiswa: rekapSiswa.length, rataPersentase: 0, totalAlpa: 0, perluPerhatian: 0 }
    }

    let totalPersen = 0
    let totalAlpa = 0
    let perluPerhatian = 0

    rekapSiswa.forEach((s) => {
      const persen = Math.round((s.hadir / totalSesi) * 100)
      totalPersen += persen
      totalAlpa += s.alpa
      if (persen < 75 || s.alpa >= 3) {
        perluPerhatian += 1
      }
    })

    return {
      totalSiswa: rekapSiswa.length,
      rataPersentase: Math.round(totalPersen / rekapSiswa.length),
      totalAlpa,
      perluPerhatian,
    }
  }, [rekapSiswa, totalSesi])

  const namaGuruAktif =
    selectedPengajaran?.guru?.DataUser?.nama_lengkap ||
    selectedPengajaran?.guru?.DataUser?.nama_singkat ||
    selectedPengajaran?.guru?.username ||
    "-"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              Monitoring Presensi
            </Badge>
            <span className="text-xs text-muted-foreground">Kurikulum</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Rekap Absensi Siswa per Guru & Kelas
          </h1>
          <p className="text-xs text-muted-foreground">
            Pantau kehadiran harian, ketidakhadiran (sakit, izin, alpa), serta riwayat pengisian presensi oleh guru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            disabled={rekapSiswa.length === 0}
            className="text-xs"
          >
            <Printer className="mr-1.5 size-3.5" />
            Cetak Rekap
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Filter Panel */}
      <Card className="border-border/60 bg-card/60 shadow-sm print:hidden">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">
                Filter Guru Pengajar
              </label>
              <select
                value={filterGuru}
                onChange={(e) => setFilterGuru(e.target.value)}
                className={selectClass}
                disabled={loadingMengajar}
              >
                <option value="all">Semua Guru ({guruOptions.length})</option>
                {guruOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">
                Tingkat Kelas
              </label>
              <select
                value={filterTingkat}
                onChange={(e) => setFilterTingkat(e.target.value)}
                className={selectClass}
                disabled={loadingMengajar}
              >
                <option value="all">Semua Tingkat</option>
                <option value="X">Kelas X</option>
                <option value="XI">Kelas XI</option>
                <option value="XII">Kelas XII</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">
                Pilih Kelas & Mata Pelajaran
              </label>
              <select
                value={selectedPengajaranId}
                onChange={(e) => setSelectedPengajaranId(e.target.value)}
                className={selectClass}
                disabled={loadingMengajar || filteredMengajarList.length === 0}
              >
                {filteredMengajarList.length === 0 ? (
                  <option value="">Tidak ada pengajaran yang cocok</option>
                ) : (
                  filteredMengajarList.map((m) => {
                    const guru =
                      m.guru?.DataUser?.nama_lengkap ||
                      m.guru?.DataUser?.nama_singkat ||
                      m.guru?.username ||
                      "Guru"
                    return (
                      <option key={m.id_pengajaran} value={m.id_pengajaran}>
                        {m.mapel?.nama_pelajaran} — {m.tingkat} {m.nama_kelas} (Guru: {guru})
                      </option>
                    )
                  })
                )}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rangkuman Kelas & Statistik Kehadiran */}
      {selectedPengajaran && (
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <ListChecks className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">
                  {selectedPengajaran.mapel?.nama_pelajaran}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Kelas {selectedPengajaran.tingkat} {selectedPengajaran.nama_kelas}
                  </span>
                  <span>•</span>
                  <span>Guru: <strong className="text-foreground">{namaGuruAktif}</strong></span>
                  <span>•</span>
                  <span>Total {totalSesi} Sesi Pertemuan</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-xl border border-border/50 bg-background/60 p-2">
                <p className="text-[10px] text-muted-foreground">Siswa</p>
                <p className="text-sm font-bold mt-0.5">{stats.totalSiswa}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-2">
                <p className="text-[10px] text-muted-foreground">Rata Hadir</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {stats.rataPersentase}%
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-2">
                <p className="text-[10px] text-muted-foreground">Total Alpa</p>
                <p className="text-sm font-bold text-rose-400 mt-0.5">{stats.totalAlpa}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-2">
                <p className="text-[10px] text-muted-foreground">Atensi (Alpa ≥3)</p>
                <p className="text-sm font-bold text-amber-400 mt-0.5">{stats.perluPerhatian}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Pilihan: Rekap Akumulasi vs Riwayat Sesi Harian */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab("rekap")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "rekap"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Rekapitulasi Kehadiran Siswa
        </button>
        <button
          onClick={() => setActiveTab("riwayat")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "riwayat"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Riwayat Log Sesi Guru ({riwayatSesi.length})
        </button>
      </div>

      {/* Konten Tab */}
      {activeTab === "rekap" ? (
        /* TAB 1: REKAPITULASI SISWA */
        <Card className="border-border/60 bg-card/60 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-sm font-bold">Tabel Akumulasi Kehadiran</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Akumulasi Hadir, Sakit, Izin, dan Alpa dari total {totalSesi} pertemuan yang telah tercatat.
              </p>
            </div>

            <div className="w-full sm:w-64 print:hidden">
              <Input
                type="text"
                placeholder="Cari siswa atau NISN..."
                value={searchSiswa}
                onChange={(e) => setSearchSiswa(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                <p className="mt-2">Memuat rekapitulasi absensi siswa...</p>
              </div>
            ) : !selectedPengajaranId ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                Pilih kelas dan mata pelajaran pada filter di atas.
              </div>
            ) : displayedRekap.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                {searchSiswa
                  ? "Tidak ada siswa yang cocok dengan pencarian."
                  : "Belum ada catatan presensi untuk kelas ini."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/40">
                      <th className="py-2.5 px-3 font-semibold text-center w-10">No</th>
                      <th className="py-2.5 px-3 font-semibold min-w-[200px]">Nama Lengkap</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-24">NISN</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-16 text-emerald-500">Hadir</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-16 text-blue-400">Sakit</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-16 text-amber-400">Izin</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-16 text-rose-400">Alpa</th>
                      <th className="py-2.5 px-3 font-bold text-center w-24 bg-primary/5 text-primary">
                        % Hadir
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-center w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {displayedRekap.map((s, idx) => {
                      const persen = totalSesi > 0 ? Math.round((s.hadir / totalSesi) * 100) : 0
                      const isGood = persen >= 85
                      const isWarning = persen >= 70 && persen < 85

                      return (
                        <tr key={s.id_siswa} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            {s.nama_lengkap}
                          </td>
                          <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                            {s.nisn || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-500">
                            {s.hadir}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium text-blue-400">
                            {s.sakit}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium text-amber-400">
                            {s.izin}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-400">
                            {s.alpa}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold bg-primary/5">
                            {totalSesi > 0 ? `${persen}%` : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {totalSesi === 0 ? (
                              <span className="text-[11px] text-muted-foreground">-</span>
                            ) : isGood ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                                Sangat Baik
                              </Badge>
                            ) : isWarning ? (
                              <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]">
                                Cukup
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 text-[10px]">
                                Kurang / Atensi
                              </Badge>
                            )}
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
      ) : (
        /* TAB 2: RIWAYAT LOG SESI GURU */
        <Card className="border-border/60 bg-card/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="size-4 text-primary" />
              Daftar Log Sesi Pertemuan
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Riwayat setiap sesi presensi yang telah diisi dan disimpan oleh guru pengajar
            </p>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                <p className="mt-2">Memuat riwayat sesi...</p>
              </div>
            ) : riwayatSesi.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                Belum ada sesi presensi yang tercatat untuk kelas ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/40">
                      <th className="py-2.5 px-3 font-semibold text-center w-10">No</th>
                      <th className="py-2.5 px-3 font-semibold min-w-[130px]">Tanggal Sesi</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-28">Total Siswa</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-20 text-emerald-500">Hadir</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-20 text-blue-400">Sakit</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-20 text-amber-400">Izin</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-20 text-rose-400">Alpa</th>
                      <th className="py-2.5 px-3 font-bold text-center w-28 bg-primary/5 text-primary">
                        % Kehadiran
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {riwayatSesi.map((sesi, idx) => {
                      const hadir = sesi.rekap?.hadir || 0
                      const total = sesi.jumlah_siswa || 1
                      const persen = Math.round((hadir / total) * 100)

                      return (
                        <tr key={sesi.id_absen_kelas} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            {new Date(sesi.tanggal).toLocaleDateString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                            {sesi.jumlah_siswa} Siswa
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-500">
                            {sesi.rekap?.hadir || 0}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-blue-400">
                            {sesi.rekap?.sakit || 0}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-amber-400">
                            {sesi.rekap?.izin || 0}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-400">
                            {sesi.rekap?.alpa || 0}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold bg-primary/5">
                            {persen}%
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
      )}
    </div>
  )
}
