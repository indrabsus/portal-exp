"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Award,
  Ban,
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

type SertifikatRow = {
  id_sertifikat: string
  nomor_sertifikat: string
  judul_manual: string
  nilai: number | null
  status: "aktif" | "dicabut"
  created_at: string
  nama_kepsek: string | null
  siswa?: { nama_lengkap: string }
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
  const [judulManual, setJudulManual] = useState("")
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
    setJudulManual("")
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

  const submit = async () => {
    setFormError(null)

    if (selectedSiswa.size === 0 || !judulManual.trim()) {
      setFormError("Pilih minimal satu siswa dan isi judul kompetensi.")
      return
    }

    if (nilai.trim() !== "") {
      const n = Number(nilai)
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        setFormError("Nilai harus berupa angka 0-100, atau kosongkan jika tidak perlu.")
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
          nilai: nilai.trim(),
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
            Terbitkan sertifikat dengan judul dan nilai yang diisi manual untuk siswa jurusan Anda.
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
                    <SortableTh label="Judul Kompetensi" sortKey="judul" activeKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
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
                      return (
                        <tr key={row.id_sertifikat} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5 font-mono text-xs">{row.nomor_sertifikat}</td>
                          <td className="px-4 py-2.5 font-medium">{row.siswa?.nama_lengkap || "-"}</td>
                          <td className="px-4 py-2.5">
                            {row.judul_manual}
                            {row.nama_kepsek && (
                              <Badge variant="outline" className="ml-1.5 align-middle text-[10px]">
                                + TTD Kepsek
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-2.5">{row.nilai ?? "-"}</td>
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

              <div className="h-64 overflow-y-auto rounded-lg border border-border">
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

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Judul Kompetensi</label>
              <Input
                value={judulManual}
                onChange={(e) => setJudulManual(e.target.value)}
                placeholder="mis. Pelatihan Jaringan Dasar"
                disabled={submitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nilai (opsional, 0-100)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder="Kosongkan jika tidak perlu - sertifikat cukup tampilkan LULUS"
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
