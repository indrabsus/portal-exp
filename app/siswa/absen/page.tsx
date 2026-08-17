"use client"

import { useEffect, useState } from "react"
import { CalendarRange, ClipboardList, Loader2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

type AbsenHarian = {
  id_harian: string
  status: "0" | "1" | "2" | "3" | "4"
  waktu: string
}

type AbsenKelas = {
  id_detail: string
  status: "hadir" | "sakit" | "izin" | "alpa"
  keterangan: string | null
  absen_kelas?: {
    tanggal: string
    pengajaran?: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } }
  }
}

const STATUS_HARIAN_LABEL: Record<string, string> = {
  "0": "Masuk",
  "1": "Dispen",
  "2": "Sakit",
  "3": "Izin",
  "4": "Pulang",
}

const STATUS_KELAS_LABEL: Record<string, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpa: "Alpa",
}

const STATUS_KELAS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  hadir: "default",
  sakit: "secondary",
  izin: "outline",
  alpa: "destructive",
}

export default function AbsenSiswaPage() {
  const [harian, setHarian] = useState<AbsenHarian[]>([])
  const [perMapel, setPerMapel] = useState<AbsenKelas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([apiFetch("/presensi/siswa/riwayat-harian"), apiFetch("/absen-kelas/siswa/riwayat")])
      .then(([harianRes, kelasRes]) => {
        if (cancelled) return
        setHarian(harianRes.data || [])
        setPerMapel(kelasRes.data || [])
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
        <h1 className="text-2xl font-bold tracking-tight">Absen</h1>
        <p className="text-sm text-muted-foreground">Riwayat kehadiran Anda.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : (
        <>
          <Card className="dashboard-card overflow-hidden py-0">
            <CardHeader className="flex flex-row items-center gap-2 border-b border-border py-4">
              <CalendarRange className="w-4 h-4 text-muted-foreground" />
              <CardTitle>Absen Harian (Scan Kartu)</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tanggal</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Jam</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {harian.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Belum ada riwayat absen harian.
                      </td>
                    </tr>
                  ) : (
                    harian.map((row) => (
                      <tr key={row.id_harian} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5">
                          {new Date(row.waktu).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {new Date(row.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-2.5">{STATUS_HARIAN_LABEL[row.status] || row.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="dashboard-card overflow-hidden py-0">
            <CardHeader className="flex flex-row items-center gap-2 border-b border-border py-4">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <CardTitle>Absen per Mata Pelajaran</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tanggal</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Mapel</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {perMapel.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Belum ada riwayat absen per mata pelajaran.
                      </td>
                    </tr>
                  ) : (
                    perMapel.map((row) => (
                      <tr key={row.id_detail} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5">
                          {row.absen_kelas?.tanggal
                            ? new Date(row.absen_kelas.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                            : "-"}
                        </td>
                        <td className="px-4 py-2.5">{row.absen_kelas?.pengajaran?.mapel?.nama_pelajaran || "-"}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={STATUS_KELAS_BADGE[row.status]}>{STATUS_KELAS_LABEL[row.status]}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.keterangan || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
