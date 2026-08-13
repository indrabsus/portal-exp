"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Search, Trash2, Users } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { useTableControls } from "@/lib/use-table-controls"
import { Modal } from "@/components/modal"
import { SortableTh } from "@/components/sortable-th"
import { TablePagination } from "@/components/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type RiwayatKelas = {
  id_riwayat: string
  id_siswa: string
  tahun_ajaran: string
  tingkat: string
  nama_kelas: string
  siswa_ppdb?: {
    nama_lengkap: string
    nisn: string
    status: string
    jenkel: "l" | "p"
  }
}

type KelasGroup = {
  tingkat: string
  nama_kelas: string
  siswa: RiwayatKelas[]
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

export default function KelasPage() {
  const [tahunAjaran, setTahunAjaran] = useState("")
  const [daftarTahunAjaran, setDaftarTahunAjaran] = useState<string[]>([])

  const [riwayat, setRiwayat] = useState<RiwayatKelas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState("")

  useEffect(() => {
    let cancelled = false

    apiFetch("/riwayat-kelas/tahun-list")
      .then((res) => {
        if (cancelled) return
        const list: string[] = res.data || []
        setDaftarTahunAjaran(list)
        setTahunAjaran((prev) => prev || list[0] || "")
      })
      .catch(() => {
        if (!cancelled) setDaftarTahunAjaran([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!tahunAjaran) return

    let cancelled = false

    apiFetch(`/riwayat-kelas/tahun?tahun_ajaran=${encodeURIComponent(tahunAjaran)}`)
      .then((res) => {
        if (!cancelled) setRiwayat(res.data || [])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal mengambil data kelas.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tahunAjaran])

  const kelasGroups = useMemo(() => {
    const map = new Map<string, KelasGroup>()

    riwayat.forEach((item) => {
      const key = `${item.tingkat}-${item.nama_kelas}`
      const existing = map.get(key)

      if (existing) {
        existing.siswa.push(item)
      } else {
        map.set(key, {
          tingkat: item.tingkat,
          nama_kelas: item.nama_kelas,
          siswa: [item],
        })
      }
    })

    return Array.from(map.values())
  }, [riwayat])

  const {
    rows: kelasRows,
    search: kelasSearch,
    setSearch: setKelasSearch,
    sortKey: kelasSortKey,
    sortDir: kelasSortDir,
    toggleSort: toggleKelasSort,
    page: kelasPage,
    setPage: setKelasPage,
    pageSize: kelasPageSize,
    setPageSize: setKelasPageSize,
    totalPages: kelasTotalPages,
    totalRows: kelasTotalRows,
  } = useTableControls(kelasGroups, {
    searchFields: (row) => [row.nama_kelas, row.tingkat],
    getSortValue: (row, key) => {
      if (key === "nama_kelas") return row.nama_kelas
      if (key === "tingkat") return row.tingkat
      if (key === "jumlah") return row.siswa.length
      return null
    },
    initialSortKey: "tingkat",
  })

  const selectedGroup = useMemo(
    () => kelasGroups.find((g) => `${g.tingkat}-${g.nama_kelas}` === selectedKey) || null,
    [kelasGroups, selectedKey]
  )

  const {
    rows: siswaRows,
    search: siswaSearch,
    setSearch: setSiswaSearch,
    sortKey: siswaSortKey,
    sortDir: siswaSortDir,
    toggleSort: toggleSiswaSort,
    page: siswaPage,
    setPage: setSiswaPage,
    pageSize: siswaPageSize,
    setPageSize: setSiswaPageSize,
    totalPages: siswaTotalPages,
    totalRows: siswaTotalRows,
  } = useTableControls(selectedGroup?.siswa || [], {
    searchFields: (row) => [row.siswa_ppdb?.nama_lengkap, row.siswa_ppdb?.nisn],
    getSortValue: (row, key) => {
      if (key === "nama") return row.siswa_ppdb?.nama_lengkap
      if (key === "nisn") return row.siswa_ppdb?.nisn
      if (key === "jenkel") return row.siswa_ppdb?.jenkel
      return null
    },
    initialSortKey: "nama",
  })

  const keluarkanSiswa = async (item: RiwayatKelas) => {
    const nama = item.siswa_ppdb?.nama_lengkap || "siswa ini"

    if (
      !window.confirm(
        `Keluarkan ${nama} dari kelas "${item.nama_kelas}" tahun ajaran ${item.tahun_ajaran}? Aksi ini tidak bisa dibatalkan.`
      )
    ) {
      return
    }

    setRemovingId(item.id_riwayat)

    try {
      await apiFetch(`/riwayat-kelas/${item.id_riwayat}`, { method: "DELETE" })
      setRiwayat((prev) => prev.filter((r) => r.id_riwayat !== item.id_riwayat))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal mengeluarkan siswa dari kelas.")
    } finally {
      setRemovingId("")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelas</h1>
        <p className="text-sm text-muted-foreground">
          Daftar kelas berdasarkan riwayat_kelas per tahun ajaran.
        </p>
      </div>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Daftar Kelas
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={selectClass + " w-auto"}
              value={tahunAjaran}
              onChange={(e) => {
                setLoading(true)
                setTahunAjaran(e.target.value)
              }}
            >
              {daftarTahunAjaran.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <div className="relative w-full max-w-56">
              <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={kelasSearch}
                onChange={(e) => setKelasSearch(e.target.value)}
                placeholder="Cari nama kelas..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>

        {error && (
          <p className="px-4 pt-3 text-sm text-destructive">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat data...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <SortableTh
                      label="Tingkat"
                      sortKey="tingkat"
                      activeKey={kelasSortKey}
                      sortDir={kelasSortDir}
                      onSort={toggleKelasSort}
                    />
                    <SortableTh
                      label="Nama Kelas"
                      sortKey="nama_kelas"
                      activeKey={kelasSortKey}
                      sortDir={kelasSortDir}
                      onSort={toggleKelasSort}
                    />
                    <SortableTh
                      label="Jumlah Siswa"
                      sortKey="jumlah"
                      activeKey={kelasSortKey}
                      sortDir={kelasSortDir}
                      onSort={toggleKelasSort}
                    />
                    <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kelasRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        Belum ada data kelas untuk tahun ajaran ini.
                      </td>
                    </tr>
                  ) : (
                    kelasRows.map((group) => {
                      const key = `${group.tingkat}-${group.nama_kelas}`
                      return (
                        <tr key={key} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5">
                            <Badge variant="outline">{group.tingkat}</Badge>
                          </td>
                          <td className="px-4 py-2.5 font-medium">
                            {group.nama_kelas}
                          </td>
                          <td className="px-4 py-2.5">{group.siswa.length} siswa</td>
                          <td className="px-4 py-2.5">
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedKey(key)}
                              >
                                Lihat Siswa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={kelasPage}
              totalPages={kelasTotalPages}
              totalRows={kelasTotalRows}
              pageSize={kelasPageSize}
              onPageChange={setKelasPage}
              onPageSizeChange={setKelasPageSize}
            />
          </>
        )}
      </Card>

      {selectedGroup && (
        <Modal
          title={`${selectedGroup.tingkat} ${selectedGroup.nama_kelas} - Tahun Ajaran ${tahunAjaran}`}
          onClose={() => setSelectedKey(null)}
          maxWidthClassName="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="relative max-w-64">
              <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={siswaSearch}
                onChange={(e) => setSiswaSearch(e.target.value)}
                placeholder="Cari nama atau NISN..."
                className="pl-8"
              />
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <SortableTh
                        label="Nama Siswa"
                        sortKey="nama"
                        activeKey={siswaSortKey}
                        sortDir={siswaSortDir}
                        onSort={toggleSiswaSort}
                      />
                      <SortableTh
                        label="NISN"
                        sortKey="nisn"
                        activeKey={siswaSortKey}
                        sortDir={siswaSortDir}
                        onSort={toggleSiswaSort}
                      />
                      <SortableTh
                        label="Jenis Kelamin"
                        sortKey="jenkel"
                        activeKey={siswaSortKey}
                        sortDir={siswaSortDir}
                        onSort={toggleSiswaSort}
                      />
                      <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {siswaRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-sm text-muted-foreground"
                        >
                          Tidak ada siswa di kelas ini.
                        </td>
                      </tr>
                    ) : (
                      siswaRows.map((item) => (
                        <tr key={item.id_riwayat} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5 font-medium">
                            {item.siswa_ppdb?.nama_lengkap || "-"}
                          </td>
                          <td className="px-4 py-2.5">
                            {item.siswa_ppdb?.nisn || "-"}
                          </td>
                          <td className="px-4 py-2.5">
                            {item.siswa_ppdb?.jenkel === "l" ? "Laki-laki" : "Perempuan"}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex justify-end">
                              <Button
                                variant="destructive"
                                size="icon-sm"
                                disabled={removingId === item.id_riwayat}
                                onClick={() => keluarkanSiswa(item)}
                              >
                                {removingId === item.id_riwayat ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <TablePagination
                page={siswaPage}
                totalPages={siswaTotalPages}
                totalRows={siswaTotalRows}
                pageSize={siswaPageSize}
                onPageChange={setSiswaPage}
                onPageSizeChange={setSiswaPageSize}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
