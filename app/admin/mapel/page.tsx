"use client"

import { useEffect, useState } from "react"
import { BookOpen, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { useTableControls } from "@/lib/use-table-controls"
import { Modal } from "@/components/modal"
import { SortableTh } from "@/components/sortable-th"
import { TablePagination } from "@/components/table-pagination"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Mapel = {
  id_mapel: string
  nama_pelajaran: string
}

export default function MapelPage() {
  const [data, setData] = useState<Mapel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [namaBaru, setNamaBaru] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [editingItem, setEditingItem] = useState<Mapel | null>(null)
  const [editNama, setEditNama] = useState("")
  const [editError, setEditError] = useState<string | null>(null)

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
    searchFields: (row) => [row.nama_pelajaran],
    getSortValue: (row, key) => (key === "nama" ? row.nama_pelajaran : null),
    initialSortKey: "nama",
  })

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/mapel")
      setData(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch("/mapel")
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

  const bukaTambah = () => {
    setNamaBaru("")
    setFormError(null)
    setAddOpen(true)
  }

  const tambahMapel = async () => {
    setFormError(null)

    if (!namaBaru.trim()) {
      setFormError("Nama mata pelajaran wajib diisi.")
      return
    }

    setSubmitting(true)

    try {
      await apiFetch("/mapel", {
        method: "POST",
        body: JSON.stringify({ nama_pelajaran: namaBaru.trim() }),
      })
      setAddOpen(false)
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambahkan.")
    } finally {
      setSubmitting(false)
    }
  }

  const mulaiEdit = (item: Mapel) => {
    setEditingItem(item)
    setEditNama(item.nama_pelajaran)
    setEditError(null)
  }

  const simpanEdit = async () => {
    if (!editingItem) return

    setEditError(null)

    if (!editNama.trim()) {
      setEditError("Nama mata pelajaran wajib diisi.")
      return
    }

    setProcessingId(editingItem.id_mapel)

    try {
      await apiFetch(`/mapel/${editingItem.id_mapel}`, {
        method: "PUT",
        body: JSON.stringify({ nama_pelajaran: editNama.trim() }),
      })
      setEditingItem(null)
      await muatData()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Gagal menyimpan.")
    } finally {
      setProcessingId(null)
    }
  }

  const hapus = async (item: Mapel) => {
    if (
      !window.confirm(
        `Hapus mata pelajaran ${item.nama_pelajaran}? Aksi ini tidak bisa dibatalkan.`
      )
    ) {
      return
    }

    setProcessingId(item.id_mapel)
    setError(null)

    try {
      await apiFetch(`/mapel/${item.id_mapel}`, { method: "DELETE" })
      await muatData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mata Pelajaran</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar mata pelajaran.
          </p>
        </div>
        <Button onClick={bukaTambah}>
          <Plus className="w-4 h-4" />
          Tambah Mata Pelajaran
        </Button>
      </div>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            Daftar Mata Pelajaran
          </CardTitle>
          <div className="relative w-full max-w-56">
            <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mata pelajaran..."
              className="pl-8"
            />
          </div>
        </CardHeader>

        {error && <p className="px-4 pt-3 text-sm text-destructive">{error}</p>}

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
                      label="Nama Mata Pelajaran"
                      sortKey="nama"
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
                      <td colSpan={2} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Belum ada mata pelajaran.
                      </td>
                    </tr>
                  ) : (
                    rows.map((item) => {
                      const isBusy = processingId === item.id_mapel

                      return (
                        <tr key={item.id_mapel} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5 font-medium">{item.nama_pelajaran}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => mulaiEdit(item)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => hapus(item)}
                              >
                                {isBusy ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                                Hapus
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

      {addOpen && (
        <Modal title="Tambah Mata Pelajaran" onClose={() => setAddOpen(false)}>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nama Mata Pelajaran
              </label>
              <Input
                value={namaBaru}
                onChange={(e) => setNamaBaru(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") tambahMapel()
                }}
                disabled={submitting}
              />
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <Button onClick={tambahMapel} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Tambah
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {editingItem && (
        <Modal
          title={`Edit Mata Pelajaran - ${editingItem.nama_pelajaran}`}
          onClose={() => setEditingItem(null)}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nama Mata Pelajaran
              </label>
              <Input
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") simpanEdit()
                }}
                disabled={processingId === editingItem.id_mapel}
              />
            </div>

            {editError && <p className="text-sm text-destructive">{editError}</p>}

            <div className="flex gap-2 pt-1">
              <Button onClick={simpanEdit} disabled={processingId === editingItem.id_mapel}>
                {processingId === editingItem.id_mapel ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Simpan
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)}
                disabled={processingId === editingItem.id_mapel}
              >
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
