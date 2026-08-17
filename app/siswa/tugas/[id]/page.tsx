"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, Save, XCircle } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Opsi = { id_opsi: string; label: string; isi_opsi: string; gambar_url: string | null; kategori?: string | null; is_benar?: boolean }
type Soal = {
  id_soal: string
  tipe_soal: "pg_tunggal" | "pg_mcma" | "pg_kategori" | "essay"
  daftar_kategori: string | null
  pertanyaan: string
  gambar_url: string | null
  pembahasan?: string | null
  opsi: Opsi[]
}
type TugasSoal = { id_tugas_soal: string; nomor: number; bobot: number; soal: Soal }
type Tugas = {
  id_tugas: string
  judul: string
  deskripsi: string | null
  deadline: string | null
  pengajaran?: { tingkat: string; nama_kelas: string; mapel?: { nama_pelajaran: string } }
}
type JawabanTersimpan = { id_soal: string; id_opsi: string | null; jawaban_text: string | null }
type JawabanHasil = JawabanTersimpan & { is_benar: boolean | null; nilai: number | null }
type Pengumpulan = { status: "dikerjakan" | "selesai" | "dinilai"; nilai: number | null }

type JawabanState = {
  id_opsi?: string
  id_opsi_list?: string[]
  kategori_jawaban?: Record<string, string>
  jawaban_text?: string
}

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

