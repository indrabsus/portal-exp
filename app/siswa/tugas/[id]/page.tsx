"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, CheckCircle2, ClipboardPaste, Copy, ExternalLink, Loader2, Save, XCircle } from "lucide-react"

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
    <div className="space-y-6 select-text">
      <div className="select-text">
        <Link href="/siswa/tugas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar tugas
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight select-text">{tugas?.judul}</h1>
        <p className="text-sm text-muted-foreground select-text">
          {tugas?.pengajaran?.mapel?.nama_pelajaran || "-"} · {tugas?.pengajaran?.tingkat} {tugas?.pengajaran?.nama_kelas}
        </p>
        {tugas?.deskripsi && <p className="mt-2 text-sm text-muted-foreground select-text whitespace-pre-wrap">{tugas.deskripsi}</p>}
        {tugas?.deadline && (
          <p className="mt-1 text-xs text-muted-foreground select-text">
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

      <div className="space-y-4 select-text">
        {soalList.map((ts, idx) => (
          <Card key={ts.id_tugas_soal} className="dashboard-card select-text">
            <CardHeader className="space-y-2 select-text">
              <div className="flex items-center justify-between gap-2 select-text">
                <CardTitle className="text-sm font-semibold text-muted-foreground select-text">
                  Soal {idx + 1} <span className="font-normal">(bobot {ts.bobot})</span>
                </CardTitle>
                <SalinSoalButton soal={ts.soal} nomor={idx + 1} />
              </div>
              <p className="text-sm font-medium text-foreground select-text whitespace-pre-wrap">{ts.soal.pertanyaan}</p>
            </CardHeader>
            <CardContent className="select-text">
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

function SalinSoalButton({ soal, nomor }: { soal: Soal; nomor: number }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    let text = `Soal ${nomor}: ${soal.pertanyaan}`
    if (soal.opsi && soal.opsi.length > 0) {
      const opsiText = soal.opsi.map((o) => `${o.label}. ${o.isi_opsi}`).join("\n")
      text += `\n\nPilihan Jawaban:\n${opsiText}`
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement("textarea")
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Salin pertanyaan soal ke clipboard"
      className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/50 px-2 py-0.5 text-xs font-normal text-muted-foreground hover:bg-accent hover:text-foreground transition-colors select-none"
    >
      {copied ? (
        <>
          <Check className="size-3 text-emerald-500" />
          <span className="text-emerald-500 font-medium text-[11px]">Tersalin</span>
        </>
      ) : (
        <>
          <Copy className="size-3" />
          <span className="text-[11px]">Salin Soal</span>
        </>
      )}
    </button>
  )
}

function EssayInput({
  value,
  onChange,
}: {
  value: string
  onChange: (teks: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSalin = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      if (textareaRef.current) {
        textareaRef.current.select()
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const handleTempel = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        const textarea = textareaRef.current
        if (textarea) {
          const start = textarea.selectionStart ?? value.length
          const end = textarea.selectionEnd ?? value.length
          const nextVal = value.substring(0, start) + text + value.substring(end)
          onChange(nextVal)
          setTimeout(() => {
            textarea.focus()
            textarea.selectionStart = textarea.selectionEnd = start + text.length
          }, 0)
        } else {
          onChange(value ? `${value}\n${text}` : text)
        }
        setPasted(true)
        setTimeout(() => setPasted(false), 2000)
      }
    } catch {
      textareaRef.current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData?.getData("text")
    if (text !== undefined) {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const nextVal = value.substring(0, start) + text + value.substring(end)
      onChange(nextVal)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + text.length
      }, 0)
    }
  }

  return (
    <div className="space-y-2 select-text">
      <div className="flex items-center justify-end gap-1.5 select-none">
        <button
          type="button"
          onClick={handleTempel}
          title="Tempel teks atau link dari clipboard"
          className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          {pasted ? (
            <>
              <Check className="size-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Tertempel!</span>
            </>
          ) : (
            <>
              <ClipboardPaste className="size-3.5 text-primary" />
              <span>Tempel dari Clipboard</span>
            </>
          )}
        </button>

        {value.trim().length > 0 && (
          <button
            type="button"
            onClick={handleSalin}
            title="Salin jawaban ini"
            className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-muted-foreground" />
                <span>Salin Jawaban</span>
              </>
            )}
          </button>
        )}
      </div>

      <textarea
        ref={textareaRef}
        className={`${textareaClass} select-text font-normal`}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder="Tulis atau tempel jawaban Anda di sini (jawaban teks, catatan, atau link tugas)..."
        autoComplete="off"
        spellCheck="false"
      />
      <p className="text-[11px] text-muted-foreground">
        Catatan: Anda dapat menyalin dan menempel (copy-paste) teks, ringkasan, atau tautan pengumpulan tugas secara bebas (bisa via tombol di atas atau pintasan Ctrl+V / Cmd+V).
      </p>
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
      <div className="space-y-2 select-text">
        {soal.opsi.map((o) => (
          <label
            key={o.id_opsi}
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-2.5 text-sm hover:bg-muted/40 select-text"
          >
            <input
              type="radio"
              name={`soal-${soal.id_soal}`}
              checked={jawaban?.id_opsi === o.id_opsi}
              onChange={() => onPgTunggal(o.id_opsi)}
              className="mt-0.5 shrink-0"
            />
            <span className="font-semibold select-text shrink-0">{o.label}.</span>
            <span
              className="select-text cursor-text flex-1"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                if (!window.getSelection()?.toString()) {
                  onPgTunggal(o.id_opsi)
                }
              }}
            >
              {o.isi_opsi}
            </span>
          </label>
        ))}
      </div>
    )
  }

  if (soal.tipe_soal === "pg_mcma") {
    return (
      <div className="space-y-2 select-text">
        {soal.opsi.map((o) => {
          const isChecked = jawaban?.id_opsi_list?.includes(o.id_opsi) || false
          return (
            <label
              key={o.id_opsi}
              className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-2.5 text-sm hover:bg-muted/40 select-text"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onPgMcma(o.id_opsi, e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              <span className="font-semibold select-text shrink-0">{o.label}.</span>
              <span
                className="select-text cursor-text flex-1"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  if (!window.getSelection()?.toString()) {
                    onPgMcma(o.id_opsi, !isChecked)
                  }
                }}
              >
                {o.isi_opsi}
              </span>
            </label>
          )
        })}
      </div>
    )
  }

  if (soal.tipe_soal === "pg_kategori") {
    const kategoriList = (soal.daftar_kategori || "").split(",").map((k) => k.trim()).filter(Boolean)
    return (
      <div className="space-y-2 select-text">
        {soal.opsi.map((o) => (
          <div key={o.id_opsi} className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm select-text">
            <span className="flex-1 select-text cursor-text">{o.isi_opsi}</span>
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
    <EssayInput
      value={jawaban?.jawaban_text || ""}
      onChange={onEssay}
    />
  )
}

function SoalHasil({ soal, jawabanList }: { soal: Soal; jawabanList: JawabanHasil[] }) {
  if (soal.tipe_soal === "pg_tunggal" || soal.tipe_soal === "pg_mcma") {
    const idTerpilih = new Set(jawabanList.map((j) => j.id_opsi).filter(Boolean))
    return (
      <div className="space-y-2 select-text">
        {soal.opsi.map((o) => {
          const dipilih = idTerpilih.has(o.id_opsi)
          return (
            <div
              key={o.id_opsi}
              className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm select-text ${
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
              <span className="font-semibold select-text">{o.label}.</span>
              <span className="select-text cursor-text flex-1">{o.isi_opsi}</span>
              {dipilih && <span className="ml-auto text-xs text-muted-foreground select-none">Jawaban Anda</span>}
            </div>
          )
        })}
        {soal.pembahasan && (
          <p className="mt-2 text-xs text-muted-foreground select-text">
            <span className="font-medium text-foreground">Pembahasan:</span> {soal.pembahasan}
          </p>
        )}
      </div>
    )
  }

  if (soal.tipe_soal === "pg_kategori") {
    return (
      <div className="space-y-2 select-text">
        {soal.opsi.map((o) => {
          const jwb = jawabanList.find((j) => j.id_opsi === o.id_opsi)
          return (
            <div
              key={o.id_opsi}
              className={`flex flex-wrap items-center gap-2 rounded-lg border p-2.5 text-sm select-text ${
                jwb?.is_benar ? "border-emerald-500/40 bg-emerald-500/10" : "border-destructive/40 bg-destructive/10"
              }`}
            >
              <span className="flex-1 select-text cursor-text">{o.isi_opsi}</span>
              <span className="text-xs text-muted-foreground select-text">Jawaban Anda: {jwb?.jawaban_text || "-"}</span>
              <span className="text-xs font-medium select-text">Kategori benar: {o.kategori}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const jawabanTeks = jawabanList[0]?.jawaban_text || ""
  const linkList = ekstraksiLink(jawabanTeks)

  return (
    <div className="space-y-2 select-text">
      {linkList.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 p-2 text-xs">
          <span className="font-semibold text-primary">Tautan Terkumpul:</span>
          {linkList.map((l, i) => (
            <a
              key={i}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 hover:underline transition-colors break-all"
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="max-w-[280px] truncate">{l.display}</span>
            </a>
          ))}
        </div>
      )}
      <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-sm select-text cursor-text whitespace-pre-wrap break-words leading-relaxed">
        <TeksDenganLink teks={jawabanTeks} />
      </div>
      <p className="text-xs text-muted-foreground">Soal essay dinilai manual oleh guru.</p>
    </div>
  )
}

function ekstraksiLink(teks: string | null | undefined): Array<{ href: string; display: string }> {
  if (!teks) return []
  const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi
  const matches = teks.match(urlRegex) || []
  return matches.map((raw) => {
    let url = raw
    const matchTrailing = url.match(/[.,;:!?)\]]+$/)
    if (matchTrailing) {
      url = url.slice(0, -matchTrailing[0].length)
    }
    const href = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`
    return { href, display: url }
  })
}

function TeksDenganLink({ teks }: { teks: string | null | undefined }) {
  if (!teks) return <span className="text-muted-foreground">-</span>

  const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi
  const parts = teks.split(urlRegex)

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null

        if (/^(https?:\/\/|www\.)/i.test(part)) {
          let url = part
          let trailing = ""
          const matchTrailing = url.match(/[.,;:!?)\]]+$/)
          if (matchTrailing) {
            trailing = matchTrailing[0]
            url = url.slice(0, -trailing.length)
          }

          const href = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`

          return (
            <span key={index} className="inline">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-primary underline underline-offset-2 hover:text-primary/80 break-all"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{url}</span>
                <ExternalLink className="inline size-3 shrink-0" />
              </a>
              {trailing}
            </span>
          )
        }

        return <span key={index}>{part}</span>
      })}
    </>
  )
}
