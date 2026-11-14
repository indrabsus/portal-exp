"use client"

import { useEffect, useState } from "react"
import { Award, Loader2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Sertifikat = {
  id_sertifikat: string
  nomor_sertifikat: string
  judul_manual: string
  tipe_sertifikat?: "kompetensi" | "mengikuti" | string | null
  keterangan_custom?: string | null
  jurusan: string | null
  nilai: number | null
  daftar_nilai?: { kompetensi: string; nilai: number }[] | null
  kode_verifikasi: string
  nama_kajur: string | null
  status: "aktif" | "dicabut"
  created_at: string
}

export default function SertifikatSiswaPage() {
  const [data, setData] = useState<Sertifikat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch("/sertifikat/siswa")
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
        <h1 className="text-2xl font-bold tracking-tight">Sertifikat</h1>
        <p className="text-sm text-muted-foreground">Sertifikat kompetensi yang sudah Anda dapatkan ({data.length} total).</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : data.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground shadow-sm">Belum ada sertifikat yang diterbitkan.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <Card key={item.id_sertifikat} className="shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Award className="size-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.tipe_sertifikat === "mengikuti" ? (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                        Pelatihan
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                        Kompetensi
                      </Badge>
                    )}
                    <Badge variant={item.status === "aktif" ? "default" : "destructive"}>
                      {item.status === "aktif" ? "Aktif" : "Dicabut"}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-base mt-2">{item.judul_manual}</CardTitle>
                <p className="font-mono text-xs text-muted-foreground">{item.nomor_sertifikat}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                {Array.isArray(item.daftar_nilai) && item.daftar_nilai.length > 0 && (
                  <div className="rounded-md border border-border p-2 bg-muted/30">
                    <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                      Materi / Kompetensi:
                    </p>
                    <div className="divide-y divide-border text-xs">
                      {item.daftar_nilai.map((d, i) => (
                        <div key={i} className="flex justify-between py-0.5">
                          <span>{d.kompetensi}</span>
                          <span className="font-mono font-bold text-foreground">{d.nilai}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {item.nilai !== null && (
                  <p className="font-medium text-foreground">
                    Nilai Akhir: <span className="font-bold">{item.nilai}</span>
                  </p>
                )}
                <p>Diterbitkan: {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="font-mono text-xs">Kode verifikasi: {item.kode_verifikasi}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