export default function KerjakanTugasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [mode, setMode] = useState<"loading" | "jawab" | "hasil" | "error">("loading")
  const [error, setError] = useState<string | null>(null)

  const [tugas, setTugas] = useState<Tugas | null>(null)
  const [soalList, setSoalList] = useState<TugasSoal[]>([])
  const [jawaban, setJawaban] = useState<Record<string, JawabanState>>({})
  const [submitting, setSubmitting] = useState(false)

  const [pengumpulan, setPengumpulan] = useState<Pengumpulan | null>(null)
  const [jawabanHasil, setJawabanHasil] = useState<JawabanHasil[]>([])

  useEffect(() => {
    let cancelled = false

    const muatHasil = async () => {
      try {
        const res = await apiFetch(`/tugas-siswa/${id}/hasil`)
        if (cancelled) return
        setTugas(res.data.tugas)
        setSoalList(res.data.soal || [])
        setPengumpulan(res.data.pengumpulan)
        setJawabanHasil(res.data.jawaban || [])
        setMode("hasil")
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat tugas.")
          setMode("error")
        }
      }
    }

    apiFetch(`/tugas-siswa/${id}`)
      .then((res) => {
        if (cancelled) return
        const soal: TugasSoal[] = res.data.soal || []
        setTugas(res.data.tugas)
        setSoalList(soal)

        const tersimpan: JawabanTersimpan[] = res.data.jawaban_tersimpan || []
        const state: Record<string, JawabanState> = {}
        soal.forEach((ts) => {
          const milikSoal = tersimpan.filter((j) => j.id_soal === ts.soal.id_soal)
          if (milikSoal.length === 0) return
          if (ts.soal.tipe_soal === "pg_tunggal") {
            state[ts.soal.id_soal] = { id_opsi: milikSoal[0].id_opsi || undefined }
          } else if (ts.soal.tipe_soal === "pg_mcma") {
            state[ts.soal.id_soal] = { id_opsi_list: milikSoal.map((j) => j.id_opsi).filter((x): x is string => !!x) }
          } else if (ts.soal.tipe_soal === "pg_kategori") {
            const kategoriJawaban: Record<string, string> = {}
            milikSoal.forEach((j) => {
              if (j.id_opsi && j.jawaban_text) kategoriJawaban[j.id_opsi] = j.jawaban_text
            })
            state[ts.soal.id_soal] = { kategori_jawaban: kategoriJawaban }
          } else {
            state[ts.soal.id_soal] = { jawaban_text: milikSoal[0].jawaban_text || undefined }
          }
        })
        setJawaban(state)
        setMode("jawab")
      })
      .catch(() => {
        if (!cancelled) muatHasil()
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const ubahPgTunggal = (idSoal: string, idOpsi: string) => {
    setJawaban((prev) => ({ ...prev, [idSoal]: { id_opsi: idOpsi } }))
  }

  const ubahPgMcma = (idSoal: string, idOpsi: string, checked: boolean) => {
    setJawaban((prev) => {
      const list = prev[idSoal]?.id_opsi_list || []
      const next = checked ? [...list, idOpsi] : list.filter((x) => x !== idOpsi)
      return { ...prev, [idSoal]: { id_opsi_list: next } }
    })
  }

  const ubahKategori = (idSoal: string, idOpsi: string, kategori: string) => {
    setJawaban((prev) => ({
      ...prev,
      [idSoal]: { kategori_jawaban: { ...(prev[idSoal]?.kategori_jawaban || {}), [idOpsi]: kategori } },
    }))
  }

  const ubahEssay = (idSoal: string, teks: string) => {
    setJawaban((prev) => ({ ...prev, [idSoal]: { jawaban_text: teks } }))
  }

  const submit = async () => {
    if (!window.confirm("Kumpulkan jawaban sekarang? Jawaban tidak bisa diubah lagi setelah dikumpulkan.")) return

    setSubmitting(true)
    setError(null)

    const payload = soalList.map((ts) => {
      const j = jawaban[ts.soal.id_soal] || {}
      if (ts.soal.tipe_soal === "pg_tunggal") return { id_soal: ts.soal.id_soal, id_opsi: j.id_opsi || null }
      if (ts.soal.tipe_soal === "pg_mcma") return { id_soal: ts.soal.id_soal, id_opsi_list: j.id_opsi_list || [] }
      if (ts.soal.tipe_soal === "pg_kategori") return { id_soal: ts.soal.id_soal, kategori_jawaban: j.kategori_jawaban || {} }
      return { id_soal: ts.soal.id_soal, jawaban_text: j.jawaban_text || "" }
    })

    try {
      await apiFetch(`/tugas-siswa/${id}/submit`, { method: "POST", body: JSON.stringify({ jawaban: payload }) })
      const res = await apiFetch(`/tugas-siswa/${id}/hasil`)
      setPengumpulan(res.data.pengumpulan)
      setJawabanHasil(res.data.jawaban || [])
      setMode("hasil")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengumpulkan jawaban.")
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === "loading") {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat tugas...
      </div>
    )
  }

  if (mode === "error") {
    return (
      <div className="space-y-4">
        <Link href="/siswa/tugas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar tugas
        </Link>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/siswa/tugas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar tugas
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{tugas?.judul}</h1>
        <p className="text-sm text-muted-foreground">
          {tugas?.pengajaran?.mapel?.nama_pelajaran || "-"} · {tugas?.pengajaran?.tingkat} {tugas?.pengajaran?.nama_kelas}
        </p>
        {tugas?.deskripsi && <p className="mt-2 text-sm text-muted-foreground">{tugas.deskripsi}</p>}
        {tugas?.deadline && (
          <p className="mt-1 text-xs text-muted-foreground">
            Tenggat: {new Date(tugas.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {mode === "hasil" && pengumpulan && (
        <Card className="dashboard-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={pengumpulan.status === "dinilai" ? "default" : "secondary"} className="mt-1">
                {pengumpulan.status === "dinilai" ? "Sudah Dinilai" : "Menunggu Penilaian"}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Nilai</p>
              <p className="text-2xl font-bold tracking-tight">{pengumpulan.nilai ?? "-"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {soalList.map((ts, idx) => (
          <Card key={ts.id_tugas_soal} className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Soal {idx + 1} <span className="font-normal">(bobot {ts.bobot})</span>
              </CardTitle>
              <p className="text-sm font-medium text-foreground">{ts.soal.pertanyaan}</p>
            </CardHeader>
            <CardContent>
              {mode === "jawab" ? (
                <SoalForm
                  soal={ts.soal}
                  jawaban={jawaban[ts.soal.id_soal]}
                  onPgTunggal={(idOpsi) => ubahPgTunggal(ts.soal.id_soal, idOpsi)}
                  onPgMcma={(idOpsi, checked) => ubahPgMcma(ts.soal.id_soal, idOpsi, checked)}
                  onKategori={(idOpsi, kategori) => ubahKategori(ts.soal.id_soal, idOpsi, kategori)}
                  onEssay={(teks) => ubahEssay(ts.soal.id_soal, teks)}
                />
              ) : (
                <SoalHasil soal={ts.soal} jawabanList={jawabanHasil.filter((j) => j.id_soal === ts.soal.id_soal)} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {mode === "jawab" && (
        <Button onClick={submit} disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Kumpulkan Jawaban
        </Button>
      )}
    </div>
  )
}

function SoalForm({
  soal,
  jawaban,
  onPgTunggal,
  onPgMcma,
  onKategori,
  onEssay,
}: {
  soal: Soal
  jawaban: JawabanState | undefined
  onPgTunggal: (idOpsi: string) => void
  onPgMcma: (idOpsi: string, checked: boolean) => void
  onKategori: (idOpsi: string, kategori: string) => void
  onEssay: (teks: string) => void
}) {
  if (soal.tipe_soal === "pg_tunggal") {
    return (
      <div className="space-y-2">
        {soal.opsi.map((o) => (
          <label key={o.id_opsi} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2.5 text-sm hover:bg-muted/40">
            <input
              type="radio"
              name={`soal-${soal.id_soal}`}
              checked={jawaban?.id_opsi === o.id_opsi}
              onChange={() => onPgTunggal(o.id_opsi)}
            />
            <span className="font-semibold">{o.label}.</span> {o.isi_opsi}
          </label>
        ))}
      </div>
    )
  }

  if (soal.tipe_soal === "pg_mcma") {
    return (
      <div className="space-y-2">
        {soal.opsi.map((o) => (
          <label key={o.id_opsi} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2.5 text-sm hover:bg-muted/40">
            <input
              type="checkbox"
              checked={jawaban?.id_opsi_list?.includes(o.id_opsi) || false}
              onChange={(e) => onPgMcma(o.id_opsi, e.target.checked)}
            />
            <span className="font-semibold">{o.label}.</span> {o.isi_opsi}
          </label>
        ))}
      </div>
    )
  }

  if (soal.tipe_soal === "pg_kategori") {
    const kategoriList = (soal.daftar_kategori || "").split(",").map((k) => k.trim()).filter(Boolean)
    return (
      <div className="space-y-2">
        {soal.opsi.map((o) => (
          <div key={o.id_opsi} className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm">
            <span className="flex-1">{o.isi_opsi}</span>
            <select
              className={selectClass + " w-auto"}
              value={jawaban?.kategori_jawaban?.[o.id_opsi] || ""}
              onChange={(e) => onKategori(o.id_opsi, e.target.value)}
            >
              <option value="">Pilih kategori</option>
              {kategoriList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    )
  }

  return (
    <textarea
      className={textareaClass}
      rows={4}
      value={jawaban?.jawaban_text || ""}
      onChange={(e) => onEssay(e.target.value)}
      placeholder="Tulis jawaban Anda..."
    />
  )
}

function SoalHasil({ soal, jawabanList }: { soal: Soal; jawabanList: JawabanHasil[] }) {
  if (soal.tipe_soal === "pg_tunggal" || soal.tipe_soal === "pg_mcma") {
    const idTerpilih = new Set(jawabanList.map((j) => j.id_opsi).filter(Boolean))
    return (
      <div className="space-y-2">
        {soal.opsi.map((o) => {
          const dipilih = idTerpilih.has(o.id_opsi)
          return (
            <div
              key={o.id_opsi}
              className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm ${
                o.is_benar ? "border-emerald-500/40 bg-emerald-500/10" : dipilih ? "border-destructive/40 bg-destructive/10" : "border-border"
              }`}
            >
              {o.is_benar ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : dipilih ? (
                <XCircle className="size-4 shrink-0 text-destructive" />
              ) : (
                <span className="size-4 shrink-0" />
              )}
              <span className="font-semibold">{o.label}.</span> {o.isi_opsi}
              {dipilih && <span className="ml-auto text-xs text-muted-foreground">Jawaban Anda</span>}
            </div>
          )
        })}
        {soal.pembahasan && <p className="mt-2 text-xs text-muted-foreground">Pembahasan: {soal.pembahasan}</p>}
      </div>
    )
  }

  if (soal.tipe_soal === "pg_kategori") {
    return (
      <div className="space-y-2">
        {soal.opsi.map((o) => {
          const jwb = jawabanList.find((j) => j.id_opsi === o.id_opsi)
          return (
            <div
              key={o.id_opsi}
              className={`flex flex-wrap items-center gap-2 rounded-lg border p-2.5 text-sm ${
                jwb?.is_benar ? "border-emerald-500/40 bg-emerald-500/10" : "border-destructive/40 bg-destructive/10"
              }`}
            >
              <span className="flex-1">{o.isi_opsi}</span>
              <span className="text-xs text-muted-foreground">Jawaban Anda: {jwb?.jawaban_text || "-"}</span>
              <span className="text-xs font-medium">Kategori benar: {o.kategori}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="rounded-lg border border-border bg-muted/30 p-2.5 text-sm">{jawabanList[0]?.jawaban_text || "-"}</p>
      <p className="text-xs text-muted-foreground">Soal essay dinilai manual oleh guru.</p>
    </div>
  )
}
