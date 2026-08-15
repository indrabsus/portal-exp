"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Search, Sparkles, X } from "lucide-react"

import { apiFetch } from "@/lib/api"
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
  nama_siswa: string
  kelas_nama: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu ACC",
  approved: "Disetujui",
  rejected: "Ditolak",
}

const FILTER_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu ACC" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
]

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

export default function InovasiSiswaPage() {
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/project-siswa/kajur")
      setRows(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch("/project-siswa/kajur")
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

  const filtered = rows.filter(
    (r) =>
      (statusFilter === "all" || r.status === statusFilter) &&
      (r.nama_project.toLowerCase().includes(search.toLowerCase()) ||
        r.nama_siswa.toLowerCase().includes(search.toLowerCase()) ||
        (r.kelas_nama ?? "").toLowerCase().includes(search.toLowerCase()))
  )

  const review = async (row: ProjectRow, status: "approved" | "rejected") => {
    let catatan = ""

    if (status === "rejected") {
      catatan = window.prompt(`Catatan penolakan untuk "${row.nama_project}" (opsional):`) || ""
    }

    setProcessingId(row.id_project)

    try {
      await apiFetch(`/project-siswa/${row.id_project}/review`, {
        method: "PUT",
        body: JSON.stringify({ status, catatan_kajur: catatan }),
      })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal memproses review.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project & Inovasi Siswa</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} project/inovasi dibagikan siswa jurusan Anda.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari project, siswa, atau kelas..."
            className="pl-8"
          />
        </div>
        <select
          className={selectClass + " sm:w-48"}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground shadow-sm">
          Belum ada project/inovasi siswa.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => {
            const isBusy = processingId === row.id_project
            return (
              <Card key={row.id_project} className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
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
                  <p className="text-xs text-muted-foreground">
                    {row.nama_siswa} &middot; {row.kelas_nama ?? "-"}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
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
                  <p className="line-clamp-3 text-sm text-muted-foreground">{row.deskripsi ?? "-"}</p>

                  <div className="flex justify-end gap-2 border-t border-border pt-3">
                    {row.status !== "approved" && (
                      <Button size="sm" disabled={isBusy} onClick={() => review(row, "approved")}>
                        {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        ACC
                      </Button>
                    )}
                    {row.status !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => review(row, "rejected")}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                        Tolak
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
