"use client"

import { useEffect, useState } from "react"
import { Loader2, NotebookPen, PencilLine, Plus, Save, Trash2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Mengajar = {
  id_pengajaran: string
  tingkat: string
  nama_kelas: string
  mapel?: { nama_pelajaran: string }
}

type NilaiManualItem = {
  id_nilai_manual: string
  judul: string
  semester: "ganjil" | "genap"
  pengajaran?: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } }
  jumlah_dinilai: number
  total_siswa: number
  rata_rata: number | null
}

type SiswaNilai = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  nilai: number | null
}

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

function labelMengajar(m: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } } | undefined) {
  if (!m) return "-"
  return `${m.mapel?.nama_pelajaran || "-"} - ${m.tingkat} ${m.nama_kelas}`
}

export default function NilaiManualPage() {
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [data, setData] = useState<NilaiManualItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [idPengajaran, setIdPengajaran] = useState("")
  const [judul, setJudul] = useState("")
  const [semester, setSemester] = useState<"ganjil" | "genap">("ganjil")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [isiOpen, setIsiOpen] = useState(false)
  const [isiIdNilaiManual, setIsiIdNilaiManual] = useState<string | null>(null)
  const [isiJudul, setIsiJudul] = useState("")
  const [roster, setRoster] = useState<SiswaNilai[]>([])
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isiError, setIsiError] = useState<string | null>(null)

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/nilai-manual")
      setData(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([apiFetch("/mengajar"), apiFetch("/nilai-manual")])
      .then(([mengajarRes, nilaiRes]) => {
        if (cancelled) return
        setMengajarList(mengajarRes.data || [])
        setData(nilaiRes.data || [])
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

  const bukaTambah = () => {
    setIdPengajaran(mengajarList[0]?.id_pengajaran || "")
    setJudul("")
    setSemester("ganjil")
    setFormError(null)
    setFormOpen(true)
  }

  const bukaIsiNilai = async (item: { id_nilai_manual: string; judul: string }) => {
    setIsiIdNilaiManual(item.id_nilai_manual)
    setIsiJudul(item.judul)
    setIsiError(null)
    setRoster([])
    setIsiOpen(true)
    setLoadingRoster(true)

    try {
      const res = await apiFetch(`/nilai-manual/roster?id_nilai_manual=${item.id_nilai_manual}`)
      setRoster(res.data || [])
    } catch (err) {
      setIsiError(err instanceof Error ? err.message : "Gagal memuat roster siswa.")
    } finally {
      setLoadingRoster(false)
    }
  }

  const submitTambah = async () => {
    setFormError(null)

    if (!idPengajaran || !judul.trim()) {
      setFormError("Kelas/mapel dan judul penilaian wajib diisi.")
      return
    }

    setSubmitting(true)

    try {
      const res = await apiFetch("/nilai-manual", {
        method: "POST",
        body: JSON.stringify({ id_pengajaran: idPengajaran, judul: judul.trim(), semester }),
      })
      setFormOpen(false)
      await muatData()
      await bukaIsiNilai({ id_nilai_manual: res.data.id_nilai_manual, judul: judul.trim() })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat nilai manual.")
    } finally {
      setSubmitting(false)
    }
  }

  const ubahNilai = (idSiswa: string, value: string) => {
    setRoster((prev) =>
      prev.map((s) => (s.id_siswa === idSiswa ? { ...s, nilai: value === "" ? null : Number(value) } : s))
    )
  }

  const simpanNilai = async () => {
    if (!isiIdNilaiManual) return

    setSaving(true)
    setIsiError(null)

    try {
      await apiFetch("/nilai-manual/simpan", {
        method: "POST",
        body: JSON.stringify({
          id_nilai_manual: isiIdNilaiManual,
          siswa: roster.map((s) => ({ id_siswa: s.id_siswa, nilai: s.nilai })),
        }),
      })
      setIsiOpen(false)
      await muatData()
    } catch (err) {
      setIsiError(err instanceof Error ? err.message : "Gagal menyimpan nilai.")
    } finally {
      setSaving(false)
    }
  }

  const hapus = async (item: NilaiManualItem) => {
    if (!window.confirm(`Hapus penilaian "${item.judul}"? Semua nilai siswa di dalamnya akan ikut terhapus.`)) {
      return
    }

    setProcessingId(item.id_nilai_manual)

    try {
      await apiFetch(`/nilai-manual/${item.id_nilai_manual}`, { method: "DELETE" })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus nilai manual.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nilai Manual</h1>
          <p className="text-sm text-muted-foreground">Input nilai untuk penilaian di luar portal (ulangan tulis, praktik, dll).</p>
        </div>
        <Button onClick={bukaTambah} disabled={loading || mengajarList.length === 0}>
          <Plus className="w-4 h-4" />
          Nilai Manual Baru
        </Button>
      </div>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-muted-foreground" />
            Daftar Penilaian
          </CardTitle>
        </CardHeader>

        {error && <p className="px-4 pt-3 text-sm text-destructive">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat data...
          </div>
        ) : mengajarList.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Anda belum punya pembagian mengajar. Tambahkan dulu di menu Pembagian Mengajar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Judul</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Kelas / Mapel</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Semester</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Dinilai</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Rata-rata</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Belum ada penilaian manual. Klik &quot;Nilai Manual Baru&quot; untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => {
                    const isBusy = processingId === item.id_nilai_manual
                    return (
                      <tr key={item.id_nilai_manual} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{item.judul}</td>
                        <td className="px-4 py-2.5">{labelMengajar(item.pengajaran)}</td>
                        <td className="px-4 py-2.5 capitalize text-muted-foreground">{item.semester}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {item.jumlah_dinilai}/{item.total_siswa}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.rata_rata ?? "-"}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => bukaIsiNilai(item)} title="Isi Nilai">
                              <PencilLine className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={isBusy}
                              onClick={() => hapus(item)}
                              className="text-destructive hover:bg-destructive/10"
                              title="Hapus"
                            >
                              {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formOpen && (
        <Modal title="Nilai Manual Baru" onClose={() => setFormOpen(false)}>
          <div className="space-y-3">
            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Kelas / Mapel</label>
              <select className={selectClass} value={idPengajaran} onChange={(e) => setIdPengajaran(e.target.value)} disabled={submitting}>
                {mengajarList.map((m) => (
                  <option key={m.id_pengajaran} value={m.id_pengajaran}>
                    {labelMengajar(m)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Judul Penilaian</label>
              <Input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Ulangan Harian 1, Praktik Offline"
                disabled={submitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Semester</label>
              <select
                className={selectClass}
                value={semester}
                onChange={(e) => setSemester(e.target.value === "genap" ? "genap" : "ganjil")}
                disabled={submitting}
              >
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={submitTambah} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Buat & Isi Nilai
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isiOpen && (
        <Modal title={`Isi Nilai - ${isiJudul}`} onClose={() => setIsiOpen(false)} maxWidthClassName="max-w-xl">
          <div className="space-y-3">
            {isiError && <p className="text-sm text-destructive">{isiError}</p>}

            {loadingRoster ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat roster...
              </div>
            ) : roster.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada siswa aktif di kelas ini.</p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 border-b border-border bg-card">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nama Siswa</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">NISN</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {roster.map((s) => (
                      <tr key={s.id_siswa}>
                        <td className="px-3 py-2 font-medium">{s.nama_lengkap}</td>
                        <td className="px-3 py-2 text-muted-foreground">{s.nisn || "-"}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={100}
                            value={s.nilai ?? ""}
                            onChange={(e) => ubahNilai(s.id_siswa, e.target.value)}
                            className="h-8 w-24"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={simpanNilai} disabled={saving || loadingRoster || roster.length === 0}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Nilai
              </Button>
              <Button variant="outline" onClick={() => setIsiOpen(false)} disabled={saving}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
