"use client"

import { useEffect, useState } from "react"
import { GraduationCap, Loader2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { formatRupiah } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatusPpdb = {
  siswa: { status: "aktif" | "nonaktif" | "keluar" | "ppdb"; bayar_daftar: "y" | "n"; tahun: number }
  penempatan_kelas: { tingkat: string; nama_kelas: string } | null
  riwayat_pembayaran: { id_log: string; nominal: number; jenis: "d" | "l" | "p"; no_invoice: string; created_at: string }[]
}

const STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif",
  nonaktif: "Nonaktif",
  keluar: "Keluar",
  ppdb: "Proses PPDB",
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  aktif: "default",
  nonaktif: "secondary",
  keluar: "destructive",
  ppdb: "outline",
}

const JENIS_LABEL: Record<string, string> = {
  d: "Biaya Daftar",
  l: "Lainnya",
  p: "Pelunasan",
}

export default function PpdbSiswaPage() {
  const [data, setData] = useState<StatusPpdb | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch("/ppdb/status-siswa")
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat data.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Status PPDB</h1>
        <p className="text-sm text-muted-foreground">Status pendaftaran dan pembayaran biaya masuk Anda.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : (
        data && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="dashboard-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Status Akun</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={STATUS_BADGE[data.siswa.status]} className="text-sm">
                    {STATUS_LABEL[data.siswa.status]}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="dashboard-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Biaya Daftar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={data.siswa.bayar_daftar === "y" ? "default" : "destructive"}>
                    {data.siswa.bayar_daftar === "y" ? "Lunas" : "Belum Bayar"}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="dashboard-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Penempatan Kelas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold tracking-tight">
                    {data.penempatan_kelas ? `${data.penempatan_kelas.tingkat} ${data.penempatan_kelas.nama_kelas}` : "-"}
                  </p>
                  {!data.penempatan_kelas && <p className="text-xs text-muted-foreground">Belum ditempatkan</p>}
                </CardContent>
              </Card>
            </div>

            <Card className="dashboard-card overflow-hidden py-0">
              <CardHeader className="flex flex-row items-center gap-2 border-b border-border py-4">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <CardTitle>Riwayat Pembayaran PPDB</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tanggal</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">No. Invoice</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Jenis</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.riwayat_pembayaran.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          Belum ada riwayat pembayaran.
                        </td>
                      </tr>
                    ) : (
                      data.riwayat_pembayaran.map((row) => (
                        <tr key={row.id_log} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5">
                            {new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.no_invoice}</td>
                          <td className="px-4 py-2.5">{JENIS_LABEL[row.jenis] || row.jenis}</td>
                          <td className="px-4 py-2.5">{formatRupiah(Number(row.nominal))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )
      )}
    </div>
  )
}
