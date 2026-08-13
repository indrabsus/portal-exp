"use client"

import { useEffect, useState } from "react"
import { CalendarRange, Loader2, Plus, Power, Search, Trash2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { useTableControls } from "@/lib/use-table-controls"
import { SortableTh } from "@/components/sortable-th"
import { TablePagination } from "@/components/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type TahunAjaran = {
  id_tahun_ajaran: string
  nama: string
  is_aktif: boolean
}

const FORMAT_REGEX = /^\d{4}\/\d{4}$/

export default function TahunAjaranPage() {
  const [data, setData] = useState<TahunAjaran[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [namaBaru, setNamaBaru] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

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
  } = useTableControls(data, {
    searchFields: (row) => [row.nama],
    getSortValue: (row, key) => {
      if (key === "nama") return row.nama
      if (key === "is_aktif") return row.is_aktif
      return null
    },
    initialSortKey: "nama",
    initialSortDir: "desc",
  })

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/tahun-ajaran")
      setData(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch("/tahun-ajaran")
      .then((res) => {
        if (!cancelled) setData(res.data || [])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const tambahTahunAjaran = async () => {
    const nama = namaBaru.trim()
    setFormError(null)

    if (!FORMAT_REGEX.test(nama)) {
      setFormError('Format harus "YYYY/YYYY", contoh: 2027/2028.')
      return
    }

    setSubmitting(true)

    try {
      await apiFetch("/tahun-ajaran", {
        method: "POST",
        body: JSON.stringify({ nama }),
      })
      setNamaBaru("")
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambahkan.")
    } finally {
      setSubmitting(false)
    }
  }

  const aktifkan = async (item: TahunAjaran) => {
    setProcessingId(item.id_tahun_ajaran)
    setError(null)

    try {
      await apiFetch(`/tahun-ajaran/${item.id_tahun_ajaran}/aktifkan`, {
        method: "PATCH",
      })
      await muatData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengaktifkan.")
    } finally {
      setProcessingId(null)
    }
  }

  const hapus = async (item: TahunAjaran) => {
    if (
      !window.confirm(
        `Hapus tahun ajaran ${item.nama}? Aksi ini tidak bisa dibatalkan.`
      )
    ) {
      return
    }

    setProcessingId(item.id_tahun_ajaran)
    setError(null)

    try {
      await apiFetch(`/tahun-ajaran/${item.id_tahun_ajaran}`, {
        method: "DELETE",
      })
      await muatData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tahun Ajaran</h1>
        <p className="text-sm text-muted-foreground">
          Kelola tahun ajaran dan tentukan tahun ajaran yang sedang aktif.
        </p>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-muted-foreground" />
            Tambah Tahun Ajaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Contoh: 2027/2028"
              value={namaBaru}
              onChange={(e) => setNamaBaru(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") tambahTahunAjaran()
              }}
              disabled={submitting}
              className="sm:max-w-xs"
            />
            <Button onClick={tambahTahunAjaran} disabled={submitting}>
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tambah
            </Button>
          </div>
          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}
        </CardContent>
      </Card>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-muted-foreground" />
            Daftar Tahun Ajaran
          </CardTitle>
          <div className="relative w-full max-w-56">
            <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tahun ajaran..."
              className="pl-8"
            />
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
                      label="Tahun Ajaran"
                      sortKey="nama"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableTh
                      label="Status"
                      sortKey="is_aktif"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                    <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        Belum ada tahun ajaran.
                      </td>
                    </tr>
                  ) : (
                    rows.map((item) => (
                      <tr key={item.id_tahun_ajaran} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{item.nama}</td>
                        <td className="px-4 py-2.5">
                          {item.is_aktif ? (
                            <Badge>Aktif</Badge>
                          ) : (
                            <Badge variant="secondary">Nonaktif</Badge>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-2">
                            {!item.is_aktif && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={processingId === item.id_tahun_ajaran}
                                onClick={() => aktifkan(item)}
                              >
                                <Power className="w-3.5 h-3.5" />
                                Aktifkan
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={
                                item.is_aktif ||
                                processingId === item.id_tahun_ajaran
                              }
                              onClick={() => hapus(item)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
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
              page={page}
              totalPages={totalPages}
              totalRows={totalRows}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </Card>
    </div>
  )
}
