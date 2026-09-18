"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ClipboardCheck,
  GraduationCap,
  ListChecks,
  Loader2,
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
    gambar: string | null
  }
}

type Mengajar = {
  id_pengajaran: string
  tingkat: string
  nama_kelas: string
  id_user: string
  created_at: string
  mapel?: { nama_pelajaran: string }
  tahun_ajaran?: { nama: string }
  guru?: GuruInfo
}

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"

export default function KurikulumMengajarPage() {
  const [data, setData] = useState<Mengajar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filterGuru, setFilterGuru] = useState("all")
  const [filterTingkat, setFilterTingkat] = useState("all")

  useEffect(() => {
    let active = true

    apiFetch("/mengajar")
      .then((res) => {
        if (!active) return
        setData(res.data || [])
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : "Gagal memuat pembagian mengajar.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const guruOptions = useMemo(() => {
    const map = new Map<string, string>()
    data.forEach((m) => {
      const nama =
        m.guru?.DataUser?.nama_lengkap ||
        m.guru?.DataUser?.nama_singkat ||
        m.guru?.username ||
        "Guru"
      map.set(m.id_user, nama)
    })
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }))
  }, [data])

  const filteredData = useMemo(() => {
    return data.filter((m) => {
      if (filterGuru !== "all" && m.id_user !== filterGuru) return false
      if (filterTingkat !== "all" && m.tingkat !== filterTingkat) return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const guruNama = (
          m.guru?.DataUser?.nama_lengkap ||
          m.guru?.DataUser?.nama_singkat ||
          m.guru?.username ||
          ""
        ).toLowerCase()
        const mapelNama = (m.mapel?.nama_pelajaran || "").toLowerCase()
        const kelas = `${m.tingkat} ${m.nama_kelas}`.toLowerCase()

        if (!guruNama.includes(q) && !mapelNama.includes(q) && !kelas.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [data, filterGuru, filterTingkat, search])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-xs">
            Distribusi Mengajar
          </Badge>
          <span className="text-xs text-muted-foreground">Kurikulum</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Pembagian Mengajar Guru & Jadwal Kelas
        </h1>
        <p className="text-xs text-muted-foreground">
          Matriks alokasi seluruh pengajar, mata pelajaran, dan rombel kelas pada tahun ajaran aktif.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <Card className="border-border/60 bg-card/60 shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari guru, mapel, atau kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            <div>
              <select
                value={filterGuru}
                onChange={(e) => setFilterGuru(e.target.value)}
                className={selectClass}
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
              <select
                value={filterTingkat}
                onChange={(e) => setFilterTingkat(e.target.value)}
                className={selectClass}
              >
                <option value="all">Semua Tingkat</option>
                <option value="X">Kelas X</option>
                <option value="XI">Kelas XI</option>
                <option value="XII">Kelas XII</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Pembagian Mengajar */}
      <Card className="border-border/60 bg-card/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <School className="size-4 text-primary" />
              Daftar Alokasi Pengajaran
            </span>
            <Badge variant="outline" className="text-xs font-normal">
              {filteredData.length} Alokasi Terdaftar
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              <Loader2 className="size-6 animate-spin mx-auto text-primary" />
              <p className="mt-2">Memuat jadwal pengajaran...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              {search || filterGuru !== "all" || filterTingkat !== "all"
                ? "Tidak ada pengajaran yang cocok dengan kriteria filter."
                : "Belum ada pembagian mengajar yang terdaftar."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/40">
                    <th className="py-2.5 px-3 font-semibold text-center w-10">No</th>
                    <th className="py-2.5 px-3 font-semibold min-w-[200px]">Guru Pengajar</th>
                    <th className="py-2.5 px-3 font-semibold min-w-[180px]">Mata Pelajaran</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-28">Tingkat & Kelas</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-28">Tahun Ajaran</th>
                    <th className="py-2.5 px-3 font-semibold text-right min-w-[160px]">Aksi Monitoring</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredData.map((m, idx) => {
                    const guruNama =
                      m.guru?.DataUser?.nama_lengkap ||
                      m.guru?.DataUser?.nama_singkat ||
                      m.guru?.username ||
                      "Guru"

                    return (
                      <tr key={m.id_pengajaran} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          <div>{guruNama}</div>
                          <div className="text-[10px] text-muted-foreground">@{m.guru?.username}</div>
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          {m.mapel?.nama_pelajaran || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant="outline" className="text-[11px] font-semibold">
                            {m.tingkat} {m.nama_kelas}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground">
                          {m.tahun_ajaran?.nama || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2.5">
                              <Link href={`/kurikulum/nilai?id_pengajaran=${m.id_pengajaran}`}>
                                <ClipboardCheck className="mr-1 size-3 text-primary" />
                                Nilai
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2.5">
                              <Link href={`/kurikulum/absen?id_pengajaran=${m.id_pengajaran}`}>
                                <ListChecks className="mr-1 size-3 text-emerald-500" />
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
