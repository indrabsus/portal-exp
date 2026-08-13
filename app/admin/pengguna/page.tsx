"use client"

import { useEffect, useState } from "react"
import {
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users as UsersIcon,
  X,
} from "lucide-react"

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

type Role = {
  id_role: string
  nama_role: string
}

type UserAkun = {
  id: string
  username: string
  id_role: string
  acc: "y" | "n"
  role?: Role
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

export default function PenggunaPage() {
  const [data, setData] = useState<UserAkun[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [username, setUsername] = useState("")
  const [idRoleBaru, setIdRoleBaru] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formInfo, setFormInfo] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState("")
  const [editAcc, setEditAcc] = useState<"y" | "n">("y")
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
    searchFields: (row) => [row.username, row.role?.nama_role],
    getSortValue: (row, key) => {
      if (key === "username") return row.username
      if (key === "role") return row.role?.nama_role
      if (key === "status") return row.acc
      return null
    },
    initialSortKey: "username",
  })

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [userRes, roleRes] = await Promise.all([
        apiFetch("/role/user"),
        apiFetch("/role/data"),
      ])
      setData(Array.isArray(userRes.data) ? userRes.data : [])
      setRoles(Array.isArray(roleRes.data) ? roleRes.data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([apiFetch("/role/user"), apiFetch("/role/data")])
      .then(([userRes, roleRes]) => {
        if (cancelled) return
        setData(Array.isArray(userRes.data) ? userRes.data : [])
        setRoles(Array.isArray(roleRes.data) ? roleRes.data : [])
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

  const tambahPengguna = async () => {
    setFormError(null)
    setFormInfo(null)

    if (!username.trim() || !idRoleBaru) {
      setFormError("Username dan role wajib diisi.")
      return
    }

    setSubmitting(true)

    try {
      const res = await apiFetch("/role/createuser", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), id_role: idRoleBaru }),
      })
      setUsername("")
      setIdRoleBaru("")
      setFormInfo(
        `${res.info || "Akun berhasil dibuat."} Password default: 123456`
      )
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambahkan.")
    } finally {
      setSubmitting(false)
    }
  }

  const mulaiEdit = (item: UserAkun) => {
    setEditingId(item.id)
    setEditError(null)
    setEditRole(item.id_role)
    setEditAcc(item.acc)
  }

  const batalEdit = () => {
    setEditingId(null)
    setEditError(null)
  }

  const simpanEdit = async (id: string) => {
    setEditError(null)
    setProcessingId(id)

    try {
      await apiFetch(`/role/updateuser/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id_role: editRole, acc: editAcc }),
      })
      setEditingId(null)
      await muatData()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Gagal menyimpan.")
    } finally {
      setProcessingId(null)
    }
  }

  const resetPassword = async (item: UserAkun) => {
    if (
      !window.confirm(
        `Reset password ${item.username} ke default (123456)?`
      )
    ) {
      return
    }

    setProcessingId(item.id)
    setError(null)

    try {
      await apiFetch(`/role/resetpassword/${item.id}`, { method: "PUT" })
      window.alert(`Password ${item.username} berhasil direset ke 123456.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset password.")
    } finally {
      setProcessingId(null)
    }
  }

  const hapus = async (item: UserAkun) => {
    if (!window.confirm(`Hapus akun ${item.username}?`)) return

    setProcessingId(item.id)
    setError(null)

    try {
      await apiFetch(`/role/deleteuser/${item.id}`, { method: "DELETE" })
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
        <h1 className="text-2xl font-bold tracking-tight">Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Kelola akun staf di luar guru dan siswa (admin, kajur, dan role lainnya).
        </p>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-muted-foreground" />
            Tambah Pengguna
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: budi.santoso"
                disabled={submitting}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Role
              </label>
              <select
                className={selectClass}
                value={idRoleBaru}
                onChange={(e) => setIdRoleBaru(e.target.value)}
                disabled={submitting}
              >
                <option value="">Pilih Role</option>
                {roles.map((r) => (
                  <option key={r.id_role} value={r.id_role}>
                    {r.nama_role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Password default akun baru: 123456. Username akan otomatis dirapikan
            dan diberi angka di belakang kalau sudah dipakai.
          </p>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
          {formInfo && <p className="text-sm text-primary">{formInfo}</p>}

          <Button onClick={tambahPengguna} disabled={submitting}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Tambah Pengguna
          </Button>
        </CardContent>
      </Card>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-muted-foreground" />
            Daftar Pengguna
          </CardTitle>
          <div className="relative w-full max-w-56">
            <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari username atau role..."
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
                      label="Username"
                      sortKey="username"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableTh
                      label="Role"
                      sortKey="role"
                      activeKey={sortKey}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
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
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        Belum ada pengguna.
                      </td>
                    </tr>
                  ) : (
                    rows.map((item) => {
                      const isEditing = editingId === item.id
                      const isBusy = processingId === item.id

                      if (isEditing) {
                        return (
                          <tr key={item.id}>
                            <td colSpan={4} className="px-4 py-3">
                              <div className="space-y-3">
                                <p className="text-sm font-medium">
                                  {item.username}
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <select
                                    className={selectClass}
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    disabled={isBusy}
                                  >
                                    {roles.map((r) => (
                                      <option key={r.id_role} value={r.id_role}>
                                        {r.nama_role}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    className={selectClass}
                                    value={editAcc}
                                    onChange={(e) =>
                                      setEditAcc(e.target.value as "y" | "n")
                                    }
                                    disabled={isBusy}
                                  >
                                    <option value="y">Aktif</option>
                                    <option value="n">Nonaktif</option>
                                  </select>
                                </div>
                                {editError && (
                                  <p className="text-sm text-destructive">
                                    {editError}
                                  </p>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    disabled={isBusy}
                                    onClick={() => simpanEdit(item.id)}
                                  >
                                    {isBusy ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : null}
                                    Simpan
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isBusy}
                                    onClick={batalEdit}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Batal
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={item.id} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5 font-medium">
                            {item.username}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className="capitalize">
                              {item.role?.nama_role || "-"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant={item.acc === "y" ? "default" : "secondary"}>
                              {item.acc === "y" ? "Aktif" : "Nonaktif"}
                            </Badge>
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
    </div>
  )
}
