"use client"

import { useEffect, useState } from "react"
import { BookOpen, Loader2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Materi = {
  id_materi: string
  judul: string
  deskripsi: string | null
  tanggal: string
  pengajaran?: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } }
}

export default function MateriSiswaPage() {
  const [data, setData] = useState<Materi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch("/materi-ajar/siswa")
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
        <h1 className="text-2xl font-bold tracking-tight">Materi</h1>
        <p className="text-sm text-muted-foreground">Materi ajar dari guru untuk kelas Anda.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : data.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground shadow-sm">Belum ada materi yang dibagikan.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <Card key={item.id_materi} className="shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </div>
                <CardTitle className="text-base">{item.judul}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {item.pengajaran?.mapel?.nama_pelajaran || "-"} · {item.pengajaran?.tingkat} {item.pengajaran?.nama_kelas}
                </p>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{item.deskripsi || "-"}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
