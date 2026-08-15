"use client"

import { useEffect, useState } from "react"
import { ListChecks, Loader2, Search } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { useTableControls } from "@/lib/use-table-controls"
import { SortableTh } from "@/components/sortable-th"
import { TablePagination } from "@/components/table-pagination"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Mengajar = {
  id_pengajaran: string
  tingkat: string
  nama_kelas: string
  mapel?: { nama_pelajaran: string }
}

type RekapRow = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  total_sesi: number
  hadir: number
  sakit: number
  izin: number
  alpa: number
}

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

function labelMengajar(m: Mengajar | undefined) {
  if (!m) return "-"
  return `${m.mapel?.nama_pelajaran || "-"} - ${m.tingkat} ${m.nama_kelas}`
}

export default function RekapAbsenSiswaPage() {
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [idPengajaran, setIdPengajaran] = useState("")
  const [rekap, setRekap] = useState<RekapRow[]>([])
  const [totalSesi, setTotalSesi] = useState(0)
  const [loadingMengajar, setLoadingMengajar] = useState(true)
  const [loadingRekap, setLoadingRekap] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch("/mengajar")
      .then((res) => {
        if (cancelled) return
        const list: Mengajar[] = res.data || []
        setMengajarList(list)
        setIdPengajaran((prev) => prev || list[0]?.id_pengajaran || "")
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat data.")
      })
      .finally(() => {
        if (!cancelled) setLoadingMengajar(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!idPengajaran) return

    let cancelled = false

    apiFetch(`/absen-kelas/rekap?id_pengajaran=${idPengajaran}`)
      .then((res) => {
        if (cancelled) return
        setRekap(res.data || [])
        setTotalSesi(res.total_sesi || 0)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat rekap absen.")
      })
      .finally(() => {
        if (!cancelled) setLoadingRekap(false)
      })

    return () => {
      cancelled = true
    }
  }, [idPengajaran])

  const {
    rows,
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalRows,
  } = useTableControls(rekap, {
    searchFields: (row) => [row.nama_lengkap, row.nisn],
    getSortValue: (row, key) => {
      if (key === "nama") return row.nama_lengkap
      if (key === "hadir") return row.hadir
      if (key === "sakit") return row.sakit
      if (key === "izin") return row.izin
      if (key === "alpa") return row.alpa
      return null
    },
    initialSortKey: "nama",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekap Absen Siswa</h1>
        <p className="text-sm text-muted-foreground">Rekap kehadiran siswa per kelas yang Anda ajar.</p>
      </div>

      {loadingMengajar ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : mengajarList.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Anda belum punya pembagian mengajar. Tambahkan dulu di menu Pembagian Mengajar.
        </p>
      ) : (
        <>
          <Card className="dashboard-card">
            <CardContent className="pt-4">
              <div className="max-w-sm space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Kelas / Mapel</label>
                <select
                  className={selectClass}
                  value={idPengajaran}
                  onChange={(e) => {
                    setLoadingRekap(true)
                    setIdPengajaran(e.target.value)
                  }}
                >
                  {mengajarList.map((m) => (
                    <option key={m.id_pengajaran} value={m.id_pengajaran}>
                      {labelMengajar(m)}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Card className="dashboard-card overflow-hidden py-0">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-4">
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-muted-foreground" />
                Rekap ({totalSesi} sesi tercatat)
              </CardTitle>
              <div className="relative w-full max-w-56">
                <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau NISN..." className="pl-8" />
              </div>
            </CardHeader>

            {loadingRekap ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat rekap...
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <SortableTh label="Nama Siswa" sortKey="nama" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <SortableTh label="Hadir" sortKey="hadir" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <SortableTh label="Sakit" sortKey="sakit" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <SortableTh label="Izin" sortKey="izin" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                        <SortableTh label="Alpa" sortKey="alpa" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                            {totalSesi === 0 ? "Belum ada sesi absen tercatat untuk kelas ini." : "Tidak ada siswa yang cocok."}
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr key={row.id_siswa} className="hover:bg-muted/40">
                            <td className="px-4 py-2.5 font-medium">{row.nama_lengkap}</td>
                            <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400">{row.hadir}</td>
                            <td className="px-4 py-2.5 text-amber-600 dark:text-amber-400">{row.sakit}</td>
                            <td className="px-4 py-2.5 text-blue-600 dark:text-blue-400">{row.izin}</td>
                            <td className="px-4 py-2.5 text-destructive">{row.alpa}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
              </>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
