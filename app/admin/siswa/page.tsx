"use client"

import { useEffect, useState } from "react"
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Modal } from "@/components/modal"
import { SortableTh } from "@/components/sortable-th"
import { TablePagination } from "@/components/table-pagination"
import type { SortDir } from "@/lib/use-table-controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Siswa = {
  id_siswa: string
  nama_lengkap: string
  tempat_lahir: string | null
  tanggal_lahir: string
  jenkel: "l" | "p"
  no_hp: string
  agama: string
  alamat: string
  nisn: string
  nik_siswa: string
  nama_ayah: string
  nama_ibu: string
  no_hp_ortu: string
  asal_sekolah: string
  minat_jurusan1: string
  minat_jurusan2: string
  tahun: number
  username: string
  status: "aktif" | "nonaktif" | "keluar" | "ppdb"
  siswa_baru?: {
    kelas_ppdb?: {
      tingkat: string
      nama_kelas: string
    } | null
  } | null
}

type EditForm = {
  nama_lengkap: string
  tempat_lahir: string
  tanggal_lahir: string
  jenkel: "l" | "p"
  agama: string
  alamat: string
  nisn: string
  nik_siswa: string
  nama_ayah: string
  nama_ibu: string
  no_hp: string
  no_hp_ortu: string
  asal_sekolah: string
  minat_jurusan1: string
  minat_jurusan2: string
  status: "aktif" | "nonaktif" | "keluar" | "ppdb"
}

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "aktif", label: "Aktif" },
  { value: "nonaktif", label: "Nonaktif" },
  { value: "keluar", label: "Keluar" },
  { value: "ppdb", label: "PPDB" },
]

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

const STATUS_BADGE: Record<Siswa["status"], "default" | "secondary" | "destructive" | "outline"> = {
  aktif: "default",
  nonaktif: "secondary",
  keluar: "destructive",
  ppdb: "outline",
}

