"use client"

import { useEffect, useState } from "react"
import { BookOpen, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { useTableControls } from "@/lib/use-table-controls"
import { Modal } from "@/components/modal"
import { SortableTh } from "@/components/sortable-th"
import { TablePagination } from "@/components/table-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Mengajar = {
  id_pengajaran: string
  tingkat: string
  nama_kelas: string
  mapel?: { nama_pelajaran: string }
}

type Materi = {
  id_materi: string
  id_pengajaran: string
  judul: string
  deskripsi: string | null
  tanggal: string
  pengajaran?: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } }
}

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

function labelMengajar(m: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } } | undefined) {
  if (!m) return "-"
  return `${m.mapel?.nama_pelajaran || "-"} - ${m.tingkat} ${m.nama_kelas}`
}

export default function MateriPage() {
  const [data, setData] = useState<Materi[]>([])
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Materi | null>(null)
  const [idPengajaran, setIdPengajaran] = useState("")
  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/materi-ajar")
      setData(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([apiFetch("/materi-ajar"), apiFetch("/mengajar")])
      .then(([materiRes, mengajarRes]) => {
        if (cancelled) return
        setData(materiRes.data || [])
        setMengajarList(mengajarRes.data || [])
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
    searchFields: (row) => [row.judul, row.pengajaran?.mapel?.nama_pelajaran, row.pengajaran?.nama_kelas],
    getSortValue: (row, key) => {
      if (key === "tanggal") return row.tanggal
      if (key === "judul") return row.judul
      if (key === "kelas") return labelMengajar(row.pengajaran)
      return null
    },
    initialSortKey: "tanggal",
    initialSortDir: "desc",
  })

  const bukaTambah = () => {
    setEditing(null)
    setIdPengajaran(mengajarList[0]?.id_pengajaran || "")
    setJudul("")
    setDeskripsi("")
    setTanggal(new Date().toISOString().slice(0, 10))
    setFormError(null)
    setFormOpen(true)
  }

  const bukaEdit = (item: Materi) => {
    setEditing(item)
    setIdPengajaran(item.id_pengajaran)
    setJudul(item.judul)
    setDeskripsi(item.deskripsi || "")
    setTanggal(item.tanggal)
    setFormError(null)
    setFormOpen(true)
  }

  const submit = async () => {
    setFormError(null)

    if (!idPengajaran || !judul.trim() || !tanggal) {
      setFormError("Kelas/mapel, judul, dan tanggal wajib diisi.")
      return
    }

    setSubmitting(true)

    const payload = { id_pengajaran: idPengajaran, judul: judul.trim(), deskripsi: deskripsi.trim(), tanggal }

    try {
      if (editing) {
        await apiFetch(`/materi-ajar/${editing.id_materi}`, { method: "PUT", body: JSON.stringify(payload) })
      } else {
        await apiFetch("/materi-ajar", { method: "POST", body: JSON.stringify(payload) })
      }
      setFormOpen(false)
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan materi.")
    } finally {
      setSubmitting(false)
    }
  }

  const hapus = async (item: Materi) => {
    if (!window.confirm(`Hapus materi "${item.judul}"? Aksi ini tidak bisa dibatalkan.`)) return

    setProcessingId(item.id_materi)

    try {
      await apiFetch(`/materi-ajar/${item.id_materi}`, { method: "DELETE" })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus materi.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materi</h1>
          <p className="text-sm text-muted-foreground">Catat materi yang sudah diajarkan per kelas.</p>
        </div>
        <Button onClick={bukaTambah} disabled={mengajarList.length === 0}>
          <Plus className="w-4 h-4" />
          Tambah Materi
        </Button>
      </div>

      {mengajarList.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          Anda belum punya pembagian mengajar. Tambahkan dulu di menu Pembagian Mengajar.
        </p>
      )}

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            Daftar Materi
          </CardTitle>
          <div className="relative w-full max-w-56">
            <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul, mapel, kelas..." className="pl-8" />
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
                    <SortableTh label="Tanggal" sortKey="tanggal" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Kelas / Mapel" sortKey="kelas" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Judul Materi" sortKey="judul" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Belum ada materi tercatat.
                      </td>
                    </tr>
                  ) : (
                    rows.map((item) => {
                      const isBusy = processingId === item.id_materi
                      return (
                        <tr key={item.id_materi} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-4 py-2.5">{labelMengajar(item.pengajaran)}</td>
                          <td className="px-4 py-2.5 font-medium">
                            {item.judul}
                            {item.deskripsi && <p className="text-xs font-normal text-muted-foreground">{item.deskripsi}</p>}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon-sm" onClick={() => bukaEdit(item)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={isBusy}
                                onClick={() => hapus(item)}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

            <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </Card>

      {formOpen && (
        <Modal title={editing ? "Edit Materi" : "Tambah Materi"} onClose={() => setFormOpen(false)}>
          <div className="space-y-3">
            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Kelas / Mapel</label>
              <select className={selectClass} value={idPengajaran} onChange={(e) => setIdPengajaran(e.target.value)} disabled={submitting}>
                {mengajarList.map((m) => (
                  <option key={m.id_pengajaran} value={m.id_pengajaran}>
                    {labelMengajar(m)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Judul Materi</label>
              <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="mis. Teks Eksposisi" disabled={submitting} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Deskripsi (opsional)</label>
              <textarea className={textareaClass} rows={2} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} disabled={submitting} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
              <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} disabled={submitting} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Simpan
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
