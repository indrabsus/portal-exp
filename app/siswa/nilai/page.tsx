"use client"

import { useEffect, useState } from "react"
import { Loader2, NotebookPen } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type NilaiRow = {
  id_nilai_manual: string
  judul: string
  semester: "ganjil" | "genap"
  created_at: string
  pengajaran?: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } }
  nilai: number | null
}

export default function NilaiSiswaPage() {
  const [data, setData] = useState<NilaiRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch("/nilai-manual/siswa")
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

  const nilaiTerisi = data.map((d) => d.nilai).filter((n): n is number => n !== null)
  const rataRata = nilaiTerisi.length
    ? Math.round((nilaiTerisi.reduce((a, b) => a + b, 0) / nilaiTerisi.length) * 100) / 100
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nilai</h1>
        <p className="text-sm text-muted-foreground">
          Nilai dari guru untuk penilaian di luar portal (ulangan, praktik, dll)
          {rataRata !== null ? ` · Rata-rata keseluruhan: ${rataRata}` : ""}.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center gap-2 border-b border-border py-4">
          <NotebookPen className="w-4 h-4 text-muted-foreground" />
          <CardTitle>Daftar Nilai</CardTitle>
        </CardHeader>

        {loading ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Judul</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Mapel</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Semester</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Belum ada nilai yang diberikan.
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.id_nilai_manual} className="hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-medium">{row.judul}</td>
                      <td className="px-4 py-2.5">{row.pengajaran?.mapel?.nama_pelajaran || "-"}</td>
                      <td className="px-4 py-2.5 capitalize text-muted-foreground">{row.semester}</td>
                      <td className="px-4 py-2.5">
                        {row.nilai !== null ? (
                          <Badge variant={row.nilai >= 75 ? "default" : "destructive"}>{row.nilai}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Belum dinilai</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
