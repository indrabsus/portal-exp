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
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react"

import { apiFetch } from "@/lib/api"
import { formatRupiah } from "@/lib/utils"
import { useTableControls } from "@/lib/use-table-controls"
import { Modal } from "@/components/modal"
import { Badge } from "@/components/ui/badge"
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
  catatan?: string | null
  via?: "cash" | "tf" | "campuran" | null
}

type PembayaranRow = {
  id_pembayaran: string
  nominal: number
  tanggal_bayar: string
  keterangan: string | null
  via?: "cash" | "tf" | string
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
const SEMUA_VIA = "__semua__"

export default function KeuanganKategoriDetailPage() {
  const params = useParams<{ id: string }>()
  const [kategori, setKategori] = useState<Kategori | null>(null)
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaRow | null>(null)
  const [filterKelas, setFilterKelas] = useState(SEMUA_KELAS)
  const [filterStatus, setFilterStatus] = useState(SEMUA_STATUS)
  const [filterVia, setFilterVia] = useState(SEMUA_VIA)

  // Edit Catatan Quick Modal
  const [catatanSiswa, setCatatanSiswa] = useState<SiswaRow | null>(null)
  const [inputCatatan, setInputCatatan] = useState("")
  const [savingCatatan, setSavingCatatan] = useState(false)
  const [catatanError, setCatatanError] = useState<string | null>(null)

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
      (filterStatus === SEMUA_STATUS || s.status === filterStatus) &&
      (filterVia === SEMUA_VIA ||
        (filterVia === "tf" && (s.via === "tf" || s.via === "campuran")) ||
        (filterVia === "cash" && (s.via === "cash" || s.via === "campuran")))
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
    searchFields: (row) => [row.nama_lengkap, row.nisn, row.kelas, row.catatan, row.via],
    getSortValue: (row, key) => {
      if (key === "nama") return row.nama_lengkap
      if (key === "kelas") return row.kelas
      if (key === "dibayar") return row.total_dibayar
      if (key === "sisa") return row.sisa
      if (key === "status") return row.status
      if (key === "via") return row.via || ""
      if (key === "catatan") return row.catatan || ""
      return null
    },
    initialSortKey: "nama",
    initialSortDir: "asc",
  })

  const bukaEditCatatan = (s: SiswaRow) => {
    setCatatanSiswa(s)
    setInputCatatan(s.catatan || "")
    setCatatanError(null)
  }

  const simpanCatatan = async () => {
    if (!catatanSiswa || !kategori) return
    setSavingCatatan(true)
    setCatatanError(null)

    try {
      await apiFetch(`/keuangan-siswa/kategori/${kategori.id_kategori}/siswa/${catatanSiswa.id_siswa}/catatan`, {
        method: "PUT",
        body: JSON.stringify({ catatan: inputCatatan.trim() }),
      })
      setCatatanSiswa(null)
      await muatData()
    } catch (err) {
      setCatatanError(err instanceof Error ? err.message : "Gagal menyimpan catatan.")
    } finally {
      setSavingCatatan(false)
    }
  }

  const totalSiswa = siswaList.length
  const totalLunas = siswaList.filter((s) => s.status === "lunas").length
  const totalTerkumpul = siswaList.reduce((sum, s) => sum + s.total_dibayar, 0)
  const targetTotal = (kategori ? Number(kategori.target_nominal) : 0) * totalSiswa
  const persen = targetTotal > 0 ? Math.min(Math.round((totalTerkumpul / targetTotal) * 100), 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/kajur/keuangan-siswa">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {kategori ? kategori.nama_kategori : "Detail Keuangan"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {kategori ? `${labelTingkat(kategori.target_tingkat)} · Target ${formatRupiah(kategori.target_nominal)} / siswa` : ""}
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {kategori && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Terkumpul</CardTitle>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(totalTerkumpul)}</div>
              <p className="text-xs text-muted-foreground">
                {persen}% dari target {formatRupiah(targetTotal)}
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status Pelunasan</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalLunas} / {totalSiswa}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalSiswa - totalLunas} siswa belum lunas
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tenggat</CardTitle>
              <CalendarClock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kategori.tenggat
                  ? new Date(kategori.tenggat).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                  : "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                Status: <span className="font-semibold">{kategori.status}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle>Daftar Siswa & Pembayaran</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select className={selectClass + " w-auto"} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
              <option value={SEMUA_STATUS}>Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="sebagian">Sebagian</option>
              <option value="belum">Belum Bayar</option>
            </select>
            <select className={selectClass + " w-auto"} value={filterVia} onChange={(e) => { setFilterVia(e.target.value); setPage(1) }}>
              <option value={SEMUA_VIA}>Semua Via</option>
              <option value="cash">Via Cash (Tunai)</option>
              <option value="tf">Via TF (Transfer)</option>
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
                placeholder="Cari nama, NISN, catatan..."
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
                <SortableTh label="Via" sortKey="via" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="Catatan" sortKey="catatan" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
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
                        {row.via === "tf" ? (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
                            TF
                          </Badge>
                        ) : row.via === "cash" ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                            Cash
                          </Badge>
                        ) : row.via === "campuran" ? (
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-semibold">
                            Cash & TF
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 max-w-[220px]">
                        <div className="flex items-center justify-between gap-1 group">
                          <span
                            className={`truncate text-xs ${row.catatan ? "text-foreground font-medium" : "text-muted-foreground italic"}`}
                            title={row.catatan || "Belum ada catatan"}
                          >
                            {row.catatan || "-"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => bukaEditCatatan(row)}
                            title="Ubah catatan"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
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

      {/* Modal Quick Edit Catatan */}
      {catatanSiswa && (
        <Modal
          title={`Catatan - ${catatanSiswa.nama_lengkap}`}
          onClose={() => setCatatanSiswa(null)}
          maxWidthClassName="max-w-md"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Catatan Siswa</label>
              <textarea
                rows={3}
                value={inputCatatan}
                onChange={(e) => setInputCatatan(e.target.value)}
                placeholder="mis. Janji bayar tgl 25, Dispensasi yatim, dll..."
                className="w-full rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                disabled={savingCatatan}
              />
              <p className="text-[11px] text-muted-foreground">
                Catatan ini akan tampil pada kolom Catatan di tabel keuangan siswa kategori ini.
              </p>
            </div>

            {catatanError && <p className="text-sm text-destructive">{catatanError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setCatatanSiswa(null)} disabled={savingCatatan}>
                Batal
              </Button>
              <Button size="sm" onClick={simpanCatatan} disabled={savingCatatan}>
                {savingCatatan ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Simpan Catatan
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
  const [via, setVia] = useState<"cash" | "tf">("cash")
  const [keterangan, setKeterangan] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [catatanInput, setCatatanInput] = useState(siswa.catatan || "")
  const [savingCatatanInline, setSavingCatatanInline] = useState(false)
  const [catatanSaved, setCatatanSaved] = useState(false)

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
          via,
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

  const simpanCatatanModal = async () => {
    setSavingCatatanInline(true)
    try {
      await apiFetch(`/keuangan-siswa/kategori/${idKategori}/siswa/${siswa.id_siswa}/catatan`, {
        method: "PUT",
        body: JSON.stringify({ catatan: catatanInput.trim() }),
      })
      setCatatanSaved(true)
      setTimeout(() => setCatatanSaved(false), 2000)
      onChanged()
    } catch {
      // ignore
    } finally {
      setSavingCatatanInline(false)
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
        {/* Catatan Siswa Section */}
        <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              Catatan Khusus Siswa
            </label>
            {catatanSaved && <span className="text-[11px] text-emerald-600 font-medium">Tersimpan</span>}
          </div>
          <div className="flex gap-2">
            <Input
              value={catatanInput}
              onChange={(e) => setCatatanInput(e.target.value)}
              placeholder="mis. Janji bayar tgl 25, Dispensasi, dll..."
              className="text-xs h-8"
              disabled={savingCatatanInline}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={simpanCatatanModal}
              disabled={savingCatatanInline}
            >
              {savingCatatanInline ? <Loader2 className="w-3 h-3 animate-spin" /> : "Simpan"}
            </Button>
          </div>
        </div>

        {/* Form Catat Pembayaran */}
        <div className="space-y-3 rounded-lg border border-border p-3">
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

          {/* Pilihan Via (Cash / TF) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Metode Pembayaran (Via)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVia("cash")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 text-xs font-semibold transition-colors ${
                  via === "cash"
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                Cash (Tunai)
              </button>
              <button
                type="button"
                onClick={() => setVia("tf")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 text-xs font-semibold transition-colors ${
                  via === "tf"
                    ? "border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                TF (Transfer)
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Keterangan (opsional)</label>
            <Input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="mis. Cicilan 1 / Rekening / Bukti transfer"
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
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{formatRupiah(row.nominal)}</p>
                      {row.via === "tf" ? (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
                          TF
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          Cash
                        </Badge>
                      )}
                    </div>
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
