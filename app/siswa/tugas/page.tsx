"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Loader2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Tugas = {
  id_tugas: string
  judul: string
  deadline: string | null
  jumlah_soal: number
  status_pengerjaan: "belum" | "dikerjakan" | "selesai" | "dinilai"
  nilai: number | null
  pengajaran?: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } }
}

const STATUS_LABEL: Record<string, string> = {
  belum: "Belum Dikerjakan",
  dikerjakan: "Sedang Dikerjakan",
  selesai: "Menunggu Penilaian",
  dinilai: "Sudah Dinilai",
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  belum: "outline",
  dikerjakan: "secondary",
  selesai: "secondary",
  dinilai: "default",
}

function lewatDeadline(deadline: string | null) {
  return !!deadline && new Date(deadline).getTime() < Date.now()
}

export default function TugasSiswaPage() {
  const [data, setData] = useState<Tugas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch("/tugas-siswa")
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
        <h1 className="text-2xl font-bold tracking-tight">Tugas</h1>
        <p className="text-sm text-muted-foreground">Tugas aktif dari guru untuk kelas Anda.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : data.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground shadow-sm">Belum ada tugas aktif.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => {
            const kadaluarsa = lewatDeadline(item.deadline) && item.status_pengerjaan === "belum"
            return (
              <Link key={item.id_tugas} href={`/siswa/tugas/${item.id_tugas}`}>
                <Card className="h-full shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-5" />
                      </div>
                      <Badge variant={kadaluarsa ? "destructive" : STATUS_BADGE[item.status_pengerjaan]}>
                        {kadaluarsa ? "Tenggat Lewat" : STATUS_LABEL[item.status_pengerjaan]}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{item.judul}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {item.pengajaran?.mapel?.nama_pelajaran || "-"} · {item.jumlah_soal} soal
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {item.deadline && (
                      <p>
                        Tenggat: {new Date(item.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    {item.nilai !== null && <p className="font-semibold text-foreground">Nilai: {item.nilai}</p>}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
