"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react"

import { apiFetch } from "@/lib/api"
import { formatRupiah } from "@/lib/utils"
import { useTableControls } from "@/lib/use-table-controls"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SortableTh } from "@/components/sortable-th"
import { TablePagination } from "@/components/table-pagination"

type Kategori = {
  id_kategori: string
  nama_kategori: string
  deskripsi: string | null
  target_nominal: number
  target_tingkat: string
  tenggat: string | null
  status: "aktif" | "selesai" | "dibatalkan"
}

const TINGKAT_OPTIONS = ["10", "11", "12"]

function labelTingkat(csv: string) {
  const list = csv.split(",").map((t) => t.trim()).filter(Boolean)
  if (list.length === TINGKAT_OPTIONS.length) return "Semua Tingkat"
  return `Kelas ${list.join(", ")}`
}

type SiswaRow = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  kelas: string
  total_dibayar: number
  sisa: number
  status: "lunas" | "sebagian" | "belum"
}

type PembayaranRow = {
  id_pembayaran: string
  nominal: number
  tanggal_bayar: string
  keterangan: string | null
  nama_pencatat: string | null
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  lunas: { label: "Lunas", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  sebagian: { label: "Sebagian", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  belum: { label: "Belum Bayar", className: "bg-destructive/10 text-destructive" },
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

const SEMUA_KELAS = "__semua__"
const SEMUA_STATUS = "__semua__"

export default function KeuanganKategoriDetailPage() {
  const params = useParams<{ id: string }>()
  const [kategori, setKategori] = useState<Kategori | null>(null)
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaRow | null>(null)
  const [filterKelas, setFilterKelas] = useState(SEMUA_KELAS)
  const [filterStatus, setFilterStatus] = useState(SEMUA_STATUS)

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch(`/keuangan-siswa/kategori/${params.id}/siswa`)
      setKategori(res.data.kategori)
      setSiswaList(res.data.siswa || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch(`/keuangan-siswa/kategori/${params.id}/siswa`)
      .then((res) => {
        if (cancelled) return
        setKategori(res.data.kategori)
        setSiswaList(res.data.siswa || [])
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
  }, [params.id])

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas))).sort()

  const siswaTerfilter = siswaList.filter(
    (s) =>
      (filterKelas === SEMUA_KELAS || s.kelas === filterKelas) &&
      (filterStatus === SEMUA_STATUS || s.status === filterStatus)
  )

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
      if (key === "dibayar") return row.total_dibayar
      if (key === "sisa") return row.sisa
      if (key === "status") return row.status
      return null
    },
    initialSortKey: "nama",
  })

  const totalTerkumpul = siswaList.reduce((sum, s) => sum + s.total_dibayar, 0)
  const targetKeseluruhan = (kategori?.target_nominal || 0) * siswaList.length
  const jumlahLunas = siswaList.filter((s) => s.status === "lunas").length
  const persen = targetKeseluruhan > 0 ? Math.min(Math.round((totalTerkumpul / targetKeseluruhan) * 100), 100) : 0

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat data...
      </div>
    )
  }

  if (error || !kategori) {
    return <p className="text-sm text-destructive">{error || "Kategori tidak ditemukan."}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/kajur/keuangan-siswa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Keuangan Siswa
        </Link>
      </div>

      <Card className="dashboard-card overflow-hidden">
        <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{kategori.nama_kategori}</h1>
              <p className="mt-0.5 text-xs font-medium text-primary">{labelTingkat(kategori.target_tingkat)}</p>
              {kategori.deskripsi && <p className="mt-0.5 text-sm text-muted-foreground">{kategori.deskripsi}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{formatRupiah(kategori.target_nominal)} / siswa</span>
                {kategori.tenggat && (
                  <span className="flex items-center gap-1">
                    <CalendarClock className="size-3.5" />
                    Tenggat {new Date(kategori.tenggat).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full space-y-1.5 sm:w-64">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{jumlahLunas} / {siswaList.length} siswa lunas</span>
              <span className="font-semibold">{persen}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${persen}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatRupiah(totalTerkumpul)}</span>
              <span>dari {formatRupiah(targetKeseluruhan)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle>Daftar Siswa</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select className={selectClass + " w-auto"} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
              <option value={SEMUA_STATUS}>Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="sebagian">Sebagian</option>
              <option value="belum">Belum Bayar</option>
            </select>
            <select className={selectClass + " w-auto"} value={filterKelas} onChange={(e) => { setFilterKelas(e.target.value); setPage(1) }}>
              <option value={SEMUA_KELAS}>Semua Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <div className="relative w-full max-w-56">
              <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau NISN..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <SortableTh label="Nama Siswa" sortKey="nama" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Kelas" sortKey="kelas" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Dibayar" sortKey="dibayar" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Sisa" sortKey="sisa" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Tidak ada siswa yang cocok.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const badge = STATUS_BADGE[row.status]
                  return (
                    <tr key={row.id_siswa} className="hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-medium">{row.nama_lengkap}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.kelas}</td>
                      <td className="px-4 py-2.5">{formatRupiah(row.total_dibayar)}</td>
                      <td className="px-4 py-2.5">{row.sisa > 0 ? formatRupiah(row.sisa) : "-"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {row.status === "lunas" ? <CheckCircle2 className="w-3 h-3" /> : <CircleDashed className="w-3 h-3" />}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" onClick={() => setSelectedSiswa(row)}>
                            <Plus className="w-3.5 h-3.5" />
                            Catat Pembayaran
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
      </Card>

      {selectedSiswa && kategori && (
        <PembayaranModal
          siswa={selectedSiswa}
          idKategori={kategori.id_kategori}
          onClose={() => setSelectedSiswa(null)}
          onChanged={muatData}
        />
      )}
    </div>
  )
}

function PembayaranModal({
  siswa,
  idKategori,
  onClose,
  onChanged,
}: {
  siswa: SiswaRow
  idKategori: string
  onClose: () => void
  onChanged: () => void
}) {
  const [riwayat, setRiwayat] = useState<PembayaranRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const todayIso = new Date().toISOString().slice(0, 10)
  const [nominal, setNominal] = useState("")
  const [tanggalBayar, setTanggalBayar] = useState(todayIso)
  const [keterangan, setKeterangan] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

  const muatRiwayat = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch(`/keuangan-siswa/pembayaran/${idKategori}/${siswa.id_siswa}`)
      setRiwayat(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat pembayaran.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch(`/keuangan-siswa/pembayaran/${idKategori}/${siswa.id_siswa}`)
      .then((res) => {
        if (!cancelled) setRiwayat(res.data || [])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat riwayat pembayaran.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [idKategori, siswa.id_siswa])

  const submit = async () => {
    setFormError(null)
    const n = Number(nominal)

    if (!Number.isFinite(n) || n <= 0) {
      setFormError("Nominal harus lebih dari 0.")
      return
    }

    if (!tanggalBayar) {
      setFormError("Tanggal bayar wajib diisi.")
      return
    }

    setSubmitting(true)

    try {
      await apiFetch("/keuangan-siswa/pembayaran", {
        method: "POST",
        body: JSON.stringify({
          id_kategori: idKategori,
          id_siswa: siswa.id_siswa,
          nominal: n,
          tanggal_bayar: tanggalBayar,
          keterangan: keterangan.trim(),
        }),
      })
      setNominal("")
      setKeterangan("")
      await muatRiwayat()
      onChanged()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal mencatat pembayaran.")
    } finally {
      setSubmitting(false)
    }
  }

  const hapus = async (row: PembayaranRow) => {
    if (!window.confirm("Hapus catatan pembayaran ini? Aksi ini tidak bisa dibatalkan.")) return

    setProcessingId(row.id_pembayaran)

    try {
      await apiFetch(`/keuangan-siswa/pembayaran/${row.id_pembayaran}`, { method: "DELETE" })
      await muatRiwayat()
      onChanged()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus catatan pembayaran.")
    } finally {
      setProcessingId(null)
    }
  }

  const totalTerbayar = riwayat.reduce((sum, r) => sum + r.nominal, 0)

  return (
    <Modal title={`Pembayaran - ${siswa.nama_lengkap}`} onClose={onClose} maxWidthClassName="max-w-xl">
      <div className="space-y-4">
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nominal (Rp)</label>
              <Input
                type="number"
                min={0}
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder="50000"
                disabled={submitting}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tanggal Bayar</label>
              <Input
                type="date"
                value={tanggalBayar}
                onChange={(e) => setTanggalBayar(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Keterangan (opsional)</label>
            <Input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="mis. Cicilan 1"
              disabled={submitting}
            />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <Button onClick={submit} disabled={submitting} size="sm">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Catat Pembayaran
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat riwayat...
          </div>
        ) : riwayat.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Belum ada pembayaran tercatat.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Riwayat Pembayaran</span>
              <span className="font-semibold text-foreground">Total: {formatRupiah(totalTerbayar)}</span>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {riwayat.map((row) => (
                <div key={row.id_pembayaran} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold">{formatRupiah(row.nominal)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.tanggal_bayar).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      {row.keterangan ? ` · ${row.keterangan}` : ""}
                    </p>
                    {row.nama_pencatat && (
                      <p className="text-xs text-muted-foreground">Dicatat oleh {row.nama_pencatat}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={processingId === row.id_pembayaran}
                    onClick={() => hapus(row)}
                    className="shrink-0 text-destructive hover:bg-destructive/10"
                  >
                    {processingId === row.id_pembayaran ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
