"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2,
  FileText,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
  XCircle,
} from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Modal } from "@/components/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Mengajar = {
  id_pengajaran: string
  tingkat: string
  nama_kelas: string
  mapel?: { nama_pelajaran: string }
}

type TugasRow = {
  id_tugas: string
  id_pengajaran: string
  judul: string
  deskripsi: string | null
  deadline: string | null
  status: "draft" | "terbit"
  semester: "ganjil" | "genap"
  jumlah_soal: number
  pengajaran?: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } }
}

type Soal = {
  id_soal: string
  pertanyaan: string
  tipe_soal: "pg" | "essay"
  mapel?: { nama_pelajaran: string }
}

type SoalTugas = {
  id_tugas_soal: string
  id_soal: string
  nomor: number
  bobot: number
  soal?: { pertanyaan: string; tipe_soal: string }
}

type Pengumpulan = {
  id_pengumpulan: string
  status: "dikerjakan" | "selesai" | "dinilai"
  nilai: number | null
  mulai_at: string
  selesai_at: string | null
  siswa?: { nama_lengkap: string; nisn: string }
}

type OpsiSoal = { id_opsi: string; label: string; isi_opsi: string; kategori?: string | null; is_benar?: boolean }
type SoalDetail = {
  tipe_soal: "pg_tunggal" | "pg_mcma" | "pg_kategori" | "essay"
  daftar_kategori: string | null
  pertanyaan: string
  opsi: OpsiSoal[]
}
type TugasSoalDetail = { id_tugas_soal: string; nomor: number; bobot: number; soal: SoalDetail & { id_soal: string } }
type JawabanDetail = { id_soal: string; id_opsi: string | null; jawaban_text: string | null; is_benar: boolean | null; nilai: number | null }

const STATUS_PENGUMPULAN_LABEL: Record<string, string> = {
  dikerjakan: "Sedang Dikerjakan",
  selesai: "Menunggu Penilaian",
  dinilai: "Sudah Dinilai",
}

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

function labelMengajar(m: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } } | undefined) {
  if (!m) return "-"
  return `${m.mapel?.nama_pelajaran || "-"} - ${m.tingkat} ${m.nama_kelas}`
}

