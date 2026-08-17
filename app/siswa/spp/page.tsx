"use client"

import { useEffect, useState } from "react"
import { CreditCard, Loader2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { formatRupiah } from "@/lib/utils"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

type LogSpp = {
  id_logspp: string
  keterangan: string
  kelas: number
  nominal: number
  bayar_label: string
  created_at: string
}

export default function SppSiswaPage() {
  const [data, setData] = useState<LogSpp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch("/spp/siswa/status")
      .then((res) => {
        if (!cancelled) setData(res.data || [])
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
        <h1 className="text-2xl font-bold tracking-tight">Status SPP</h1>
        <p className="text-sm text-muted-foreground">Riwayat pembayaran SPP, daftar ulang, PKL, dan ujian akhir Anda.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center gap-2 border-b border-border py-4">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <CardTitle>Log Pembayaran</CardTitle>
        </CardHeader>

        {loading ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat data...
          </div>
        ) : data.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Belum ada riwayat pembayaran.</p>
        ) : (
          <div className="divide-y divide-border">
            {data.map((log) => (
              <div key={log.id_logspp} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {log.keterangan} / Kelas {log.kelas}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {log.bayar_label}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{formatRupiah(log.nominal)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
