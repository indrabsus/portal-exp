"use client"

import { useEffect, useState } from "react"
import { CalendarClock, CheckCircle2, Clock, Loader2, Printer, XCircle } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { cn } from "@/lib/utils"
import { printPortraitA4 } from "@/lib/print-portrait"
import { KopSuratPrint } from "@/components/kop-surat-print"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type RekapRow = {
  tanggal: string
  hari: string
  status: string
  jam_datang: string | null
  jam_pulang: string | null
  terlambat: boolean
  keterangan: string | null
}

const BULAN_OPTIONS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
]

const STATUS_STYLE: Record<string, string> = {
  hadir: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  izin: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  sakit: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  dispen: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  alpa: "bg-destructive/10 text-destructive",
  tidak_ada_data: "bg-muted text-muted-foreground",
}

const STATUS_LABEL: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  dispen: "Dispen",
  alpa: "Alpa",
  tidak_ada_data: "Tidak Ada Data",
}

const KOORDINATOR_PKG_NAMA = "Moch Nafsir S.PdI"
const KOTA_SEKOLAH = "Cimahi"

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

function tahunOptions() {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear + 1; y >= currentYear - 3; y--) years.push(y)
  return years
}

function formatTanggalCetak(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}-${m}-${y}`
}

function jamCellCetak(row: RekapRow, field: "jam_datang" | "jam_pulang") {
  const value = row[field]
  if (value) return value
  if (row.status === "tidak_ada_data") return "-"
  return row.status.replace(/_/g, " ").toUpperCase()
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_STYLE[status] ?? "bg-muted text-muted-foreground"}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  )
}

export default function AbsenGuruPage() {
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
  const [namaLengkap, setNamaLengkap] = useState("")
  const [uidFp, setUidFp] = useState<number | null>(null)
  const [rows, setRows] = useState<RekapRow[]>([])
  const [loadingUid, setLoadingUid] = useState(true)
  const [loadingRekap, setLoadingRekap] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch("/presensi/uid-saya")
      .then((res) => {
        if (cancelled) return
        setNamaLengkap(res.data?.nama_lengkap || "")
        setUidFp(res.data?.uid_fp ?? null)
        if (!res.data?.uid_fp) {
          setError("UID fingerprint belum diatur untuk akun Anda. Hubungi admin untuk melengkapi data ini.")
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat data akun.")
      })
      .finally(() => {
        if (!cancelled) setLoadingUid(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!uidFp) return

    let cancelled = false

    apiFetch(`/presensi/rekap-kehadiran/${uidFp}?bulan=${bulan}&tahun=${tahun}`)
      .then((res) => {
        if (cancelled) return
        if (res.status !== "success") {
          setError(res.message || "Gagal mengambil data absensi dari server.")
          return
        }
        setRows(res.data || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal mengambil data absensi dari server.")
      })
      .finally(() => {
        if (!cancelled) setLoadingRekap(false)
      })

    return () => {
      cancelled = true
    }
  }, [uidFp, bulan, tahun])

  const bulanLabel = BULAN_OPTIONS.find((b) => b.value === String(bulan))?.label ?? ""

  const totalHadir = rows.filter((r) => r.status === "hadir").length
  const totalTerlambat = rows.filter((r) => r.terlambat).length
  const totalIzin = rows.filter((r) => r.status === "izin" || r.status === "sakit" || r.status === "dispen").length
  const totalTanpaKeterangan = rows.filter((r) => r.status === "alpa" || r.status === "tidak_ada_data").length

  const summaryCards = [
    { label: "Hadir", value: totalHadir, icon: CheckCircle2 },
    { label: "Terlambat", value: totalTerlambat, icon: Clock },
    { label: "Izin/Sakit", value: totalIzin, icon: CalendarClock },
    { label: "Tanpa Keterangan", value: totalTanpaKeterangan, icon: XCircle },
  ]

  const tanggalCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  const loading = loadingUid || (Boolean(uidFp) && loadingRekap)

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Absen</h1>
          <p className="text-sm text-muted-foreground">Rekap kehadiran fingerprint Anda per bulan.</p>
        </div>

        <Card className="dashboard-card">
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className={selectClass + " sm:w-44"}
                value={bulan}
                onChange={(e) => {
                  setLoadingRekap(true)
                  setBulan(Number(e.target.value))
                }}
                disabled={loading}
              >
                {BULAN_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>

              <select
                className={selectClass + " sm:w-32"}
                value={tahun}
                onChange={(e) => {
                  setLoadingRekap(true)
                  setTahun(Number(e.target.value))
                }}
                disabled={loading}
              >
                {tahunOptions().map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              {loading && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Memuat data...
                </span>
              )}
            </div>

            {!error && (
              <Button onClick={() => printPortraitA4()} disabled={loading}>
                <Printer className="w-4 h-4" />
                Cetak PDF
              </Button>
            )}
          </CardContent>
        </Card>

        {error ? (
          <Card className="dashboard-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">{error}</CardContent>
          </Card>
        ) : (
          <div className={cn("flex flex-col gap-4 transition-opacity", loading && "pointer-events-none opacity-50")}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {summaryCards.map((card) => (
                <Card key={card.label} className="dashboard-card">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <card.icon className="size-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="dashboard-card overflow-hidden py-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tanggal</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Hari</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Jam Datang</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Jam Pulang</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Status</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          Belum ada data absensi.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={row.tanggal} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5">{row.tanggal}</td>
                          <td className="px-4 py-2.5">{row.hari}</td>
                          <td className={cn("px-4 py-2.5", row.terlambat && "font-semibold text-red-600 dark:text-red-500")}>
                            {row.jam_datang ?? "-"}
                          </td>
                          <td className="px-4 py-2.5">{row.jam_pulang ?? "-"}</td>
                          <td className="px-4 py-2.5">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-2.5">{row.keterangan ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {!error && (
        <div className="print-exact sr-only bg-white text-black print:not-sr-only">
          <KopSuratPrint />

          <p className="mt-4 text-center text-base font-bold">Rekap Kehadiran Guru</p>

          <div className="mt-4 mb-3 text-sm">
            <p>Nama : {namaLengkap}</p>
            <p>
              Bulan : {bulanLabel} {tahun}
            </p>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1">Tanggal</th>
                <th className="border border-black px-2 py-1">Hari</th>
                <th className="border border-black px-2 py-1">Jam Datang</th>
                <th className="border border-black px-2 py-1">Jam Pulang</th>
                <th className="border border-black px-2 py-1">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.tanggal}>
                  <td className="border border-black px-2 py-1 text-center">{formatTanggalCetak(row.tanggal)}</td>
                  <td className="border border-black px-2 py-1 text-center">{row.hari}</td>
                  <td className={cn("border border-black px-2 py-1 text-center", row.terlambat && "font-bold text-red-600")}>
                    {jamCellCetak(row, "jam_datang")}
                  </td>
                  <td className="border border-black px-2 py-1 text-center">{jamCellCetak(row, "jam_pulang")}</td>
                  <td className="border border-black px-2 py-1">{row.keterangan ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-10 flex justify-end">
            <div className="text-center text-sm">
              <p>
                {KOTA_SEKOLAH}, {tanggalCetak}
              </p>
              <p>Koordinator PKG</p>
              <div className="h-16" />
              <p className="font-semibold">{KOORDINATOR_PKG_NAMA}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
