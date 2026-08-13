"use client"

import { useEffect, useState } from "react"
import {
  GraduationCap,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
} from "lucide-react"

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

const ID_ROLE_GURU = "6"

type Guru = {
  id_data: string
  id_user: string
  nama_lengkap: string
  nama_singkat: string
  jenkel: "l" | "p"
  no_hp: string | null
  uid_fp: number | null
  user: {
    id: string
    username: string
    acc: "y" | "n"
  }
}

type FormState = {
  nama_lengkap: string
  nama_singkat: string
  no_hp: string
  jenkel: "l" | "p"
  uid_fp: string
}

const EMPTY_FORM: FormState = {
  nama_lengkap: "",
  nama_singkat: "",
  no_hp: "",
  jenkel: "l",
  uid_fp: "",
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

export default function GuruPage() {
  const [data, setData] = useState<Guru[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formInfo, setFormInfo] = useState<string | null>(null)

  const [editingItem, setEditingItem] = useState<Guru | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
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
    searchFields: (row) => [row.nama_lengkap, row.user.username, row.no_hp],
    getSortValue: (row, key) => {
      if (key === "nama") return row.nama_lengkap
      if (key === "username") return row.user.username
      if (key === "status") return row.user.acc
      return null
    },
    initialSortKey: "nama",
  })

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/data/guru/")
      setData(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch("/data/guru/")
      .then((res) => {
        if (!cancelled) setData(Array.isArray(res.data) ? res.data : [])
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
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormInfo(null)
    setAddOpen(true)
  }

  const tutupTambah = () => {
    setAddOpen(false)
  }

  const tambahGuru = async () => {
    setFormError(null)
    setFormInfo(null)

    if (!form.nama_lengkap.trim() || !form.nama_singkat.trim() || !form.uid_fp.trim()) {
      setFormError("Nama lengkap, nama singkat, dan UID fingerprint wajib diisi.")
      return
    }

    setSubmitting(true)

    try {
      const res = await apiFetch("/data/createuser", {
        method: "POST",
        body: JSON.stringify({
          id_role: ID_ROLE_GURU,
          nama_lengkap: form.nama_lengkap.trim(),
          nama_singkat: form.nama_singkat.trim(),
          no_hp: form.no_hp.trim() || undefined,
          jenkel: form.jenkel,
          uid_fp: Number(form.uid_fp),
        }),
      })
      setForm(EMPTY_FORM)
      setFormInfo(
        `Akun guru berhasil dibuat. Username: ${res.data?.user?.username || "-"}, password default: 123456`
      )
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambahkan.")
    } finally {
      setSubmitting(false)
    }
  }

  const mulaiEdit = (item: Guru) => {
    setEditingItem(item)
    setEditError(null)
    setEditForm({
      nama_lengkap: item.nama_lengkap,
      nama_singkat: item.nama_singkat,
      no_hp: item.no_hp || "",
      jenkel: item.jenkel,
      uid_fp: item.uid_fp != null ? String(item.uid_fp) : "",
    })
  }

  const batalEdit = () => {
    setEditingItem(null)
  }

  const simpanEdit = async () => {
    if (!editingItem) return

    setEditError(null)

    if (!editForm.nama_lengkap.trim() || !editForm.nama_singkat.trim()) {
      setEditError("Nama lengkap dan nama singkat wajib diisi.")
      return
    }

    setProcessingId(editingItem.id_data)

    try {
      await apiFetch(`/data/updateuser/${editingItem.id_data}`, {
        method: "PUT",
        body: JSON.stringify({
          nama_lengkap: editForm.nama_lengkap.trim(),
          nama_singkat: editForm.nama_singkat.trim(),
          no_hp: editForm.no_hp.trim() || null,
          jenkel: editForm.jenkel,
          ...(editForm.uid_fp.trim() && { uid_fp: Number(editForm.uid_fp) }),
        }),
      })
      setEditingItem(null)
      await muatData()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Gagal menyimpan.")
    } finally {
      setProcessingId(null)
    }
  }

  const toggleStatus = async (item: Guru) => {
    const acc = item.user.acc === "y" ? "n" : "y"
    setProcessingId(item.id_data)
    setError(null)

    try {
      await apiFetch(`/role/updateuser/${item.id_user}`, {
        method: "PUT",
        body: JSON.stringify({ acc }),
      })
      await muatData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status.")
    } finally {
      setProcessingId(null)
    }
  }

  const resetPassword = async (item: Guru) => {
    if (
      !window.confirm(
        `Reset password ${item.user.username} ke default (123456)?`
      )
    ) {
      return
    }

    setProcessingId(item.id_data)
    setError(null)

    try {
      await apiFetch(`/role/resetpassword/${item.id_user}`, { method: "PUT" })
      window.alert(`Password ${item.user.username} berhasil direset ke 123456.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset password.")
    } finally {
      setProcessingId(null)
    }
  }

  const hapus = async (item: Guru) => {
    if (!window.confirm(`Hapus akun guru ${item.nama_lengkap}?`)) return

    setProcessingId(item.id_data)
    setError(null)

    try {
      await apiFetch(`/data/deleteuser/${item.id_user}`, { method: "DELETE" })
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
          <h1 className="text-2xl font-bold tracking-tight">Guru</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data dan akun guru.
          </p>
        </div>
        <Button onClick={bukaTambah}>
          <Plus className="w-4 h-4" />
          Tambah Guru
        </Button>
      </div>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            Daftar Guru
          </CardTitle>
          <div className="relative w-full max-w-56">
            <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, username, no HP..."
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
                      label="Nama"
                      sortKey="nama"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableTh
                      label="Username"
                      sortKey="username"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      No. HP
                    </th>
                    <SortableTh
                      label="Status"
                      sortKey="status"
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
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        Belum ada data guru.
                      </td>
                    </tr>
                  ) : (
                    rows.map((item) => {
                      const isBusy = processingId === item.id_data

                      return (
                        <tr key={item.id_data} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5 font-medium">
                            {item.nama_lengkap}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                            {item.user.username}
                          </td>
                          <td className="px-4 py-2.5">{item.no_hp || "-"}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant={item.user.acc === "y" ? "default" : "secondary"}>
                              {item.user.acc === "y" ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap justify-end gap-2">
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
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => toggleStatus(item)}
                              >
                                <Power className="w-3.5 h-3.5" />
                                {item.user.acc === "y" ? "Nonaktifkan" : "Aktifkan"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => resetPassword(item)}
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                Reset Password
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => hapus(item)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        <Modal title="Tambah Guru" onClose={tutupTambah}>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Nama Lengkap
                </label>
                <Input
                  value={form.nama_lengkap}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nama_lengkap: e.target.value }))
                  }
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Nama Singkat
                </label>
                <Input
                  value={form.nama_singkat}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nama_singkat: e.target.value }))
                  }
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  No. HP
                </label>
                <Input
                  value={form.no_hp}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, no_hp: e.target.value }))
                  }
                  placeholder="08xxxxxxxxxx"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Jenis Kelamin
                </label>
                <select
                  className={selectClass}
                  value={form.jenkel}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      jenkel: e.target.value as "l" | "p",
                    }))
                  }
                  disabled={submitting}
                >
                  <option value="l">Laki-laki</option>
                  <option value="p">Perempuan</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  UID Fingerprint
                </label>
                <Input
                  type="number"
                  value={form.uid_fp}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, uid_fp: e.target.value }))
                  }
                  disabled={submitting}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Username & password default (123456) dibuat otomatis saat akun
              ditambahkan.
            </p>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
            {formInfo && <p className="text-sm text-primary">{formInfo}</p>}

            <div className="flex gap-2 pt-1">
              <Button onClick={tambahGuru} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Tambah Guru
              </Button>
              <Button variant="outline" onClick={tutupTambah} disabled={submitting}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {editingItem && (
        <Modal title={`Edit Guru - ${editingItem.nama_lengkap}`} onClose={batalEdit}>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Nama Lengkap
                </label>
                <Input
                  value={editForm.nama_lengkap}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      nama_lengkap: e.target.value,
                    }))
                  }
                  disabled={processingId === editingItem.id_data}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Nama Singkat
                </label>
                <Input
                  value={editForm.nama_singkat}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      nama_singkat: e.target.value,
                    }))
                  }
                  disabled={processingId === editingItem.id_data}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  No. HP
                </label>
                <Input
                  value={editForm.no_hp}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, no_hp: e.target.value }))
                  }
                  disabled={processingId === editingItem.id_data}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Jenis Kelamin
                </label>
                <select
                  className={selectClass}
                  value={editForm.jenkel}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      jenkel: e.target.value as "l" | "p",
                    }))
                  }
                  disabled={processingId === editingItem.id_data}
                >
                  <option value="l">Laki-laki</option>
                  <option value="p">Perempuan</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  UID Fingerprint
                </label>
                <Input
                  type="number"
                  value={editForm.uid_fp}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, uid_fp: e.target.value }))
                  }
                  disabled={processingId === editingItem.id_data}
                />
              </div>
            </div>

            {editError && <p className="text-sm text-destructive">{editError}</p>}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={simpanEdit}
                disabled={processingId === editingItem.id_data}
              >
                {processingId === editingItem.id_data ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Simpan
              </Button>
              <Button
                variant="outline"
                onClick={batalEdit}
                disabled={processingId === editingItem.id_data}
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
