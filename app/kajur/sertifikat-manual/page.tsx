"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Award,
  Ban,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react"

import { apiFetch } from "@/lib/api"
import { useTableControls } from "@/lib/use-table-controls"
import { Modal } from "@/components/modal"
import { SortableTh } from "@/components/sortable-th"
import { TablePagination } from "@/components/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type SiswaOption = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  kelas: string
}

type NilaiItem = {
  kompetensi: string
  nilai: number
}

type SertifikatRow = {
  id_sertifikat: string
  nomor_sertifikat: string
  judul_manual: string
  tipe_sertifikat?: "kompetensi" | "mengikuti" | string | null
  keterangan_custom?: string | null
  nilai: number | null
  daftar_nilai?: NilaiItem[] | null
  status: "aktif" | "dicabut"
  created_at: string
  nama_kepsek: string | null
  siswa?: { nama_lengkap: string }
}

type InputDaftarNilai = {
  kompetensi: string
  nilai: string
}

const SEMUA_KELAS = "__semua__"

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"

export default function SertifikatManualPage() {
  const [rows, setRows] = useState<SertifikatRow[]>([])
  const [siswaList, setSiswaList] = useState<SiswaOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [selectedSiswa, setSelectedSiswa] = useState<Set<string>>(new Set())
  const [filterKelas, setFilterKelas] = useState(SEMUA_KELAS)
  const [filterNama, setFilterNama] = useState("")

  // Form states
  const [tipeSertifikat, setTipeSertifikat] = useState<"kompetensi" | "mengikuti">("kompetensi")
  const [judulManual, setJudulManual] = useState("")
  const [keteranganCustom, setKeteranganCustom] = useState("")
  const [daftarNilai, setDaftarNilai] = useState<InputDaftarNilai[]>([
    { kompetensi: "", nilai: "" },
  ])
  const [nilai, setNilai] = useState("")
  const [sertakanKepsek, setSertakanKepsek] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

  const {
    rows: tableRows,
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
  } = useTableControls(rows, {
    searchFields: (row) => [row.nomor_sertifikat, row.judul_manual, row.siswa?.nama_lengkap],
    getSortValue: (row, key) => {
      if (key === "nomor") return row.nomor_sertifikat
      if (key === "siswa") return row.siswa?.nama_lengkap
      if (key === "judul") return row.judul_manual
      if (key === "nilai") return row.nilai
      if (key === "status") return row.status
      return null
    },
    initialSortKey: "nomor",
    initialSortDir: "desc",
  })

  const muatData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [certRes, siswaRes] = await Promise.all([
        apiFetch("/sertifikat/manual"),
        apiFetch("/sertifikat/siswa-jurusan"),
      ])
      setRows(certRes.data || [])
      setSiswaList(siswaRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([apiFetch("/sertifikat/manual"), apiFetch("/sertifikat/siswa-jurusan")])
      .then(([certRes, siswaRes]) => {
        if (cancelled) return
        setRows(certRes.data || [])
        setSiswaList(siswaRes.data || [])
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

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas))).sort()

  const filteredSiswa = siswaList.filter(
    (s) =>
      (filterKelas === SEMUA_KELAS || s.kelas === filterKelas) &&
      s.nama_lengkap.toLowerCase().includes(filterNama.toLowerCase())
  )
  const allFilteredSelected =
    filteredSiswa.length > 0 && filteredSiswa.every((s) => selectedSiswa.has(s.id_siswa))

  const bukaTambah = () => {
    setSelectedSiswa(new Set())
    setFilterKelas(SEMUA_KELAS)
    setFilterNama("")
    setTipeSertifikat("kompetensi")
    setJudulManual("")
    setKeteranganCustom("")
    setDaftarNilai([{ kompetensi: "", nilai: "" }])
    setNilai("")
    setSertakanKepsek(false)
    setFormError(null)
    setAddOpen(true)
  }

  const toggleSiswa = (id: string) => {
    setSelectedSiswa((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllFiltered = () => {
    setSelectedSiswa((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filteredSiswa.forEach((s) => next.delete(s.id_siswa))
      } else {
        filteredSiswa.forEach((s) => next.add(s.id_siswa))
      }
      return next
    })
  }

  // Pengelolaan baris nilai kompetensi
  const tambahBarisKompetensi = () => {
    setDaftarNilai((prev) => [...prev, { kompetensi: "", nilai: "" }])
  }

  const hapusBarisKompetensi = (index: number) => {
    setDaftarNilai((prev) => {
      const copy = [...prev]
      copy.splice(index, 1)
      return copy.length > 0 ? copy : [{ kompetensi: "", nilai: "" }]
    })
  }

  const updateBarisKompetensi = (index: number, field: "kompetensi" | "nilai", val: string) => {
    setDaftarNilai((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: val }
      return copy
    })
  }

  // Hitung rata-rata otomatis dari baris kompetensi yang valid
  const validKompetensi = daftarNilai.filter(
    (d) => d.kompetensi.trim() && d.nilai.trim() && !isNaN(Number(d.nilai))
  )
  const rataRataOtomatis =
    validKompetensi.length > 0
      ? (
          validKompetensi.reduce((sum, item) => sum + Number(item.nilai), 0) /
          validKompetensi.length
        ).toFixed(1)
      : null

  const submit = async () => {
    setFormError(null)

    if (selectedSiswa.size === 0 || !judulManual.trim()) {
      setFormError("Pilih minimal satu siswa dan isi judul kegiatan/kompetensi.")
      return
    }

    // Validasi daftar nilai
    const cleanedDaftar: NilaiItem[] = []
    for (let i = 0; i < daftarNilai.length; i++) {
      const item = daftarNilai[i]
      const k = item.kompetensi.trim()
      const n = item.nilai.trim()

      if (k && n) {
        const val = Number(n)
        if (!Number.isFinite(val) || val < 0 || val > 100) {
          setFormError(`Nilai untuk "${k}" harus berupa angka 0 - 100.`)
          return
        }
        cleanedDaftar.push({ kompetensi: k, nilai: Math.round(val) })
      } else if (k && !n) {
        setFormError(`Nilai untuk "${k}" belum diisi.`)
        return
      }
    }

    if (nilai.trim() !== "") {
      const n = Number(nilai)
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        setFormError("Nilai akhir harus berupa angka 0-100, atau kosongkan jika tidak perlu.")
        return
      }
    }

    setSubmitting(true)

    try {
      const res = await apiFetch("/sertifikat/manual", {
        method: "POST",
        body: JSON.stringify({
          id_siswa_list: Array.from(selectedSiswa),
          judul_manual: judulManual.trim(),
          tipe_sertifikat: tipeSertifikat,
          keterangan_custom: keteranganCustom.trim() || undefined,
          daftar_nilai: cleanedDaftar.length > 0 ? cleanedDaftar : undefined,
          nilai: nilai.trim() !== "" ? nilai.trim() : undefined,
          sertakan_kepsek: sertakanKepsek,
        }),
      })
      setAddOpen(false)
      setInfo(res.message)
      await muatData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menerbitkan sertifikat.")
    } finally {
      setSubmitting(false)
    }
  }

  const cabut = async (row: SertifikatRow) => {
    setProcessingId(row.id_sertifikat)
    try {
      await apiFetch(`/sertifikat/${row.id_sertifikat}/cabut`, { method: "PUT" })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal mencabut sertifikat.")
    } finally {
      setProcessingId(null)
    }
  }

  const aktifkan = async (row: SertifikatRow) => {
    setProcessingId(row.id_sertifikat)
    try {
      await apiFetch(`/sertifikat/${row.id_sertifikat}/aktifkan`, { method: "PUT" })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal mengaktifkan sertifikat.")
    } finally {
      setProcessingId(null)
    }
  }

  const hapus = async (row: SertifikatRow) => {
    if (
      !window.confirm(
        `Hapus sertifikat "${row.judul_manual}" milik ${row.siswa?.nama_lengkap}? Aksi ini tidak bisa dibatalkan.`
      )
    ) {
      return
    }

    setProcessingId(row.id_sertifikat)

    try {
      await apiFetch(`/sertifikat/${row.id_sertifikat}`, { method: "DELETE" })
      await muatData()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus sertifikat.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sertifikat Manual</h1>
          <p className="text-sm text-muted-foreground">
            Terbitkan sertifikat kompetensi atau kepesertaan pelatihan dengan rincian nilai kompetensi untuk siswa jurusan Anda.
          </p>
        </div>
        <Button onClick={bukaTambah}>
          <Plus className="w-4 h-4" />
          Buat Sertifikat Manual
        </Button>
      </div>

      {info && (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{info}</p>
      )}

      <Card className="dashboard-card overflow-hidden py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-4 h-4 text-muted-foreground" />
            Daftar Sertifikat
          </CardTitle>
          <div className="relative w-full max-w-56">
            <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor, siswa, judul..."
              className="pl-8"
            />
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
                    <SortableTh label="No. Sertifikat" sortKey="nomor" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Siswa" sortKey="siswa" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Jenis / Judul" sortKey="judul" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Nilai" sortKey="nilai" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Belum ada sertifikat manual.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row) => {
                      const isBusy = processingId === row.id_sertifikat
                      const isMengikuti = row.tipe_sertifikat === "mengikuti"
                      const hasDetail = Array.isArray(row.daftar_nilai) && row.daftar_nilai.length > 0

                      return (
                        <tr key={row.id_sertifikat} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5 font-mono text-xs">{row.nomor_sertifikat}</td>
                          <td className="px-4 py-2.5 font-medium">{row.siswa?.nama_lengkap || "-"}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold">{row.judul_manual}</span>
                                {isMengikuti ? (
                                  <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                                    Pelatihan
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    Kompetensi
                                  </Badge>
                                )}
                                {row.nama_kepsek && (
                                  <Badge variant="outline" className="text-[10px]">
                                    + TTD Kepsek
                                  </Badge>
                                )}
                              </div>
                              {hasDetail && (
                                <p className="text-[11px] text-muted-foreground">
                                  {row.daftar_nilai!.map((d) => `${d.kompetensi} (${d.nilai})`).join(", ")}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            {row.nilai != null ? (
                              <div className="flex flex-col">
                                <span className="font-semibold">{row.nilai}</span>
                                {hasDetail && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {row.daftar_nilai!.length} kompetensi
                                  </span>
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {row.status === "aktif" ? <Badge>Aktif</Badge> : <Badge variant="secondary">Dicabut</Badge>}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex justify-end gap-1">
                              {row.status === "aktif" && (
                                <Link
                                  href={`/kajur/sertifikat-manual/cetak/${row.id_sertifikat}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-primary hover:bg-primary/10"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Cetak
                                </Link>
                              )}
                              {row.status === "aktif" ? (
                                <Button variant="ghost" size="sm" disabled={isBusy} onClick={() => cabut(row)} className="text-destructive hover:bg-destructive/10">
                                  {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                                  Cabut
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm" disabled={isBusy} onClick={() => aktifkan(row)}>
                                  {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                  Aktifkan
                                </Button>
                              )}
                              <Button variant="ghost" size="icon-sm" disabled={isBusy} onClick={() => hapus(row)} className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-3.5 h-3.5" />
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

            <TablePagination
              page={page}
              totalPages={totalPages}
              totalRows={totalRows}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </Card>

      {addOpen && (
        <Modal title="Buat Sertifikat Manual" onClose={() => setAddOpen(false)} maxWidthClassName="max-w-2xl">
          <div className="space-y-4">
            {formError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}

            {/* Pilihan Siswa */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Pilih Siswa ({selectedSiswa.size} terpilih)
                </label>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-2.5 w-3.5 h-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filterNama}
                    onChange={(e) => setFilterNama(e.target.value)}
                    placeholder="Cari nama siswa..."
                    className="pl-8"
                  />
                </div>
                <select
                  className={selectClass + " sm:w-40"}
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                >
                  <option value={SEMUA_KELAS}>Semua Kelas</option>
                  {kelasOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-44 overflow-y-auto rounded-lg border border-border">
                {filteredSiswa.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">Tidak ditemukan.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="w-8 px-3 py-2">
                          <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} />
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">Nama</th>
                        <th className="px-3 py-2 text-left font-semibold">Kelas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredSiswa.map((s) => (
                        <tr
                          key={s.id_siswa}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => toggleSiswa(s.id_siswa)}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedSiswa.has(s.id_siswa)}
                              onChange={() => toggleSiswa(s.id_siswa)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-2 font-medium">{s.nama_lengkap}</td>
                          <td className="px-3 py-2 text-muted-foreground">{s.kelas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Pilihan Jenis Sertifikat */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Jenis Sertifikat</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTipeSertifikat("kompetensi")}
                  className={`flex flex-col rounded-lg border p-3 text-left transition-colors ${
                    tipeSertifikat === "kompetensi"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-semibold text-sm">
                    <FileCheck2 className="w-4 h-4" />
                    Kelulusan Uji Kompetensi
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Menyatakan telah dinyatakan LULUS uji kompetensi
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipeSertifikat("mengikuti")}
                  className={`flex flex-col rounded-lg border p-3 text-left transition-colors ${
                    tipeSertifikat === "mengikuti"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Telah Mengikuti (Pelatihan)
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Menyatakan telah aktif mengikuti pelatihan / kegiatan
                  </span>
                </button>
              </div>
            </div>

            {/* Judul Kompetensi / Kegiatan */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {tipeSertifikat === "mengikuti" ? "Nama Pelatihan / Kegiatan" : "Judul Kompetensi"}
              </label>
              <Input
                value={judulManual}
                onChange={(e) => setJudulManual(e.target.value)}
                placeholder={
                  tipeSertifikat === "mengikuti"
                    ? "mis. Pelatihan Fullstack Web Development Modern"
                    : "mis. Uji Kompetensi Keahlian Rekayasa Perangkat Lunak"
                }
                disabled={submitting}
              />
            </div>

            {/* Keterangan Tambahan / Custom */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Keterangan Kalimat Pengantar (Opsional)
              </label>
              <Input
                value={keteranganCustom}
                onChange={(e) => setKeteranganCustom(e.target.value)}
                placeholder={
                  tipeSertifikat === "mengikuti"
                    ? "Default: telah aktif mengikuti dan menyelesaikan kegiatan"
                    : "Default: telah dinyatakan LULUS dalam uji kompetensi"
                }
                disabled={submitting}
              />
            </div>

            {/* Daftar Nilai Berdasarkan Kompetensi */}
            <div className="space-y-2 rounded-lg border border-border p-3.5 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Pengisian Nilai per Kompetensi / Materi
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Masukkan setiap materi/kompetensi beserta nilainya (mis. PHP MVC: 90, Routing: 89)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={tambahBarisKompetensi}
                  disabled={submitting}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Tambah Baris
                </Button>
              </div>

              <div className="space-y-2">
                {daftarNilai.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        value={item.kompetensi}
                        onChange={(e) => updateBarisKompetensi(index, "kompetensi", e.target.value)}
                        placeholder={
                          index === 0
                            ? "mis. PHP MVC"
                            : index === 1
                            ? "mis. Routing"
                            : `Kompetensi / Materi ${index + 1}`
                        }
                        disabled={submitting}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={item.nilai}
                        onChange={(e) => updateBarisKompetensi(index, "nilai", e.target.value)}
                        placeholder="Nilai"
                        disabled={submitting}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => hapusBarisKompetensi(index)}
                      disabled={submitting}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {rataRataOtomatis !== null && (
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                  <span>
                    Rata-rata Otomatis: <strong className="text-foreground">{rataRataOtomatis}</strong>
                  </span>
                  <span className="text-[11px]">
                    (Akan otomatis menjadi Nilai Akhir jika field di bawah kosong)
                  </span>
                </div>
              )}
            </div>

            {/* Nilai Akhir Manual (opsional) */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nilai Akhir Keseluruhan (Opsional)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder={
                  rataRataOtomatis
                    ? `Kosongkan untuk memakai nilai rata-rata (${rataRataOtomatis})`
                    : "Kosongkan jika tidak menampilkan nilai angka sama sekali"
                }
                disabled={submitting}
              />
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
              <input
                type="checkbox"
                checked={sertakanKepsek}
                onChange={(e) => setSertakanKepsek(e.target.checked)}
              />
              Sertakan tanda tangan Kepala Sekolah
            </label>

            <div className="flex gap-2 pt-1">
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Terbitkan untuk {selectedSiswa.size} Siswa
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
