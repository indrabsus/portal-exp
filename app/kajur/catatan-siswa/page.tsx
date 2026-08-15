"use client"

import { useEffect, useState } from "react"
import {
  Loader2,
  MessageSquareText,
  Plus,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react"

import { apiFetch } from "@/lib/api"
import { useTableControls } from "@/lib/use-table-controls"
import { Modal } from "@/components/modal"
import { SortableTh } from "@/components/sortable-th"
import { TablePagination } from "@/components/table-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type SiswaRow = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  kelas: string
  jumlah_positif: number
  jumlah_negatif: number
}

type CatatanRow = {
  id_catatan: string
  tipe: "positif" | "negatif"
  catatan: string
  nama_pencatat: string | null
  created_at: string
}

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

const SEMUA_KELAS = "__semua__"

export default function CatatanSiswaPage() {
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaRow | null>(null)
  const [filterKelas, setFilterKelas] = useState(SEMUA_KELAS)

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/catatan-siswa/siswa-jurusan")
      setSiswaList(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch("/catatan-siswa/siswa-jurusan")
      .then((res) => {
        if (!cancelled) setSiswaList(res.data || [])
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

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas))).sort()

  const siswaTerfilter =
    filterKelas === SEMUA_KELAS ? siswaList : siswaList.filter((s) => s.kelas === filterKelas)

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
  } = useTableControls(siswaTerfilter, {
    searchFields: (row) => [row.nama_lengkap, row.nisn, row.kelas],
    getSortValue: (row, key) => {
      if (key === "nama") return row.nama_lengkap
      if (key === "kelas") return row.kelas
      if (key === "positif") return row.jumlah_positif
      if (key === "negatif") return row.jumlah_negatif
      return null
    },
    initialSortKey: "nama",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catatan Siswa</h1>
        <p className="text-sm text-muted-foreground">
          Catat progres etika, kehadiran, atau hal lain untuk siswa jurusan Anda.
        </p>
      </div>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-muted-foreground" />
            Daftar Siswa
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={selectClass + " w-auto"}
              value={filterKelas}
              onChange={(e) => {
                setFilterKelas(e.target.value)
                setPage(1)
              }}
            >
              <option value={SEMUA_KELAS}>Semua Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <div className="relative w-full max-w-56">
              <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NISN, atau kelas..."
                className="pl-8"
              />
            </div>
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
                    <SortableTh label="Nama Siswa" sortKey="nama" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Kelas" sortKey="kelas" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Positif" sortKey="positif" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Negatif" sortKey="negatif" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Belum ada data siswa.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id_siswa} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{row.nama_lengkap}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.kelas}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <ThumbsUp className="w-3 h-3" />
                            {row.jumlah_positif}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            <ThumbsDown className="w-3 h-3" />
                            {row.jumlah_negatif}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => setSelectedSiswa(row)}>
                              <MessageSquareText className="w-3.5 h-3.5" />
                              Catatan
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

      {selectedSiswa && (
        <CatatanModal
          siswa={selectedSiswa}
          onClose={() => setSelectedSiswa(null)}
          onChanged={muatData}
        />
      )}
    </div>
  )
}

function CatatanModal({
  siswa,
  onClose,
  onChanged,
}: {
  siswa: SiswaRow
  onClose: () => void
  onChanged: () => void
}) {
  const [catatanList, setCatatanList] = useState<CatatanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tipe, setTipe] = useState<"positif" | "negatif">("positif")
  const [isiCatatan, setIsiCatatan] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

  const muatCatatan = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch(`/catatan-siswa/${siswa.id_siswa}`)
      setCatatanList(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat catatan.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch(`/catatan-siswa/${siswa.id_siswa}`)
      .then((res) => {
        if (!cancelled) setCatatanList(res.data || [])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat catatan.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [siswa.id_siswa])

  const submit = async () => {
    setFormError(null)

    if (!isiCatatan.trim()) {
      setFormError("Isi catatan wajib diisi.")
      return
    }

    setSubmitting(true)

    try {
      await apiFetch("/catatan-siswa", {
        method: "POST",
        body: JSON.stringify({ id_siswa: siswa.id_siswa, tipe, catatan: isiCatatan.trim() }),
      })
      setIsiCatatan("")
      await muatCatatan()
      onChanged()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambahkan catatan.")
    } finally {
      setSubmitting(false)
    }
  }

  const hapus = async (row: CatatanRow) => {
    if (!window.confirm("Hapus catatan ini? Aksi ini tidak bisa dibatalkan.")) return

    setProcessingId(row.id_catatan)

    try {
      await apiFetch(`/catatan-siswa/${row.id_catatan}`, { method: "DELETE" })
      await muatCatatan()
      onChanged()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus catatan.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <Modal
      title={`Catatan - ${siswa.nama_lengkap}`}
      onClose={onClose}
      maxWidthClassName="max-w-xl"
    >
      <div className="space-y-4">
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipe("positif")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                tipe === "positif"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Positif
            </button>
            <button
              type="button"
              onClick={() => setTipe("negatif")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                tipe === "negatif"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              Negatif
            </button>
          </div>

          <textarea
            className={textareaClass}
            rows={3}
            placeholder="mis. Aktif membantu teman sekelas, atau: terlambat masuk kelas 3x minggu ini..."
            value={isiCatatan}
            onChange={(e) => setIsiCatatan(e.target.value)}
            disabled={submitting}
          />

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <Button onClick={submit} disabled={submitting} size="sm">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Tambah Catatan
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat catatan...
          </div>
        ) : catatanList.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Belum ada catatan untuk siswa ini.</p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {catatanList.map((row) => (
              <div key={row.id_catatan} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {row.tipe === "positif" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <ThumbsUp className="w-3 h-3" />
                        Positif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        <ThumbsDown className="w-3 h-3" />
                        Negatif
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{row.catatan}</p>
                  {row.nama_pencatat && (
                    <p className="text-xs text-muted-foreground">Dicatat oleh {row.nama_pencatat}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={processingId === row.id_catatan}
                  onClick={() => hapus(row)}
                  className="shrink-0 text-destructive hover:bg-destructive/10"
                >
                  {processingId === row.id_catatan ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
