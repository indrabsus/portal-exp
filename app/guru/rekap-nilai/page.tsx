"use client"

import { useEffect, useState } from "react"
import { ClipboardList, Loader2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

type Mengajar = {
  id_pengajaran: string
  tingkat: string
  nama_kelas: string
  mapel?: { nama_pelajaran: string }
}

type Kolom = { tipe: "tugas" | "manual"; id: string; label: string }
type SiswaRekap = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  nilai: Record<string, number | null>
  rata_rata: number | null
}

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

function labelMengajar(m: Mengajar | undefined) {
  if (!m) return "-"
  return `${m.mapel?.nama_pelajaran || "-"} - ${m.tingkat} ${m.nama_kelas}`
}

export default function RekapNilaiPage() {
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [idPengajaran, setIdPengajaran] = useState("")
  const [kolom, setKolom] = useState<Kolom[]>([])
  const [siswaList, setSiswaList] = useState<SiswaRekap[]>([])
  const [loadingMengajar, setLoadingMengajar] = useState(true)
  const [loadingRekap, setLoadingRekap] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch("/mengajar")
      .then((res) => {
        if (cancelled) return
        const list: Mengajar[] = res.data || []
        setMengajarList(list)
        setIdPengajaran((prev) => prev || list[0]?.id_pengajaran || "")
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat data.")
      })
      .finally(() => {
        if (!cancelled) setLoadingMengajar(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!idPengajaran) return

    let cancelled = false
    setLoadingRekap(true)

    apiFetch(`/rekap-nilai?id_pengajaran=${idPengajaran}`)
      .then((res) => {
        if (cancelled) return
        setKolom(res.data?.kolom || [])
        setSiswaList(res.data?.siswa || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat rekap nilai.")
      })
      .finally(() => {
        if (!cancelled) setLoadingRekap(false)
      })

    return () => {
      cancelled = true
    }
  }, [idPengajaran])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekap Nilai</h1>
        <p className="text-sm text-muted-foreground">Gabungan nilai Tugas dan Nilai Manual per kelas/mapel.</p>
      </div>

      {loadingMengajar ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : mengajarList.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Anda belum punya pembagian mengajar. Tambahkan dulu di menu Pembagian Mengajar.
        </p>
      ) : (
        <>
          <Card className="dashboard-card">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Kelas / Mapel</label>
                <select className={selectClass} value={idPengajaran} onChange={(e) => setIdPengajaran(e.target.value)}>
                  {mengajarList.map((m) => (
                    <option key={m.id_pengajaran} value={m.id_pengajaran}>
                      {labelMengajar(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Card className="dashboard-card overflow-hidden py-0">
            <CardHeader className="flex flex-row items-center gap-2 border-b border-border py-4">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <CardTitle>Tabel Nilai</CardTitle>
            </CardHeader>

            {loadingRekap ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat rekap...
              </div>
            ) : kolom.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Belum ada tugas atau nilai manual yang bisa direkap untuk kelas ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Nama Siswa
                      </th>
                      {kolom.map((k) => (
                        <th
                          key={k.id}
                          className="min-w-32 px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                          title={k.tipe === "tugas" ? "Tugas" : "Nilai Manual"}
                        >
                          {k.label}
                        </th>
                      ))}
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Rata-rata
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {siswaList.length === 0 ? (
                      <tr>
                        <td colSpan={kolom.length + 2} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          Tidak ada siswa di kelas ini.
                        </td>
                      </tr>
                    ) : (
                      siswaList.map((s) => (
                        <tr key={s.id_siswa} className="hover:bg-muted/40">
                          <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium">{s.nama_lengkap}</td>
                          {kolom.map((k) => (
                            <td key={k.id} className="px-3 py-2.5">
                              {s.nilai[k.id] !== null && s.nilai[k.id] !== undefined ? s.nilai[k.id] : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-2.5 font-semibold">{s.rata_rata ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