export default function TugasPage() {
  const [data, setData] = useState<TugasRow[]>([])
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TugasRow | null>(null)
  const [idPengajaran, setIdPengajaran] = useState("")
  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [deadline, setDeadline] = useState("")
  const [status, setStatus] = useState<"draft" | "terbit">("draft")
  const [semester, setSemester] = useState<"ganjil" | "genap">("ganjil")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)
  const [kelolaTugas, setKelolaTugas] = useState<TugasRow | null>(null)
  const [pengumpulanTugas, setPengumpulanTugas] = useState<TugasRow | null>(null)

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/tugas")
      setData(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([apiFetch("/tugas"), apiFetch("/mengajar")])
      .then(([tugasRes, mengajarRes]) => {
        if (cancelled) return
        setData(tugasRes.data || [])
        setMengajarList(mengajarRes.data || [])
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
    setEditing(null)
    setIdPengajaran(mengajarList[0]?.id_pengajaran || "")
    setJudul("")
    setDeskripsi("")
    setDeadline("")
    setStatus("draft")
    setSemester("ganjil")
    setFormError(null)
    setFormOpen(true)
  }

  const bukaEdit = (item: TugasRow) => {
    setEditing(item)
    setIdPengajaran(item.id_pengajaran)
    setJudul(item.judul)
    setDeskripsi(item.deskripsi || "")
    setDeadline(item.deadline ? item.deadline.slice(0, 10) : "")
    setStatus(item.status)
    setSemester(item.semester)
    setFormError(null)
    setFormOpen(true)
  }

  const submit = async () => {
    setFormError(null)

    if (!idPengajaran || !judul.trim()) {
      setFormError("Kelas/mapel dan judul wajib diisi.")
      return
    }

    setSubmitting(true)

    const payload = {
      id_pengajaran: idPengajaran,
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      deadline,
      status,
      semester,
    }

    try {
      if (editing) {
        await apiFetch(`/tugas/${editing.id_tugas}`, { method: "PUT", body: JSON.stringify(payload) })
      } else {
        await apiFetch("/tugas", { method: "POST", body: JSON.stringify(payload) })
      }
      setFormOpen(false)
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan tugas.")
    } finally {
      setSubmitting(false)
    }
  }

  const hapus = async (item: TugasRow) => {
    if (!window.confirm(`Hapus tugas "${item.judul}"? Aksi ini tidak bisa dibatalkan.`)) return

    setProcessingId(item.id_tugas)

    try {
      await apiFetch(`/tugas/${item.id_tugas}`, { method: "DELETE" })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus tugas.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tugas</h1>
          <p className="text-sm text-muted-foreground">Susun tugas dari bank soal untuk kelas yang Anda ampu.</p>
        </div>
        <Button onClick={bukaTambah} disabled={mengajarList.length === 0}>
          <Plus className="w-4 h-4" />
          Tambah Tugas
        </Button>
      </div>

      {mengajarList.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          Anda belum punya pembagian mengajar. Tambahkan dulu di menu Pembagian Mengajar.
        </p>
      )}

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Daftar Tugas
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
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Kelas / Mapel</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Judul</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Deadline</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Soal</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Belum ada tugas.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => {
                    const isBusy = processingId === item.id_tugas
                    return (
                      <tr key={item.id_tugas} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5">{labelMengajar(item.pengajaran)}</td>
                        <td className="px-4 py-2.5 font-medium">{item.judul}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {item.deadline
                            ? new Date(item.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                            : "-"}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => setKelolaTugas(item)}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                          >
                            <ListChecks className="w-3 h-3" />
                            {item.jumlah_soal} soal
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={item.status === "terbit" ? "default" : "secondary"}>
                            {item.status === "terbit" ? "Terbit" : "Draft"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => setPengumpulanTugas(item)} title="Lihat Pengumpulan">
                              <Users className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => bukaEdit(item)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
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
        <Modal title={editing ? "Edit Tugas" : "Tambah Tugas"} onClose={() => setFormOpen(false)}>
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
              <label className="text-xs font-medium text-muted-foreground">Judul Tugas</label>
              <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="mis. Latihan Bab 1" disabled={submitting} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Deskripsi (opsional)</label>
              <textarea className={textareaClass} rows={2} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} disabled={submitting} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Deadline (opsional)</label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} disabled={submitting} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Semester</label>
                <select className={selectClass} value={semester} onChange={(e) => setSemester(e.target.value as "ganjil" | "genap")} disabled={submitting}>
                  <option value="ganjil">Ganjil</option>
                  <option value="genap">Genap</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as "draft" | "terbit")} disabled={submitting}>
                  <option value="draft">Draft</option>
                  <option value="terbit">Terbit</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Simpan
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {kelolaTugas && (
        <KelolaSoalModal
          tugas={kelolaTugas}
          onClose={() => setKelolaTugas(null)}
          onChanged={muatData}
        />
      )}

      {pengumpulanTugas && (
        <PengumpulanModal tugas={pengumpulanTugas} onClose={() => setPengumpulanTugas(null)} />
      )}
    </div>
  )
}

