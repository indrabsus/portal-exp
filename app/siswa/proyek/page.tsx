"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Modal } from "@/components/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type ProjectRow = {
  id_project: string
  nama_project: string
  deskripsi: string | null
  link_youtube: string | null
  status: "pending" | "approved" | "rejected"
  catatan_kajur: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu ACC Kajur",
  approved: "Disetujui",
  rejected: "Ditolak",
}

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

export default function ProyekSiswaPage() {
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectRow | null>(null)
  const [namaProject, setNamaProject] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [linkYoutube, setLinkYoutube] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [processingId, setProcessingId] = useState<string | null>(null)

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/project-siswa/siswa")
      setRows(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch("/project-siswa/siswa")
      .then((res) => {
        if (!cancelled) setRows(res.data || [])
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
    setEditing(null)
    setNamaProject("")
    setDeskripsi("")
    setLinkYoutube("")
    setFormError(null)
    setDialogOpen(true)
  }

  const bukaEdit = (row: ProjectRow) => {
    setEditing(row)
    setNamaProject(row.nama_project)
    setDeskripsi(row.deskripsi || "")
    setLinkYoutube(row.link_youtube || "")
    setFormError(null)
    setDialogOpen(true)
  }

  const submit = async () => {
    setFormError(null)

    if (!namaProject.trim()) {
      setFormError("Nama project wajib diisi.")
      return
    }

    setSubmitting(true)

    const body = JSON.stringify({
      nama_project: namaProject.trim(),
      deskripsi: deskripsi.trim(),
      link_youtube: linkYoutube.trim(),
    })

    try {
      if (editing) {
        await apiFetch(`/project-siswa/siswa/${editing.id_project}`, { method: "PUT", body })
      } else {
        await apiFetch("/project-siswa/siswa", { method: "POST", body })
      }
      setDialogOpen(false)
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan project.")
    } finally {
      setSubmitting(false)
    }
  }

  const hapus = async (row: ProjectRow) => {
    if (!window.confirm(`Hapus project "${row.nama_project}"? Aksi ini tidak bisa dibatalkan.`)) {
      return
    }

    setProcessingId(row.id_project)

    try {
      await apiFetch(`/project-siswa/siswa/${row.id_project}`, { method: "DELETE" })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus project.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project & Inovasi Saya</h1>
          <p className="text-sm text-muted-foreground">{rows.length} project dibagikan.</p>
        </div>
        <Button onClick={bukaTambah}>
          <Plus className="w-4 h-4" />
          Tambah Project
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground shadow-sm">
          Belum ada project. Klik &quot;Tambah Project&quot; untuk membagikan karya Anda.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const isBusy = processingId === row.id_project
            return (
              <Card key={row.id_project} className="flex flex-col gap-3 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="size-5" />
                    </div>
                    <Badge variant={row.status === "approved" ? "default" : row.status === "rejected" ? "destructive" : "secondary"}>
                      {STATUS_LABEL[row.status]}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{row.nama_project}</CardTitle>
                  {row.link_youtube && (
                    <a
                      href={row.link_youtube}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Lihat video YouTube
                    </a>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{row.deskripsi ?? "-"}</p>
                  {row.status === "rejected" && row.catatan_kajur && (
                    <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                      Catatan Kajur: {row.catatan_kajur}
                    </p>
                  )}

                  <div className="flex justify-end gap-1 border-t border-border pt-2">
                    <Button variant="ghost" size="icon-sm" onClick={() => bukaEdit(row)} aria-label="Edit">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isBusy}
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => hapus(row)}
                      aria-label="Hapus"
                    >
                      {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {dialogOpen && (
        <Modal title={editing ? "Edit Project" : "Tambah Project"} onClose={() => setDialogOpen(false)}>
          <div className="space-y-3">
            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nama Project / Inovasi</label>
              <Input value={namaProject} onChange={(e) => setNamaProject(e.target.value)} disabled={submitting} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Deskripsi</label>
              <textarea
                className={textareaClass}
                rows={4}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Link YouTube</label>
              <Input
                value={linkYoutube}
                onChange={(e) => setLinkYoutube(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                disabled={submitting}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Simpan
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
