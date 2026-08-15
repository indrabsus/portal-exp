"use client"

import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import Image from "next/image"
import {
  BookMarked,
  Eye,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react"

import { apiFetch, getAssetUrl } from "@/lib/api"
import { useTableControls } from "@/lib/use-table-controls"
import { cn } from "@/lib/utils"
import { printPortraitA4 } from "@/lib/print-portrait"
import { KopSuratPrint } from "@/components/kop-surat-print"
import { Modal } from "@/components/modal"
import { SortableTh } from "@/components/sortable-th"
import { TablePagination } from "@/components/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TipeSoal = "pg_tunggal" | "pg_mcma" | "pg_kategori" | "essay"

type Opsi = {
  id_opsi?: string
  label: string
  isi_opsi: string
  gambar_url: string | null
  kategori: string | null
  is_benar: boolean
}

type Soal = {
  id_soal: string
  id_mapel: string | null
  tipe_soal: TipeSoal
  daftar_kategori: string | null
  pertanyaan: string
  gambar_url: string | null
  tingkat_kesulitan: "mudah" | "sedang" | "sulit"
  pembahasan: string | null
  nama_pembuat: string | null
  mapel?: { nama_pelajaran: string }
  opsi: Opsi[]
}

type Mengajar = { id_mapel: string; mapel?: { nama_pelajaran: string } }
type MapelOption = { id_mapel: string; nama_pelajaran: string }

const LABELS = ["A", "B", "C", "D", "E", "F"]

const TIPE_OPTIONS: { value: TipeSoal; label: string }[] = [
  { value: "pg_tunggal", label: "PG Sederhana" },
  { value: "pg_mcma", label: "PG MCMA" },
  { value: "pg_kategori", label: "PG Kategori" },
  { value: "essay", label: "Essay" },
]

const TIPE_LABEL: Record<TipeSoal, string> = {
  pg_tunggal: "PG Sederhana",
  pg_mcma: "PG MCMA",
  pg_kategori: "PG Kategori",
  essay: "Essay",
}

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

const KESULITAN_LABEL: Record<string, string> = { mudah: "Mudah", sedang: "Sedang", sulit: "Sulit" }

function opsiKosong(): Opsi[] {
  return [
    { label: "A", isi_opsi: "", gambar_url: null, kategori: null, is_benar: true },
    { label: "B", isi_opsi: "", gambar_url: null, kategori: null, is_benar: false },
  ]
}

async function uploadGambar(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("gambar", file)
  const res = await apiFetch("/bank-soal/upload-gambar", { method: "POST", body: formData })
  return res.data.url as string
}

type PrintMode = "jawaban" | "soal" | null

function SoalCetak({ row, index, withAnswer }: { row: Soal; index: number; withAnswer: boolean }) {
  return (
    <div className="mb-4 break-inside-avoid">
      <p className="font-semibold">
        {index + 1}. {row.pertanyaan}
      </p>
      {row.gambar_url && (
        // eslint-disable-next-line @next/next/no-img-element -- kop cetak butuh <img> statis
        <img src={getAssetUrl(row.gambar_url) || ""} alt="" className="my-2 max-h-56 max-w-full object-contain" />
      )}

      {row.tipe_soal === "essay" ? (
        <div className="mt-3 ml-4">
          <div className="mb-4 border-b border-black" />
          <div className="mb-4 border-b border-black" />
          <div className="mb-4 border-b border-black" />
        </div>
      ) : row.tipe_soal === "pg_kategori" ? (
        <div className="mt-1 ml-4">
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1 text-left font-semibold">Item</th>
                {(row.daftar_kategori ?? "").split(",").filter(Boolean).map((k) => (
                  <th key={k} className="border border-black px-2 py-1 font-semibold">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(row.opsi ?? []).map((o) => (
                <tr key={o.label}>
                  <td className="border border-black px-2 py-1.5">
                    {o.label}. {o.isi_opsi}
                  </td>
                  {(row.daftar_kategori ?? "").split(",").filter(Boolean).map((k) => (
                    <td key={k} className="border border-black px-2 py-1.5 text-center">
                      <span className="relative inline-flex size-3.5 items-center justify-center rounded-full border border-black align-middle">
                        {withAnswer && o.kategori === k && <span className="size-1.5 rounded-full bg-black" />}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-1 ml-4">
          {(row.opsi ?? []).map((o) => (
            <p key={o.label} className={cn("mb-0.5", withAnswer && o.is_benar && "font-bold underline")}>
              {o.label}. {o.isi_opsi}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function SoalPreviewModal({ row, onClose }: { row: Soal; onClose: () => void }) {
  return (
    <Modal title="Preview - Tampilan untuk Siswa" onClose={onClose} maxWidthClassName="max-w-xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{TIPE_LABEL[row.tipe_soal]}</Badge>
          <Badge variant="secondary">{KESULITAN_LABEL[row.tingkat_kesulitan]}</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{row.pertanyaan}</p>
          {row.gambar_url && (
            <Image
              src={getAssetUrl(row.gambar_url) || ""}
              alt=""
              width={400}
              height={300}
              className="max-h-64 w-auto rounded-lg object-contain"
              unoptimized
            />
          )}
        </div>

        {row.tipe_soal === "essay" && (
          <textarea
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none dark:bg-input/30"
            rows={4}
            placeholder="Tulis jawaban Anda di sini..."
            disabled
          />
        )}

        {(row.tipe_soal === "pg_tunggal" || row.tipe_soal === "pg_mcma") && (
          <div className="space-y-2">
            {(row.opsi ?? []).map((o) => (
              <label
                key={o.label}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 hover:bg-muted/40"
              >
                <input type={row.tipe_soal === "pg_tunggal" ? "radio" : "checkbox"} name="preview-jawaban" />
                {o.gambar_url && (
                  <Image src={getAssetUrl(o.gambar_url) || ""} alt="" width={40} height={40} className="size-10 rounded-md object-cover" unoptimized />
                )}
                <span className="text-sm">
                  {o.label}. {o.isi_opsi}
                </span>
              </label>
            ))}
          </div>
        )}

        {row.tipe_soal === "pg_kategori" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Centang kolom kategori yang sesuai untuk tiap item.</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="border-b border-border px-2.5 py-2 text-left font-medium">Item</th>
                    {(row.daftar_kategori ?? "").split(",").filter(Boolean).map((k) => (
                      <th key={k} className="border-b border-l border-border px-2.5 py-2 font-medium">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(row.opsi ?? []).map((o) => (
                    <tr key={o.label} className="odd:bg-muted/10">
                      <td className="px-2.5 py-2">
                        <div className="flex items-center gap-2">
                          {o.gambar_url && (
                            <Image src={getAssetUrl(o.gambar_url) || ""} alt="" width={32} height={32} className="size-8 shrink-0 rounded-md object-cover" unoptimized />
                          )}
                          <span>
                            {o.label}. {o.isi_opsi}
                          </span>
                        </div>
                      </td>
                      {(row.daftar_kategori ?? "").split(",").filter(Boolean).map((k) => (
                        <td key={k} className="border-l border-border px-2.5 py-2 text-center">
                          <input type="radio" name={`preview-kategori-${o.label}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Ini simulasi tampilan untuk siswa - jawaban dan penilaian tidak tersimpan di sini.
        </p>
      </div>
    </Modal>
  )
}

export default function BankSoalPage() {
  const [data, setData] = useState<Soal[]>([])
  const [mapelOptions, setMapelOptions] = useState<MapelOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Soal | null>(null)
  const [idMapel, setIdMapel] = useState("")
  const [tipeSoal, setTipeSoal] = useState<TipeSoal>("pg_tunggal")
  const [pertanyaan, setPertanyaan] = useState("")
  const [gambarSoal, setGambarSoal] = useState<string | null>(null)
  const [uploadingSoal, setUploadingSoal] = useState(false)
  const [tingkatKesulitan, setTingkatKesulitan] = useState("sedang")
  const [pembahasan, setPembahasan] = useState("")
  const [opsi, setOpsi] = useState<Opsi[]>(opsiKosong())
  const [daftarKategori, setDaftarKategori] = useState<string[]>(["", ""])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploadingOpsiIdx, setUploadingOpsiIdx] = useState<number | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

  const [previewSoal, setPreviewSoal] = useState<Soal | null>(null)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [namaGuruCetak, setNamaGuruCetak] = useState("")
  const [kelasCetak, setKelasCetak] = useState("")
  const [printMode, setPrintMode] = useState<PrintMode>(null)

  const fileInputSoalRef = useRef<HTMLInputElement>(null)
  const fileInputOpsiRef = useRef<HTMLInputElement>(null)
  const opsiUploadTarget = useRef<number | null>(null)

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch("/bank-soal")
      setData(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([apiFetch("/bank-soal"), apiFetch("/mengajar")])
      .then(([soalRes, mengajarRes]) => {
        if (cancelled) return
        const soalList: Soal[] = soalRes.data || []
        setData(soalList)
        setNamaGuruCetak((prev) => prev || soalList[0]?.nama_pembuat || "")

        const mengajarList: Mengajar[] = mengajarRes.data || []
        const uniqueMap = new Map<string, MapelOption>()
        mengajarList.forEach((m) => {
          if (m.id_mapel && !uniqueMap.has(m.id_mapel)) {
            uniqueMap.set(m.id_mapel, { id_mapel: m.id_mapel, nama_pelajaran: m.mapel?.nama_pelajaran || "-" })
          }
        })
        setMapelOptions(Array.from(uniqueMap.values()))
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

  const {
    rows,
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalRows,
  } = useTableControls(data, {
    searchFields: (row) => [row.pertanyaan, row.mapel?.nama_pelajaran],
    getSortValue: (row, key) => {
      if (key === "mapel") return row.mapel?.nama_pelajaran
      if (key === "tipe") return row.tipe_soal
      if (key === "kesulitan") return row.tingkat_kesulitan
      return null
    },
    initialSortKey: null,
  })

  const bukaTambah = () => {
    setEditing(null)
    setIdMapel(mapelOptions[0]?.id_mapel || "")
    setTipeSoal("pg_tunggal")
    setPertanyaan("")
    setGambarSoal(null)
    setTingkatKesulitan("sedang")
    setPembahasan("")
    setOpsi(opsiKosong())
    setDaftarKategori(["", ""])
    setFormError(null)
    setFormOpen(true)
  }

  const bukaEdit = (item: Soal) => {
    setEditing(item)
    setIdMapel(item.id_mapel || "")
    setTipeSoal(item.tipe_soal)
    setPertanyaan(item.pertanyaan)
    setGambarSoal(item.gambar_url)
    setTingkatKesulitan(item.tingkat_kesulitan)
    setPembahasan(item.pembahasan || "")
    setOpsi(item.opsi.length > 0 ? item.opsi.map((o) => ({ ...o })) : opsiKosong())
    setDaftarKategori(
      item.daftar_kategori ? item.daftar_kategori.split(",").map((k) => k.trim()) : ["", ""]
    )
    setFormError(null)
    setFormOpen(true)
  }

  const pilihGambarSoal = () => fileInputSoalRef.current?.click()

  const onFileSoalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setUploadingSoal(true)
    try {
      const url = await uploadGambar(file)
      setGambarSoal(url)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal mengupload gambar.")
    } finally {
      setUploadingSoal(false)
    }
  }

  const pilihGambarOpsi = (idx: number) => {
    opsiUploadTarget.current = idx
    fileInputOpsiRef.current?.click()
  }

  const onFileOpsiChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    const idx = opsiUploadTarget.current
    if (!file || idx === null) return

    setUploadingOpsiIdx(idx)
    try {
      const url = await uploadGambar(file)
      setOpsi((prev) => prev.map((o, i) => (i === idx ? { ...o, gambar_url: url } : o)))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal mengupload gambar.")
    } finally {
      setUploadingOpsiIdx(null)
    }
  }

  const tambahOpsi = () => {
    if (opsi.length >= LABELS.length) return
    setOpsi((prev) => [...prev, { label: LABELS[prev.length], isi_opsi: "", gambar_url: null, kategori: null, is_benar: false }])
  }

  const hapusOpsi = (idx: number) => {
    if (opsi.length <= 2) return
    setOpsi((prev) => prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, label: LABELS[i] })))
  }

  const ubahOpsi = (idx: number, isi_opsi: string) => {
    setOpsi((prev) => prev.map((o, i) => (i === idx ? { ...o, isi_opsi } : o)))
  }

  const ubahKategoriOpsi = (idx: number, kategori: string) => {
    setOpsi((prev) => prev.map((o, i) => (i === idx ? { ...o, kategori } : o)))
  }

  const toggleJawabanBenar = (idx: number) => {
    setOpsi((prev) =>
      prev.map((o, i) => {
        if (tipeSoal === "pg_tunggal") return { ...o, is_benar: i === idx }
        if (i === idx) return { ...o, is_benar: !o.is_benar }
        return o
      })
    )
  }

  const ubahDaftarKategori = (idx: number, value: string) => {
    setDaftarKategori((prev) => prev.map((k, i) => (i === idx ? value : k)))
  }

  const tambahKategori = () => setDaftarKategori((prev) => [...prev, ""])

  const hapusKategori = (idx: number) => {
    if (daftarKategori.length <= 2) return
    setDaftarKategori((prev) => prev.filter((_, i) => i !== idx))
  }

  const submit = async () => {
    setFormError(null)

    if (!pertanyaan.trim()) {
      setFormError("Pertanyaan wajib diisi.")
      return
    }

    const kategoriBersih = daftarKategori.map((k) => k.trim()).filter(Boolean)

    if (tipeSoal === "pg_kategori") {
      if (kategoriBersih.length < 2) {
        setFormError("Buat minimal dua kategori.")
        return
      }
      if (opsi.some((o) => !o.kategori)) {
        setFormError("Setiap item wajib ditempatkan ke salah satu kategori.")
        return
      }
    } else if (tipeSoal !== "essay") {
      if (opsi.some((o) => !o.isi_opsi.trim() && !o.gambar_url)) {
        setFormError("Setiap opsi wajib diisi teks atau gambar.")
        return
      }
      const jumlahBenar = opsi.filter((o) => o.is_benar).length
      if (tipeSoal === "pg_tunggal" && jumlahBenar !== 1) {
        setFormError("Tentukan tepat satu jawaban benar.")
        return
      }
      if (tipeSoal === "pg_mcma" && jumlahBenar < 2) {
        setFormError("Tentukan minimal dua jawaban benar untuk MCMA.")
        return
      }
    }

    setSubmitting(true)

    const payload = {
      id_mapel: idMapel,
      tipe_soal: tipeSoal,
      pertanyaan: pertanyaan.trim(),
      gambar_url: gambarSoal || "",
      tingkat_kesulitan: tingkatKesulitan,
      pembahasan: pembahasan.trim(),
      opsi: tipeSoal === "essay" ? [] : opsi,
      daftar_kategori: tipeSoal === "pg_kategori" ? kategoriBersih : [],
    }

    try {
      if (editing) {
        await apiFetch(`/bank-soal/${editing.id_soal}`, { method: "PUT", body: JSON.stringify(payload) })
      } else {
        await apiFetch("/bank-soal", { method: "POST", body: JSON.stringify(payload) })
      }
      setFormOpen(false)
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan soal.")
    } finally {
      setSubmitting(false)
    }
  }

  const hapus = async (item: Soal) => {
    if (!window.confirm("Hapus soal ini? Aksi ini tidak bisa dibatalkan.")) return

    setProcessingId(item.id_soal)

    try {
      await apiFetch(`/bank-soal/${item.id_soal}`, { method: "DELETE" })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus soal.")
    } finally {
      setProcessingId(null)
    }
  }

  const selectedRows = data.filter((r) => selected.has(r.id_soal))
  const pageAllSelected = rows.length > 0 && rows.every((r) => selected.has(r.id_soal))

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (pageAllSelected) {
        rows.forEach((r) => next.delete(r.id_soal))
      } else {
        rows.forEach((r) => next.add(r.id_soal))
      }
      return next
    })
  }

  const handleCetak = (mode: "jawaban" | "soal") => {
    if (selectedRows.length === 0) return
    flushSync(() => setPrintMode(mode))
    printPortraitA4()
    setPrintMode(null)
  }

  const mapelCetakLabel = Array.from(new Set(selectedRows.map((r) => r.mapel?.nama_pelajaran ?? "-"))).join(", ")

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank Soal</h1>
          <p className="text-sm text-muted-foreground">
            Soal milik Anda sendiri - tidak terlihat oleh guru lain. Mata pelajaran mengikuti pembagian mengajar Anda.
          </p>
        </div>
        <Button onClick={bukaTambah} disabled={mapelOptions.length === 0}>
          <Plus className="w-4 h-4" />
          Tambah Soal
        </Button>
      </div>

      {mapelOptions.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          Anda belum punya pembagian mengajar. Tambahkan dulu di menu Pembagian Mengajar.
        </p>
      )}

      <Card className="dashboard-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-col gap-1.5">
            <Label>Nama Guru (untuk cetak)</Label>
            <Input
              value={namaGuruCetak}
              onChange={(e) => setNamaGuruCetak(e.target.value)}
              placeholder="mis. Indra Batara, S.Pd, Gr"
              className="sm:w-56"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Kelas (untuk cetak)</Label>
            <Input
              value={kelasCetak}
              onChange={(e) => setKelasCetak(e.target.value)}
              placeholder="mis. XII PPLG 1"
              className="sm:w-56"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={selectedRows.length === 0} onClick={() => handleCetak("soal")}>
            <Printer className="w-4 h-4" />
            Cetak Soal Saja ({selectedRows.length})
          </Button>
          <Button disabled={selectedRows.length === 0} onClick={() => handleCetak("jawaban")}>
            <Printer className="w-4 h-4" />
            Cetak Soal + Jawaban ({selectedRows.length})
          </Button>
        </div>
      </Card>

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-muted-foreground" />
            Daftar Soal
          </CardTitle>
          <div className="relative w-full max-w-56">
            <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pertanyaan atau mapel..." className="pl-8" />
          </div>
        </CardHeader>

        {error && <p className="px-4 pt-3 text-sm text-destructive">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat data...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="w-10 px-4 py-2.5">
                      <input type="checkbox" checked={pageAllSelected} onChange={toggleSelectAllOnPage} />
                    </th>
                    <SortableTh label="Mapel" sortKey="mapel" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">Pertanyaan</th>
                    <SortableTh label="Tipe" sortKey="tipe" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Kesulitan" sortKey="kesulitan" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Belum ada soal di bank soal.
                      </td>
                    </tr>
                  ) : (
                    rows.map((item) => {
                      const isBusy = processingId === item.id_soal
                      return (
                        <tr key={item.id_soal} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5">
                            <input type="checkbox" checked={selected.has(item.id_soal)} onChange={() => toggleSelect(item.id_soal)} />
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">{item.mapel?.nama_pelajaran || "-"}</td>
                          <td className="px-4 py-2.5 font-medium max-w-md">
                            <div className="flex items-center gap-2">
                              {item.gambar_url && (
                                <Image
                                  src={getAssetUrl(item.gambar_url) || ""}
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="size-9 shrink-0 rounded-md object-cover"
                                  unoptimized
                                />
                              )}
                              <p className="line-clamp-2">{item.pertanyaan}</p>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline">{TIPE_LABEL[item.tipe_soal]}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">{KESULITAN_LABEL[item.tingkat_kesulitan]}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon-sm" onClick={() => setPreviewSoal(item)} title="Preview untuk siswa">
                                <Eye className="w-3.5 h-3.5" />
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

            <TablePagination page={page} totalPages={totalPages} totalRows={totalRows} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </Card>

      {formOpen && (
        <Modal title={editing ? "Edit Soal" : "Tambah Soal"} onClose={() => setFormOpen(false)} maxWidthClassName="max-w-xl">
          <div className="space-y-3">
            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Mata Pelajaran</label>
                <select className={selectClass} value={idMapel} onChange={(e) => setIdMapel(e.target.value)} disabled={submitting}>
                  {mapelOptions.map((m) => (
                    <option key={m.id_mapel} value={m.id_mapel}>
                      {m.nama_pelajaran}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tingkat Kesulitan</label>
                <select className={selectClass} value={tingkatKesulitan} onChange={(e) => setTingkatKesulitan(e.target.value)} disabled={submitting}>
                  <option value="mudah">Mudah</option>
                  <option value="sedang">Sedang</option>
                  <option value="sulit">Sulit</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tipe Soal</label>
              <div className="grid grid-cols-4 gap-1.5">
                {TIPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTipeSoal(opt.value)}
                    disabled={submitting}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                      tipeSoal === opt.value ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Pertanyaan</label>
              <textarea className={textareaClass} rows={3} value={pertanyaan} onChange={(e) => setPertanyaan(e.target.value)} disabled={submitting} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Gambar Soal (opsional)</label>
              <input ref={fileInputSoalRef} type="file" accept="image/*" className="hidden" onChange={onFileSoalChange} />
              {gambarSoal ? (
                <div className="flex items-center gap-2">
                  <Image src={getAssetUrl(gambarSoal) || ""} alt="" width={64} height={64} className="size-16 rounded-lg object-cover" unoptimized />
                  <Button variant="outline" size="sm" onClick={() => setGambarSoal(null)} disabled={submitting}>
                    <X className="w-3.5 h-3.5" />
                    Hapus Gambar
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={pilihGambarSoal} disabled={submitting || uploadingSoal}>
                  {uploadingSoal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                  Upload Gambar
                </Button>
              )}
            </div>

            <input ref={fileInputOpsiRef} type="file" accept="image/*" className="hidden" onChange={onFileOpsiChange} />

            {tipeSoal === "pg_kategori" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Daftar Kategori</label>
                  <button type="button" onClick={tambahKategori} className="text-xs font-medium text-primary hover:underline">
                    + Tambah kategori
                  </button>
                </div>
                <div className="space-y-2">
                  {daftarKategori.map((k, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={k}
                        onChange={(e) => ubahDaftarKategori(idx, e.target.value)}
                        placeholder={`Nama kategori ${idx + 1}`}
                        disabled={submitting}
                      />
                      {daftarKategori.length > 2 && (
                        <Button variant="ghost" size="icon-sm" onClick={() => hapusKategori(idx)} disabled={submitting}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(tipeSoal === "pg_tunggal" || tipeSoal === "pg_mcma" || tipeSoal === "pg_kategori") && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    {tipeSoal === "pg_kategori" ? "Item (pilih kategori untuk masing-masing)" : "Opsi Jawaban (pilih yang benar)"}
                  </label>
                  {opsi.length < LABELS.length && (
                    <button type="button" onClick={tambahOpsi} className="text-xs font-medium text-primary hover:underline">
                      + Tambah {tipeSoal === "pg_kategori" ? "item" : "opsi"}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {opsi.map((o, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 rounded-lg border border-border p-2">
                      <div className="flex items-center gap-2">
                        {tipeSoal !== "pg_kategori" && (
                          <button
                            type="button"
                            onClick={() => toggleJawabanBenar(idx)}
                            disabled={submitting}
                            className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                              o.is_benar ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                            title="Tandai sebagai jawaban benar"
                          >
                            {o.label}
                          </button>
                        )}
                        {o.gambar_url ? (
                          <div className="relative shrink-0">
                            <Image src={getAssetUrl(o.gambar_url) || ""} alt="" width={36} height={36} className="size-9 rounded-md object-cover" unoptimized />
                            <button
                              type="button"
                              onClick={() => setOpsi((prev) => prev.map((op, i) => (i === idx ? { ...op, gambar_url: null } : op)))}
                              className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-white"
                            >
                              <X className="size-2.5" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            className="shrink-0"
                            onClick={() => pilihGambarOpsi(idx)}
                            disabled={submitting || uploadingOpsiIdx === idx}
                          >
                            {uploadingOpsiIdx === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                        <Input
                          value={o.isi_opsi}
                          onChange={(e) => ubahOpsi(idx, e.target.value)}
                          placeholder={tipeSoal === "pg_kategori" ? `Teks item ${idx + 1} (opsional jika ada gambar)` : `Opsi ${o.label}`}
                          disabled={submitting}
                          className="min-w-0 flex-1"
                        />
                        {opsi.length > 2 && (
                          <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={() => hapusOpsi(idx)} disabled={submitting}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {tipeSoal === "pg_kategori" && (
                        <select
                          className={selectClass}
                          value={o.kategori || ""}
                          onChange={(e) => ubahKategoriOpsi(idx, e.target.value)}
                          disabled={submitting}
                        >
                          <option value="">Pilih kategori untuk item ini</option>
                          {daftarKategori.filter((k) => k.trim()).map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Pembahasan (opsional)</label>
              <textarea className={textareaClass} rows={2} value={pembahasan} onChange={(e) => setPembahasan(e.target.value)} disabled={submitting} />
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

      {previewSoal && <SoalPreviewModal row={previewSoal} onClose={() => setPreviewSoal(null)} />}
      </div>

      <div className="print-exact sr-only bg-white text-black print:not-sr-only">
        <KopSuratPrint />

        {printMode && (
          <>
            <p className="mt-4 text-center text-base font-bold uppercase">
              {printMode === "jawaban" ? "Naskah Soal & Kunci Jawaban" : "Naskah Soal"}
            </p>

            <div className="mt-4 mb-4 text-sm">
              <p>Nama Guru : {namaGuruCetak || "-"}</p>
              <p>Mata Pelajaran : {mapelCetakLabel || "-"}</p>
              <p>Kelas : {kelasCetak || "-"}</p>
            </div>

            <div className="text-sm">
              {selectedRows.map((row, idx) => (
                <SoalCetak key={row.id_soal} row={row} index={idx} withAnswer={printMode === "jawaban"} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
