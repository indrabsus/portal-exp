"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, School, Trash2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

type Mengajar = {
  id_pengajaran: string
  tingkat: string
  nama_kelas: string
  mapel?: { nama_pelajaran: string }
  tahun_ajaran?: { nama: string }
}

type Mapel = { id_mapel: string; nama_pelajaran: string }
type KelasOption = { tingkat: string; nama_kelas: string }

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

export default function MengajarPage() {
  const [data, setData] = useState<Mengajar[]>([])
  const [mapelList, setMapelList] = useState<Mapel[]>([])
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([])
  const [tahunAktif, setTahunAktif] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [idMapel, setIdMapel] = useState("")
  const [kelasValue, setKelasValue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/mengajar")
      setData(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([apiFetch("/mengajar"), apiFetch("/mapel"), apiFetch("/riwayat-kelas/tahun-aktif")])
      .then(async ([mengajarRes, mapelRes, tahunRes]) => {
        if (cancelled) return
        setData(mengajarRes.data || [])
        setMapelList(mapelRes.data || [])
        const namaTahun = tahunRes.data?.tahun_ajaran || ""
        setTahunAktif(namaTahun)

        if (namaTahun) {
          const kelasRes = await apiFetch(`/riwayat-kelas/kelas-list?tahun_ajaran=${encodeURIComponent(namaTahun)}`)
          if (!cancelled) setKelasOptions(kelasRes.data || [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const bukaTambah = () => {
    setIdMapel("")
    setKelasValue("")
    setFormError(null)
    setFormOpen(true)
  }

  const submit = async () => {
    setFormError(null)

    if (!idMapel || !kelasValue) {
      setFormError("Mata pelajaran dan kelas wajib dipilih.")
      return
    }

    const [tingkat, ...rest] = kelasValue.split("|")
    const namaKelas = rest.join("|")

    setSubmitting(true)

    try {
      await apiFetch("/mengajar", {
        method: "POST",
        body: JSON.stringify({ id_mapel: idMapel, tingkat, nama_kelas: namaKelas }),
      })
      setFormOpen(false)
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambahkan pembagian mengajar.")
    } finally {
      setSubmitting(false)
    }
  }

  const hapus = async (item: Mengajar) => {
    if (
      !window.confirm(
        `Hapus pembagian mengajar ${item.mapel?.nama_pelajaran} di ${item.tingkat} ${item.nama_kelas}? Materi dan tugas terkait harus dihapus dulu jika ada.`
      )
    ) {
      return
    }

    setProcessingId(item.id_pengajaran)

    try {
      await apiFetch(`/mengajar/${item.id_pengajaran}`, { method: "DELETE" })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus pembagian mengajar.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pembagian Mengajar</h1>
          <p className="text-sm text-muted-foreground">
            Mata pelajaran dan kelas yang Anda ampu{tahunAktif ? ` - TA ${tahunAktif}` : ""}.
          </p>
        </div>
        <Button onClick={bukaTambah}>
          <Plus className="w-4 h-4" />
          Tambah
        </Button>
      </div>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <School className="w-4 h-4 text-muted-foreground" />
            Daftar Mengajar
          </CardTitle>
        </CardHeader>

        {error && <p className="px-4 pt-3 text-sm text-destructive">{error}</p>}

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
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Mata Pelajaran</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Kelas</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tahun Ajaran</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Belum ada pembagian mengajar. Klik &quot;Tambah&quot; untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => {
                    const isBusy = processingId === item.id_pengajaran
                    return (
                      <tr key={item.id_pengajaran} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-medium">{item.mapel?.nama_pelajaran || "-"}</td>
                        <td className="px-4 py-2.5">{item.tingkat} {item.nama_kelas}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.tahun_ajaran?.nama || "-"}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={isBusy}
                              onClick={() => hapus(item)}
                              className="text-destructive hover:bg-destructive/10"
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
        <Modal title="Tambah Pembagian Mengajar" onClose={() => setFormOpen(false)}>
          <div className="space-y-3">
            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Mata Pelajaran</label>
              <select className={selectClass} value={idMapel} onChange={(e) => setIdMapel(e.target.value)} disabled={submitting}>
                <option value="">Pilih mata pelajaran</option>
                {mapelList.map((m) => (
                  <option key={m.id_mapel} value={m.id_mapel}>
                    {m.nama_pelajaran}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Kelas</label>
              <select className={selectClass} value={kelasValue} onChange={(e) => setKelasValue(e.target.value)} disabled={submitting}>
                <option value="">Pilih kelas</option>
                {kelasOptions.map((k) => (
                  <option key={`${k.tingkat}-${k.nama_kelas}`} value={`${k.tingkat}|${k.nama_kelas}`}>
                    {k.tingkat} {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Tambah
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
