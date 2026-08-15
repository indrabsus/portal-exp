"use client"

import { useEffect, useState } from "react"
import { CheckCheck, ClipboardList, Loader2, Save } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Mengajar = {
  id_pengajaran: string
  tingkat: string
  nama_kelas: string
  mapel?: { nama_pelajaran: string }
}

type StatusAbsen = "hadir" | "sakit" | "izin" | "alpa"

type SiswaAbsen = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  status: StatusAbsen
  keterangan: string | null
}

const STATUS_LIST: { value: StatusAbsen; label: string; activeClass: string }[] = [
  { value: "hadir", label: "Hadir", activeClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { value: "sakit", label: "Sakit", activeClass: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { value: "izin", label: "Izin", activeClass: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { value: "alpa", label: "Alpa", activeClass: "border-destructive/40 bg-destructive/10 text-destructive" },
]

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

function labelMengajar(m: Mengajar | undefined) {
  if (!m) return "-"
  return `${m.mapel?.nama_pelajaran || "-"} - ${m.tingkat} ${m.nama_kelas}`
}

export default function AbsenSiswaPage() {
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [idPengajaran, setIdPengajaran] = useState("")
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [roster, setRoster] = useState<SiswaAbsen[]>([])
  const [loadingMengajar, setLoadingMengajar] = useState(true)
  const [loadingRoster, setLoadingRoster] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

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
    if (!idPengajaran || !tanggal) return

    let cancelled = false

    apiFetch(`/absen-kelas/roster?id_pengajaran=${idPengajaran}&tanggal=${tanggal}`)
      .then((res) => {
        if (!cancelled) setRoster(res.data || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat roster siswa.")
      })
      .finally(() => {
        if (!cancelled) setLoadingRoster(false)
      })

    return () => {
      cancelled = true
    }
  }, [idPengajaran, tanggal])

  const ubahStatus = (idSiswa: string, status: StatusAbsen) => {
    setRoster((prev) => prev.map((s) => (s.id_siswa === idSiswa ? { ...s, status } : s)))
  }

  const ubahKeterangan = (idSiswa: string, keterangan: string) => {
    setRoster((prev) => prev.map((s) => (s.id_siswa === idSiswa ? { ...s, keterangan } : s)))
  }

  const tandaiSemuaHadir = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: "hadir" as StatusAbsen })))
  }

  const simpan = async () => {
    setSaving(true)
    setError(null)
    setInfo(null)

    try {
      await apiFetch("/absen-kelas/simpan", {
        method: "POST",
        body: JSON.stringify({
          id_pengajaran: idPengajaran,
          tanggal,
          siswa: roster.map((s) => ({ id_siswa: s.id_siswa, status: s.status, keterangan: s.keterangan })),
        }),
      })
      setInfo("Absensi berhasil disimpan.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan absensi.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Absen Siswa</h1>
        <p className="text-sm text-muted-foreground">Catat kehadiran siswa untuk kelas yang Anda ajar hari ini.</p>
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
            <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Kelas / Mapel</label>
                <select
                  className={selectClass}
                  value={idPengajaran}
                  onChange={(e) => {
                    setLoadingRoster(true)
                    setIdPengajaran(e.target.value)
                  }}
                >
                  {mengajarList.map((m) => (
                    <option key={m.id_pengajaran} value={m.id_pengajaran}>
                      {labelMengajar(m)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full space-y-1 sm:w-48">
                <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
                <Input
                  type="date"
                  value={tanggal}
                  onChange={(e) => {
                    setLoadingRoster(true)
                    setTanggal(e.target.value)
                  }}
                />
              </div>
              <Button variant="outline" onClick={tandaiSemuaHadir} disabled={loadingRoster || roster.length === 0}>
                <CheckCheck className="w-4 h-4" />
                Tandai Semua Hadir
              </Button>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{info}</p>}

          <Card className="dashboard-card overflow-hidden py-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                Daftar Siswa ({roster.length})
              </CardTitle>
              <Button onClick={simpan} disabled={saving || loadingRoster || roster.length === 0}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Absensi
              </Button>
            </CardHeader>

            {loadingRoster ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat roster...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nama Siswa</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Status</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {roster.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          Tidak ada siswa di kelas ini.
                        </td>
                      </tr>
                    ) : (
                      roster.map((s) => (
                        <tr key={s.id_siswa} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5 font-medium">{s.nama_lengkap}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1">
                              {STATUS_LIST.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => ubahStatus(s.id_siswa, opt.value)}
                                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                    s.status === opt.value ? opt.activeClass : "border-border text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            {s.status !== "hadir" && (
                              <Input
                                value={s.keterangan || ""}
                                onChange={(e) => ubahKeterangan(s.id_siswa, e.target.value)}
                                placeholder="Keterangan (opsional)"
                                className="h-8 max-w-56"
                              />
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
        </>
      )}
    </div>
  )
}