function KelolaSoalModal({
  tugas,
  onClose,
  onChanged,
}: {
  tugas: TugasRow
  onClose: () => void
  onChanged: () => void
}) {
  const [terpilih, setTerpilih] = useState<SoalTugas[]>([])
  const [bankSoal, setBankSoal] = useState<Soal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [idSoalBaru, setIdSoalBaru] = useState("")
  const [bobotBaru, setBobotBaru] = useState("1")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

  const muat = async () => {
    setLoading(true)
    setError(null)

    try {
      const [terpilihRes, bankRes] = await Promise.all([
        apiFetch(`/tugas/${tugas.id_tugas}/soal`),
        apiFetch("/bank-soal"),
      ])
      setTerpilih(terpilihRes.data || [])
      setBankSoal(bankRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data soal.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([apiFetch(`/tugas/${tugas.id_tugas}/soal`), apiFetch("/bank-soal")])
      .then(([terpilihRes, bankRes]) => {
        if (cancelled) return
        setTerpilih(terpilihRes.data || [])
        setBankSoal(bankRes.data || [])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data soal.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tugas.id_tugas])

  const idTerpilihSet = new Set(terpilih.map((t) => t.id_soal))
  const opsiSoal = bankSoal.filter((s) => !idTerpilihSet.has(s.id_soal))

  const tambah = async () => {
    setFormError(null)

    if (!idSoalBaru) {
      setFormError("Pilih soal terlebih dahulu.")
      return
    }

    setSubmitting(true)

    try {
      await apiFetch(`/tugas/${tugas.id_tugas}/soal`, {
        method: "POST",
        body: JSON.stringify({ id_soal: idSoalBaru, bobot: Number(bobotBaru) || 1 }),
      })
      setIdSoalBaru("")
      setBobotBaru("1")
      await muat()
      onChanged()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambahkan soal.")
    } finally {
      setSubmitting(false)
    }
  }

  const hapus = async (row: SoalTugas) => {
    setProcessingId(row.id_tugas_soal)

    try {
      await apiFetch(`/tugas/soal/${row.id_tugas_soal}`, { method: "DELETE" })
      await muat()
      onChanged()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus soal dari tugas.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <Modal title={`Kelola Soal - ${tugas.judul}`} onClose={onClose} maxWidthClassName="max-w-xl">
      <div className="space-y-4">
        <div className="flex items-end gap-2 rounded-lg border border-border p-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tambah Soal dari Bank Soal</label>
            <select className={selectClass} value={idSoalBaru} onChange={(e) => setIdSoalBaru(e.target.value)} disabled={submitting}>
              <option value="">Pilih soal</option>
              {opsiSoal.map((s) => (
                <option key={s.id_soal} value={s.id_soal}>
                  {s.pertanyaan.length > 60 ? `${s.pertanyaan.slice(0, 60)}...` : s.pertanyaan}
                </option>
              ))}
            </select>
          </div>
          <div className="w-20 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Bobot</label>
            <Input type="number" min={1} value={bobotBaru} onChange={(e) => setBobotBaru(e.target.value)} disabled={submitting} />
          </div>
          <Button onClick={tambah} disabled={submitting} size="sm">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Tambah
          </Button>
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat soal...
          </div>
        ) : terpilih.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Belum ada soal di tugas ini.</p>
        ) : (
          <div className="space-y-2">
            {terpilih.map((row) => (
              <div key={row.id_tugas_soal} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {row.nomor}. {row.soal?.pertanyaan || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.soal?.tipe_soal === "pg" ? "Pilihan Ganda" : "Essay"} &middot; Bobot {row.bobot}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={processingId === row.id_tugas_soal}
                  onClick={() => hapus(row)}
                  className="shrink-0 text-destructive hover:bg-destructive/10"
                >
                  {processingId === row.id_tugas_soal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

function PengumpulanModal({ tugas, onClose }: { tugas: TugasRow; onClose: () => void }) {
  const [list, setList] = useState<Pengumpulan[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [detail, setDetail] = useState<{ pengumpulan: Pengumpulan; soal: TugasSoalDetail[]; jawaban: JawabanDetail[] } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [nilaiEssay, setNilaiEssay] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const muatList = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`/tugas/${tugas.id_tugas}/pengumpulan`)
      setList(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    apiFetch(`/tugas/${tugas.id_tugas}/pengumpulan`)
      .then((res) => {
        if (!cancelled) setList(res.data || [])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tugas.id_tugas])

  const bukaDetail = async (p: Pengumpulan) => {
    setDetailLoading(true)
    setError(null)

    try {
      const res = await apiFetch(`/tugas/${tugas.id_tugas}/pengumpulan/${p.id_pengumpulan}`)
      const soal: TugasSoalDetail[] = res.data.soal || []
      const jawaban: JawabanDetail[] = res.data.jawaban || []
      setDetail({ pengumpulan: res.data.pengumpulan, soal, jawaban })

      const initEssay: Record<string, string> = {}
      soal.forEach((ts) => {
        if (ts.soal.tipe_soal === "essay") {
          const jwb = jawaban.find((j) => j.id_soal === ts.soal.id_soal)
          initEssay[ts.soal.id_soal] = jwb?.nilai !== null && jwb?.nilai !== undefined ? String(jwb.nilai) : ""
        }
      })
      setNilaiEssay(initEssay)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail pengumpulan.")
    } finally {
      setDetailLoading(false)
    }
  }

  const simpanNilai = async () => {
    if (!detail) return

    setSaving(true)
    setError(null)

    const nilai_essay = Object.entries(nilaiEssay).map(([id_soal, nilai]) => ({ id_soal, nilai: Number(nilai) }))

    try {
      await apiFetch(`/tugas/${tugas.id_tugas}/pengumpulan/${detail.pengumpulan.id_pengumpulan}/nilai`, {
        method: "PUT",
        body: JSON.stringify({ nilai_essay }),
      })
      setDetail(null)
      await muatList()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan nilai.")
    } finally {
      setSaving(false)
    }
  }

  const adaEssay = detail?.soal.some((ts) => ts.soal.tipe_soal === "essay") || false

  return (
    <Modal
      title={detail ? `Jawaban - ${detail.pengumpulan.siswa?.nama_lengkap || "-"}` : `Pengumpulan - ${tugas.judul}`}
      onClose={detail ? () => setDetail(null) : onClose}
      maxWidthClassName="max-w-2xl"
    >
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      {!detail ? (
        loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat data...
          </div>
        ) : !list || list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Belum ada siswa yang mengerjakan tugas ini.</p>
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {list.map((p) => (
              <button
                key={p.id_pengumpulan}
                onClick={() => bukaDetail(p)}
                disabled={detailLoading}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3 text-left text-sm hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.siswa?.nama_lengkap || "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.siswa?.nisn || "-"} &middot;{" "}
                    {p.selesai_at
                      ? new Date(p.selesai_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Belum dikumpulkan"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.nilai !== null && <span className="font-semibold">{p.nilai}</span>}
                  <Badge variant={p.status === "dinilai" ? "default" : "secondary"}>{STATUS_PENGUMPULAN_LABEL[p.status]}</Badge>
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={detail.pengumpulan.status === "dinilai" ? "default" : "secondary"} className="mt-1">
                {STATUS_PENGUMPULAN_LABEL[detail.pengumpulan.status]}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Nilai</p>
              <p className="text-xl font-bold">{detail.pengumpulan.nilai ?? "-"}</p>
            </div>
          </div>

          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {detail.soal.map((ts, idx) => (
              <div key={ts.id_tugas_soal} className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Soal {idx + 1} <span className="font-normal">(bobot {ts.bobot})</span>
                </p>
                <p className="mb-2 text-sm font-medium">{ts.soal.pertanyaan}</p>
                <JawabanSiswaView
                  soal={ts.soal}
                  jawabanList={detail.jawaban.filter((j) => j.id_soal === ts.soal.id_soal)}
                  nilaiEssay={nilaiEssay[ts.soal.id_soal] ?? ""}
                  onNilaiEssayChange={(v) => setNilaiEssay((prev) => ({ ...prev, [ts.soal.id_soal]: v }))}
                />
              </div>
            ))}
          </div>

          {adaEssay && (
            <Button onClick={simpanNilai} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Nilai
            </Button>
          )}
        </div>
      )}
    </Modal>
  )
}

function JawabanSiswaView({
  soal,
  jawabanList,
  nilaiEssay,
  onNilaiEssayChange,
}: {
  soal: SoalDetail
  jawabanList: JawabanDetail[]
  nilaiEssay: string
  onNilaiEssayChange: (v: string) => void
}) {
  if (soal.tipe_soal === "pg_tunggal" || soal.tipe_soal === "pg_mcma") {
    const idTerpilih = new Set(jawabanList.map((j) => j.id_opsi).filter(Boolean))
    return (
      <div className="space-y-1.5">
        {soal.opsi.map((o) => {
          const dipilih = idTerpilih.has(o.id_opsi)
          return (
            <div
              key={o.id_opsi}
              className={`flex items-center gap-2 rounded-md border p-2 text-xs ${
                o.is_benar ? "border-emerald-500/40 bg-emerald-500/10" : dipilih ? "border-destructive/40 bg-destructive/10" : "border-border"
              }`}
            >
              {o.is_benar ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
              ) : dipilih ? (
                <XCircle className="size-3.5 shrink-0 text-destructive" />
              ) : (
                <span className="size-3.5 shrink-0" />
              )}
              <span className="font-semibold">{o.label}.</span> {o.isi_opsi}
              {dipilih && <span className="ml-auto text-muted-foreground">Jawaban siswa</span>}
            </div>
          )
        })}
      </div>
    )
  }

  if (soal.tipe_soal === "pg_kategori") {
    return (
      <div className="space-y-1.5">
        {soal.opsi.map((o) => {
          const jwb = jawabanList.find((j) => j.id_opsi === o.id_opsi)
          return (
            <div
              key={o.id_opsi}
              className={`flex flex-wrap items-center gap-2 rounded-md border p-2 text-xs ${
                jwb?.is_benar ? "border-emerald-500/40 bg-emerald-500/10" : "border-destructive/40 bg-destructive/10"
              }`}
            >
              <span className="flex-1">{o.isi_opsi}</span>
              <span className="text-muted-foreground">Jawaban: {jwb?.jawaban_text || "-"}</span>
              <span className="font-medium">Benar: {o.kategori}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="rounded-md border border-border bg-muted/30 p-2 text-xs">{jawabanList[0]?.jawaban_text || "-"}</p>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">Nilai (0-100)</label>
        <Input
          type="number"
          min={0}
          max={100}
          value={nilaiEssay}
          onChange={(e) => onNilaiEssayChange(e.target.value)}
          className="h-8 w-24"
        />
      </div>
    </div>
  )
}
