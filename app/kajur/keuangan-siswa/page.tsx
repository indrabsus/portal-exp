"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CalendarClock,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  Wallet,
} from "lucide-react"

import { apiFetch } from "@/lib/api"
import { formatRupiah } from "@/lib/utils"
import { Modal } from "@/components/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Kategori = {
  id_kategori: string
  nama_kategori: string
  deskripsi: string | null
  target_nominal: number
  target_tingkat: string
  tenggat: string | null
  status: "aktif" | "selesai" | "dibatalkan"
  jumlah_siswa: number
  jumlah_lunas: number
  total_terkumpul: number
  target_keseluruhan: number
}

const STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
}

const TINGKAT_OPTIONS = ["10", "11", "12"]

function labelTingkat(csv: string) {
  const list = csv.split(",").map((t) => t.trim()).filter(Boolean)
  if (list.length === TINGKAT_OPTIONS.length) return "Semua Tingkat"
  return `Kelas ${list.join(", ")}`
}

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

export default function KeuanganSiswaPage() {
  const [data, setData] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Kategori | null>(null)
  const [namaKategori, setNamaKategori] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [targetNominal, setTargetNominal] = useState("")
  const [targetTingkat, setTargetTingkat] = useState<string[]>(TINGKAT_OPTIONS)
  const [tenggat, setTenggat] = useState("")
  const [status, setStatus] = useState<"aktif" | "selesai" | "dibatalkan">("aktif")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/keuangan-siswa/kategori")
      setData(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch("/keuangan-siswa/kategori")
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
    setEditing(null)
    setNamaKategori("")
    setDeskripsi("")
    setTargetNominal("")
    setTargetTingkat(TINGKAT_OPTIONS)
    setTenggat("")
    setStatus("aktif")
    setFormError(null)
    setFormOpen(true)
  }

  const bukaEdit = (item: Kategori) => {
    setEditing(item)
    setNamaKategori(item.nama_kategori)
    setDeskripsi(item.deskripsi || "")
    setTargetNominal(String(item.target_nominal))
    setTargetTingkat(item.target_tingkat.split(",").map((t) => t.trim()).filter(Boolean))
    setTenggat(item.tenggat || "")
    setStatus(item.status)
    setFormError(null)
    setFormOpen(true)
  }

  const toggleTingkat = (tingkat: string) => {
    setTargetTingkat((prev) =>
      prev.includes(tingkat) ? prev.filter((t) => t !== tingkat) : [...prev, tingkat]
    )
  }

  const submit = async () => {
    setFormError(null)

    const target = Number(targetNominal)

    if (!namaKategori.trim()) {
      setFormError("Nama kategori wajib diisi.")
      return
    }

    if (!Number.isFinite(target) || target <= 0) {
      setFormError("Target nominal harus lebih dari 0.")
      return
    }

    if (targetTingkat.length === 0) {
      setFormError("Pilih minimal satu tingkat kelas.")
      return
    }

    setSubmitting(true)

    const payload = {
      nama_kategori: namaKategori.trim(),
      deskripsi: deskripsi.trim(),
      target_nominal: target,
      target_tingkat: targetTingkat,
      tenggat,
      ...(editing ? { status } : {}),
    }

    try {
      if (editing) {
        await apiFetch(`/keuangan-siswa/kategori/${editing.id_kategori}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch("/keuangan-siswa/kategori", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }
      setFormOpen(false)
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan kategori.")
    } finally {
      setSubmitting(false)
    }
  }

  const hapus = async (item: Kategori) => {
    if (!window.confirm(`Hapus kategori "${item.nama_kategori}"? Aksi ini tidak bisa dibatalkan.`)) return

    setProcessingId(item.id_kategori)

    try {
      await apiFetch(`/keuangan-siswa/kategori/${item.id_kategori}`, { method: "DELETE" })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus kategori.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keuangan Siswa</h1>
          <p className="text-sm text-muted-foreground">
            Kelola target iuran (mis. baju jurusan, study tour) dan lacak progres pembayaran siswa jurusan Anda.
          </p>
        </div>
        <Button onClick={bukaTambah}>
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : data.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground shadow-sm">
          Belum ada kategori keuangan. Klik &quot;Tambah Kategori&quot; untuk membuat yang pertama.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => {
            const persen =
              item.target_keseluruhan > 0
                ? Math.min(Math.round((item.total_terkumpul / item.target_keseluruhan) * 100), 100)
                : 0
            const isBusy = processingId === item.id_kategori

            return (
              <Card key={item.id_kategori} className="flex flex-col gap-3 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Wallet className="size-5" />
                    </div>
                    <Badge variant={item.status === "aktif" ? "default" : item.status === "dibatalkan" ? "destructive" : "secondary"}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{item.nama_kategori}</CardTitle>
                  <p className="text-xs font-medium text-primary">{labelTingkat(item.target_tingkat)}</p>
                  {item.deskripsi && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.deskripsi}</p>
                  )}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Terkumpul</span>
                      <span className="font-semibold">{persen}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${persen}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatRupiah(item.total_terkumpul)}</span>
                      <span>dari {formatRupiah(item.target_keseluruhan)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {item.jumlah_lunas} / {item.jumlah_siswa} siswa lunas
                    </span>
                    <span className="flex items-center gap-1.5">
                      {formatRupiah(item.target_nominal)} / siswa
                    </span>
                  </div>

                  {item.tenggat && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      Tenggat {new Date(item.tenggat).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                    <Link href={`/kajur/keuangan-siswa/${item.id_kategori}`}>
                      <Button size="sm">Kelola Pembayaran</Button>
                    </Link>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => bukaEdit(item)} aria-label="Edit">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isBusy}
                        onClick={() => hapus(item)}
                        className="text-destructive hover:bg-destructive/10"
                        aria-label="Hapus"
                      >
                        {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {formOpen && (
        <Modal title={editing ? "Edit Kategori Keuangan" : "Tambah Kategori Keuangan"} onClose={() => setFormOpen(false)}>
          <div className="space-y-3">
            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nama Kategori</label>
              <Input
                value={namaKategori}
                onChange={(e) => setNamaKategori(e.target.value)}
                placeholder="mis. Pembuatan Baju Jurusan"
                disabled={submitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Deskripsi (opsional)</label>
              <textarea
                className={textareaClass}
                rows={2}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Target Nominal / Siswa (Rp)</label>
                <Input
                  type="number"
                  min={0}
                  value={targetNominal}
                  onChange={(e) => setTargetNominal(e.target.value)}
                  placeholder="150000"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tenggat (opsional)</label>
                <Input
                  type="date"
                  value={tenggat}
                  onChange={(e) => setTenggat(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Berlaku untuk Tingkat</label>
              <div className="flex gap-2">
                {TINGKAT_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTingkat(t)}
                    disabled={submitting}
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      targetTingkat.includes(t)
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Kelas {t}
                  </button>
                ))}
              </div>
            </div>

            {editing && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  className={selectClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "aktif" | "selesai" | "dibatalkan")}
                  disabled={submitting}
                >
                  <option value="aktif">Aktif</option>
                  <option value="selesai">Selesai</option>
                  <option value="dibatalkan">Dibatalkan</option>
                </select>
              </div>
            )}

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