export default function SiswaPage() {
  const [data, setData] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [sortKey, setSortKey] = useState("nama")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRows, setTotalRows] = useState(0)

  const [addOpen, setAddOpen] = useState(false)
  const [namaBaru, setNamaBaru] = useState("")
  const [tahunBaru, setTahunBaru] = useState(String(new Date().getFullYear()))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formInfo, setFormInfo] = useState<string | null>(null)

  const [editingItem, setEditingItem] = useState<Siswa | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

  // Debounce search supaya tidak nembak API tiap ketikan.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== search) {
        setLoading(true)
        setPage(1)
        setSearch(searchInput)
      }
    }, 400)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(pageSize))
      params.set("sort_by", sortKey)
      params.set("sort_dir", sortDir)
      if (search.trim()) params.set("search", search.trim())
      if (status) params.set("status", status)

      const res = await apiFetch(`/siswa/master?${params.toString()}`)
      setData(Array.isArray(res.data) ? res.data : [])
      setTotalPages(res.pagination?.total_pages || 1)
      setTotalRows(res.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(pageSize))
    params.set("sort_by", sortKey)
    params.set("sort_dir", sortDir)
    if (search.trim()) params.set("search", search.trim())
    if (status) params.set("status", status)

    apiFetch(`/siswa/master?${params.toString()}`)
      .then((res) => {
        if (cancelled) return
        setData(Array.isArray(res.data) ? res.data : [])
        setTotalPages(res.pagination?.total_pages || 1)
        setTotalRows(res.pagination?.total || 0)
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
  }, [page, pageSize, sortKey, sortDir, search, status])

  const toggleSort = (key: string) => {
    setLoading(true)
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(1)
  }

  const bukaTambah = () => {
    setNamaBaru("")
    setTahunBaru(String(new Date().getFullYear()))
    setFormError(null)
    setFormInfo(null)
    setAddOpen(true)
  }

  const tambahSiswa = async () => {
    setFormError(null)
    setFormInfo(null)

    if (!namaBaru.trim()) {
      setFormError("Nama lengkap wajib diisi.")
      return
    }

    setSubmitting(true)

    try {
      await apiFetch("/ppdb/tambah-cepat", {
        method: "POST",
        body: JSON.stringify({
          nama_lengkap: namaBaru.trim(),
          tahun: tahunBaru.trim() || undefined,
        }),
      })
      setFormInfo(
        "Murid baru berhasil ditambahkan (data lain diisi placeholder - lengkapi lewat Edit)."
      )
      setNamaBaru("")
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambahkan.")
    } finally {
      setSubmitting(false)
    }
  }

  const mulaiEdit = (item: Siswa) => {
    setEditingItem(item)
    setEditError(null)
    setEditForm({
      nama_lengkap: item.nama_lengkap,
      tempat_lahir: item.tempat_lahir || "",
      tanggal_lahir: item.tanggal_lahir?.slice(0, 10) || "",
      jenkel: item.jenkel,
      agama: item.agama,
      alamat: item.alamat,
      nisn: item.nisn,
      nik_siswa: item.nik_siswa,
      nama_ayah: item.nama_ayah,
      nama_ibu: item.nama_ibu,
      no_hp: item.no_hp,
      no_hp_ortu: item.no_hp_ortu,
      asal_sekolah: item.asal_sekolah,
      minat_jurusan1: item.minat_jurusan1,
      minat_jurusan2: item.minat_jurusan2,
      status: item.status,
    })
  }

  const batalEdit = () => {
    setEditingItem(null)
    setEditForm(null)
  }

  const simpanEdit = async () => {
    if (!editingItem || !editForm) return

    setEditError(null)

    if (!editForm.nama_lengkap.trim()) {
      setEditError("Nama lengkap wajib diisi.")
      return
    }

    setProcessingId(editingItem.id_siswa)

    try {
      await apiFetch("/ppdb/updatesiswa", {
        method: "PUT",
        body: JSON.stringify({ ...editForm, id_siswa: editingItem.id_siswa }),
      })
      setEditingItem(null)
      setEditForm(null)
      await muatData()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Gagal menyimpan.")
    } finally {
      setProcessingId(null)
    }
  }

  const hapus = async (item: Siswa) => {
    if (!window.confirm(`Hapus data siswa ${item.nama_lengkap}? Aksi ini tidak bisa dibatalkan.`)) {
      return
    }

    setProcessingId(item.id_siswa)
    setError(null)

    try {
      await apiFetch("/ppdb/deletesiswa", {
        method: "DELETE",
        body: JSON.stringify({ id_siswa: item.id_siswa }),
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Siswa</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data siswa ({totalRows.toLocaleString("id-ID")} total).
          </p>
        </div>
        <Button onClick={bukaTambah}>
          <Plus className="w-4 h-4" />
          Tambah Siswa
        </Button>
      </div>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Daftar Siswa
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={selectClass + " w-auto"}
              value={status}
              onChange={(e) => {
                setLoading(true)
                setPage(1)
                setStatus(e.target.value)
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="relative w-full max-w-56">
              <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama, NISN, username..."
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
                    <SortableTh label="Nama" sortKey="nama" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="NISN" sortKey="nisn" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh
                      label="Kelas"
                      sortKey="kelas_ppdb"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableTh label="Angkatan" sortKey="tahun" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Username" sortKey="username" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Tidak ada data siswa.
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => {
                      const isBusy = processingId === item.id_siswa
                      const kelas = item.siswa_baru?.kelas_ppdb

                      return (
                        <tr key={item.id_siswa} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5 font-medium">{item.nama_lengkap}</td>
                          <td className="px-4 py-2.5">{item.nisn}</td>
                          <td className="px-4 py-2.5">
                            {kelas ? `${kelas.tingkat} ${kelas.nama_kelas}` : "-"}
                          </td>
                          <td className="px-4 py-2.5">{item.tahun}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant={STATUS_BADGE[item.status]} className="capitalize">
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                            {item.username}
                          </td>
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
              onPageChange={(p) => {
                setLoading(true)
                setPage(p)
              }}
              onPageSizeChange={(size) => {
                setLoading(true)
                setPageSize(size)
                setPage(1)
              }}
            />
          </>
        )}
      </Card>

      {addOpen && (
        <Modal title="Tambah Siswa" onClose={() => setAddOpen(false)}>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nama Lengkap
              </label>
              <Input
                value={namaBaru}
                onChange={(e) => setNamaBaru(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Tahun Angkatan
              </label>
              <Input
                type="number"
                value={tahunBaru}
                onChange={(e) => setTahunBaru(e.target.value)}
                disabled={submitting}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Data lain (NISN, NIK, alamat, dll) akan diisi placeholder dulu -
              lengkapi lewat tombol Edit setelah data ditambahkan.
            </p>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
            {formInfo && <p className="text-sm text-primary">{formInfo}</p>}

            <div className="flex gap-2 pt-1">
              <Button onClick={tambahSiswa} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Tambah Siswa
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {editingItem && editForm && (
        <Modal
          title={`Edit Siswa - ${editingItem.nama_lengkap}`}
          onClose={batalEdit}
          maxWidthClassName="max-w-2xl"
        >
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Data Pribadi
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nama Lengkap">
                  <Input
                    value={editForm.nama_lengkap}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, nama_lengkap: e.target.value })
                    }
                  />
                </Field>
                <Field label="NISN">
                  <Input
                    value={editForm.nisn}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, nisn: e.target.value })
                    }
                  />
                </Field>
                <Field label="NIK">
                  <Input
                    value={editForm.nik_siswa}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, nik_siswa: e.target.value })
                    }
                  />
                </Field>
                <Field label="Tempat Lahir">
                  <Input
                    value={editForm.tempat_lahir}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, tempat_lahir: e.target.value })
                    }
                  />
                </Field>
                <Field label="Tanggal Lahir">
                  <Input
                    type="date"
                    value={editForm.tanggal_lahir}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, tanggal_lahir: e.target.value })
                    }
                  />
                </Field>
                <Field label="Jenis Kelamin">
                  <select
                    className={selectClass}
                    value={editForm.jenkel}
                    onChange={(e) =>
                      setEditForm(
                        (prev) => prev && { ...prev, jenkel: e.target.value as "l" | "p" }
                      )
                    }
                  >
                    <option value="l">Laki-laki</option>
                    <option value="p">Perempuan</option>
                  </select>
                </Field>
                <Field label="Agama">
                  <Input
                    value={editForm.agama}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, agama: e.target.value })
                    }
                  />
                </Field>
                <Field label="Status">
                  <select
                    className={selectClass}
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm(
                        (prev) =>
                          prev && { ...prev, status: e.target.value as EditForm["status"] }
                      )
                    }
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                    <option value="keluar">Keluar</option>
                    <option value="ppdb">PPDB</option>
                  </select>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Alamat">
                  <Input
                    value={editForm.alamat}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, alamat: e.target.value })
                    }
                  />
                </Field>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Kontak & Orang Tua
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="No. HP Siswa">
                  <Input
                    value={editForm.no_hp}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, no_hp: e.target.value })
                    }
                  />
                </Field>
                <Field label="No. HP Orang Tua">
                  <Input
                    value={editForm.no_hp_ortu}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, no_hp_ortu: e.target.value })
                    }
                  />
                </Field>
                <Field label="Nama Ayah">
                  <Input
                    value={editForm.nama_ayah}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, nama_ayah: e.target.value })
                    }
                  />
                </Field>
                <Field label="Nama Ibu">
                  <Input
                    value={editForm.nama_ibu}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, nama_ibu: e.target.value })
                    }
                  />
                </Field>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                PPDB
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Asal Sekolah">
                  <Input
                    value={editForm.asal_sekolah}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, asal_sekolah: e.target.value })
                    }
                  />
                </Field>
                <div />
                <Field label="Minat Jurusan 1">
                  <Input
                    value={editForm.minat_jurusan1}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, minat_jurusan1: e.target.value })
                    }
                  />
                </Field>
                <Field label="Minat Jurusan 2">
                  <Input
                    value={editForm.minat_jurusan2}
                    onChange={(e) =>
                      setEditForm((prev) => prev && { ...prev, minat_jurusan2: e.target.value })
                    }
                  />
                </Field>
              </div>
            </div>

            {editError && <p className="text-sm text-destructive">{editError}</p>}

            <div className="flex gap-2 pt-1">
              <Button onClick={simpanEdit} disabled={processingId === editingItem.id_siswa}>
                {processingId === editingItem.id_siswa ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Simpan
              </Button>
              <Button
                variant="outline"
                onClick={batalEdit}
                disabled={processingId === editingItem.id_siswa}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
