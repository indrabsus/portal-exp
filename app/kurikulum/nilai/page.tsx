"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Filter,
  GraduationCap,
  Loader2,
  Printer,
  School,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
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

type Kolom = { tipe: "tugas" | "manual"; id: string; label: string }
type SiswaRekap = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  nilai: Record<string, number | null>
  rata_rata: number | null
}

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"

export default function KurikulumRekapNilaiPage() {
  const searchParams = useSearchParams()
  const initialIdPengajaran = searchParams.get("id_pengajaran") || ""

  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [selectedPengajaranId, setSelectedPengajaranId] = useState(initialIdPengajaran)

  // Filter dropdowns
  const [filterGuru, setFilterGuru] = useState("all")
  const [filterTingkat, setFilterTingkat] = useState("all")
  const [filterCariSiswa, setFilterCariSiswa] = useState("")

  const [kolom, setKolom] = useState<Kolom[]>([])
  const [siswaList, setSiswaList] = useState<SiswaRekap[]>([])

  const [loadingMengajar, setLoadingMengajar] = useState(true)
  const [loadingRekap, setLoadingRekap] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Muat seluruh daftar penugasan mengajar
  useEffect(() => {
    let active = true

    apiFetch("/mengajar")
      .then((res) => {
        if (!active) return
        const list: Mengajar[] = res.data || []
        setMengajarList(list)

        // Jika belum ada pengajaran yang dipilih, pilih yang pertama atau dari URL
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

  // 2. Muat rekap nilai untuk pengajaran terpilih
  const muatRekap = useCallback(async (pengajaranId: string) => {
    if (!pengajaranId) return
    setLoadingRekap(true)
    setError(null)

    try {
      const res = await apiFetch(`/rekap-nilai?id_pengajaran=${pengajaranId}`)
      if (res.status === "success") {
        setKolom(res.data?.kolom || [])
        setSiswaList(res.data?.siswa || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat rekap nilai.")
      setKolom([])
      setSiswaList([])
    } finally {
      setLoadingRekap(false)
    }
  }, [])

  useEffect(() => {
    if (selectedPengajaranId) {
      muatRekap(selectedPengajaranId)
    }
  }, [selectedPengajaranId, muatRekap])

  // Daftar unik Guru dan Tingkat untuk filter
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

  // Filter siswa berdasarkan pencarian
  const displayedSiswa = useMemo(() => {
    if (!filterCariSiswa.trim()) return siswaList
    const q = filterCariSiswa.toLowerCase()
    return siswaList.filter(
      (s) =>
        s.nama_lengkap.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q))
    )
  }, [siswaList, filterCariSiswa])

  // Perhitungan statistik kelas
  const stats = useMemo(() => {
    const rataList = siswaList
      .map((s) => s.rata_rata)
      .filter((v): v is number => typeof v === "number" && !isNaN(v))

    if (rataList.length === 0) {
      return { rataKelas: 0, nilaiMax: 0, nilaiMin: 0, tuntasCount: 0, totalSiswa: siswaList.length }
    }

    const total = rataList.reduce((acc, curr) => acc + curr, 0)
    const rataKelas = Math.round((total / rataList.length) * 100) / 100
    const nilaiMax = Math.max(...rataList)
    const nilaiMin = Math.min(...rataList)
    const tuntasCount = rataList.filter((r) => r >= 75).length

    return {
      rataKelas,
      nilaiMax,
      nilaiMin,
      tuntasCount,
      totalSiswa: siswaList.length,
    }
  }, [siswaList])

  const namaGuruAktif =
    selectedPengajaran?.guru?.DataUser?.nama_lengkap ||
    selectedPengajaran?.guru?.DataUser?.nama_singkat ||
    selectedPengajaran?.guru?.username ||
    "-"

  return (
    <div className="space-y-5">
      {/* Header & Tombol Cetak */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              Monitoring Nilai
            </Badge>
            <span className="text-xs text-muted-foreground">Kurikulum</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Rekap Nilai Siswa per Kelas & Mapel
          </h1>
          <p className="text-xs text-muted-foreground">
            Pantau seluruh perolehan nilai tugas daring dan nilai ujian manual yang telah diinput dewan guru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            disabled={siswaList.length === 0}
            className="text-xs"
          >
            <Printer className="mr-1.5 size-3.5" />
            Cetak Laporan
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
            {/* Filter Guru */}
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

            {/* Filter Tingkat */}
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

            {/* Pilih Penugasan Mengajar */}
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

      {/* Rangkuman Detail Kelas Terpilih */}
      {selectedPengajaran && (
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="size-5" />
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
                  {selectedPengajaran.tahun_ajaran?.nama && (
                    <>
                      <span>•</span>
                      <span>TA {selectedPengajaran.tahun_ajaran.nama}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-xl border border-border/50 bg-background/60 p-2">
                <p className="text-[10px] text-muted-foreground">Siswa</p>
                <p className="text-sm font-bold mt-0.5">{stats.totalSiswa}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-2">
                <p className="text-[10px] text-muted-foreground">Rata-rata</p>
                <p className="text-sm font-bold text-primary mt-0.5">{stats.rataKelas || "-"}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-2">
                <p className="text-[10px] text-muted-foreground">Tertinggi</p>
                <p className="text-sm font-bold text-emerald-500 mt-0.5">{stats.nilaiMax || "-"}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-2">
                <p className="text-[10px] text-muted-foreground">Tuntas (≥75)</p>
                <p className="text-sm font-bold text-sky-400 mt-0.5">
                  {stats.totalSiswa > 0
                    ? `${Math.round((stats.tuntasCount / stats.totalSiswa) * 100)}%`
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabel Rekapitulasi Nilai */}
      <Card className="border-border/60 bg-card/60 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              Tabel Rekap Nilai Siswa
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {kolom.length} Komponen Penilaian terdaftar (Tugas daring & Nilai manual)
            </p>
          </div>

          <div className="w-full sm:w-64 print:hidden">
            <Input
              type="text"
              placeholder="Cari nama atau NISN siswa..."
              value={filterCariSiswa}
              onChange={(e) => setFilterCariSiswa(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingRekap ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              <Loader2 className="size-6 animate-spin mx-auto text-primary" />
              <p className="mt-2">Mengambil seluruh nilai siswa dari sistem...</p>
            </div>
          ) : !selectedPengajaranId ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              Pilih kelas dan mata pelajaran pada filter di atas untuk melihat nilai.
            </div>
          ) : displayedSiswa.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              {filterCariSiswa
                ? "Tidak ada siswa yang cocok dengan pencarian."
                : "Belum ada data siswa di kelas ini."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/40">
                    <th className="py-2.5 px-3 font-semibold text-center w-10">No</th>
                    <th className="py-2.5 px-3 font-semibold min-w-[180px]">Nama Lengkap</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-24">NISN</th>
                    {kolom.map((k) => (
                      <th
                        key={k.id}
                        className="py-2.5 px-3 font-semibold text-center min-w-[100px]"
                      >
                        <div className="truncate max-w-[120px] mx-auto" title={k.label}>
                          {k.label}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 uppercase mt-0.5 font-normal ${
                            k.tipe === "tugas"
                              ? "border-blue-500/40 text-blue-400 bg-blue-500/10"
                              : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                          }`}
                        >
                          {k.tipe}
                        </Badge>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 font-bold text-center bg-primary/5 text-primary min-w-[80px]">
                      Rata-rata
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-center min-w-[90px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {displayedSiswa.map((siswa, idx) => {
                    const rata = siswa.rata_rata
                    const isTuntas = typeof rata === "number" && rata >= 75

                    return (
                      <tr key={siswa.id_siswa} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {siswa.nama_lengkap}
                        </td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                          {siswa.nisn || "-"}
                        </td>
                        {kolom.map((k) => {
                          const val = siswa.nilai[k.id]
                          return (
                            <td
                              key={k.id}
                              className="py-2.5 px-3 text-center font-mono font-medium"
                            >
                              {val !== null && val !== undefined ? (
                                <span
                                  className={
                                    val < 75 ? "text-rose-400 font-semibold" : "text-foreground"
                                  }
                                >
                                  {val}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="py-2.5 px-3 text-center font-mono font-bold bg-primary/5">
                          {rata !== null ? (
                            <span
                              className={
                                rata < 75 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"
                              }
                            >
                              {rata}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {rata !== null ? (
                            isTuntas ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                                Tuntas
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 text-[10px]">
                                Remedial
                              </Badge>
                            )
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Belum ada</span>
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
    </div>
  )
}
