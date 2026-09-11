"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, ClipboardList, Loader2, Pencil, Sparkles, X } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
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

function hitungRataRata(nilai: Record<string, number | null>, kolom: Kolom[]): number | null {
  if (kolom.length === 0) return null
  const total = kolom.reduce((sum, k) => {
    const val = nilai[k.id]
    return sum + (typeof val === "number" && !isNaN(val) ? val : 0)
  }, 0)
  return Math.round((total / kolom.length) * 100) / 100
}

export default function RekapNilaiPage() {
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [idPengajaran, setIdPengajaran] = useState("")
  const [kolom, setKolom] = useState<Kolom[]>([])
  const [siswaList, setSiswaList] = useState<SiswaRekap[]>([])
  const [loadingMengajar, setLoadingMengajar] = useState(true)
  const [loadingRekap, setLoadingRekap] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // Mode Edit Excel
  const [isEditMode, setIsEditMode] = useState(false)
  const [draftNilai, setDraftNilai] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState(false)

  const muatRekap = useCallback(async (pengajaranId: string) => {
    if (!pengajaranId) return
    setLoadingRekap(true)
    setError(null)

    try {
      const res = await apiFetch(`/rekap-nilai?id_pengajaran=${pengajaranId}`)
      const kol: Kolom[] = res.data?.kolom || []
      const sis: SiswaRekap[] = res.data?.siswa || []
      setKolom(kol)
      setSiswaList(sis)

      const draft: Record<string, Record<string, string>> = {}
      sis.forEach((s) => {
        draft[s.id_siswa] = {}
        kol.forEach((k) => {
          const val = s.nilai[k.id]
          draft[s.id_siswa][k.id] = val !== null && val !== undefined ? String(val) : ""
        })
      })
      setDraftNilai(draft)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat rekap nilai.")
    } finally {
      setLoadingRekap(false)
    }
  }, [])

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

    apiFetch(`/rekap-nilai?id_pengajaran=${idPengajaran}`)
      .then((res) => {
        if (cancelled) return
        const kol: Kolom[] = res.data?.kolom || []
        const sis: SiswaRekap[] = res.data?.siswa || []
        setKolom(kol)
        setSiswaList(sis)

        const draft: Record<string, Record<string, string>> = {}
        sis.forEach((s) => {
          draft[s.id_siswa] = {}
          kol.forEach((k) => {
            const val = s.nilai[k.id]
            draft[s.id_siswa][k.id] = val !== null && val !== undefined ? String(val) : ""
          })
        })
        setDraftNilai(draft)
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

  // Hitung daftar sel yang diubah
  const changes = useMemo(() => {
    const list: Array<{ id_siswa: string; id_kolom: string; tipe: "tugas" | "manual"; nilai: number | null }> = []
    if (!kolom.length || !siswaList.length) return list

    for (const s of siswaList) {
      const sDraft = draftNilai[s.id_siswa] || {}
      for (const k of kolom) {
        const dValStr = sDraft[k.id] !== undefined ? sDraft[k.id].trim() : ""
        const oVal = s.nilai[k.id]
        const oValStr = oVal !== null && oVal !== undefined ? String(oVal) : ""

        if (dValStr !== oValStr) {
          list.push({
            id_siswa: s.id_siswa,
            id_kolom: k.id,
            tipe: k.tipe,
            nilai: dValStr === "" ? null : Number(dValStr),
          })
        }
      }
    }
    return list
  }, [draftNilai, siswaList, kolom])

  const ubahDraftNilai = (idSiswa: string, idKolom: string, value: string) => {
    setDraftNilai((prev) => ({
      ...prev,
      [idSiswa]: {
        ...(prev[idSiswa] || {}),
        [idKolom]: value,
      },
    }))
  }

  const mulaiEditCell = (rowIdx: number, colIdx: number) => {
    setIsEditMode(true)
    setTimeout(() => {
      const el = document.getElementById(`cell-${rowIdx}-${colIdx}`)
      if (el) {
        (el as HTMLInputElement).focus()
        ;(el as HTMLInputElement).select()
      }
    }, 50)
  }

  const batalEditMode = () => {
    // Reset draft kembali ke data awal
    const draft: Record<string, Record<string, string>> = {}
    siswaList.forEach((s) => {
      draft[s.id_siswa] = {}
      kolom.forEach((k) => {
        const val = s.nilai[k.id]
        draft[s.id_siswa][k.id] = val !== null && val !== undefined ? String(val) : ""
      })
    })
    setDraftNilai(draft)
    setIsEditMode(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault()
      const nextInput = document.getElementById(`cell-${rowIdx + 1}-${colIdx}`)
      if (nextInput) {
        (nextInput as HTMLInputElement).focus()
        ;(nextInput as HTMLInputElement).select()
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prevInput = document.getElementById(`cell-${rowIdx - 1}-${colIdx}`)
      if (prevInput) {
        (prevInput as HTMLInputElement).focus()
        ;(prevInput as HTMLInputElement).select()
      }
    }
  }

  const simpanPerubahan = async () => {
    if (changes.length === 0) return
    setSaving(true)
    setSaveSuccess(null)
    setError(null)

    try {
      await apiFetch("/rekap-nilai/simpan", {
        method: "POST",
        body: JSON.stringify({
          id_pengajaran: idPengajaran,
          updates: changes,
        }),
      })

      setSaveSuccess(`Berhasil menyimpan ${changes.length} perubahan nilai.`)
      await muatRekap(idPengajaran)
      setIsEditMode(false)
    } catch (err) {
      // Fallback: coba simpan via endpoint nilai-manual jika /rekap-nilai/simpan bermasalah
      const manualChanges = changes.filter((c) => c.tipe === "manual")
      if (manualChanges.length > 0) {
        try {
          const grouped = new Map<string, Array<{ id_siswa: string; nilai: number | null }>>()
          for (const c of manualChanges) {
            if (!grouped.has(c.id_kolom)) grouped.set(c.id_kolom, [])
            grouped.get(c.id_kolom)!.push({ id_siswa: c.id_siswa, nilai: c.nilai })
          }

          for (const [idNilaiManual, siswaUpdates] of grouped.entries()) {
            const currentRoster = siswaList.map((s) => {
              const u = siswaUpdates.find((x) => x.id_siswa === s.id_siswa)
              return {
                id_siswa: s.id_siswa,
                nilai: u ? u.nilai : s.nilai[idNilaiManual],
              }
            })
            await apiFetch("/nilai-manual/simpan", {
              method: "POST",
              body: JSON.stringify({
                id_nilai_manual: idNilaiManual,
                siswa: currentRoster,
              }),
            })
          }

          setSaveSuccess(`Berhasil menyimpan nilai manual.`)
          await muatRekap(idPengajaran)
          setIsEditMode(false)
          return
        } catch (fallbackErr) {
          setError(fallbackErr instanceof Error ? fallbackErr.message : "Gagal menyimpan perubahan.")
          return
        }
      }

      setError(err instanceof Error ? err.message : "Gagal menyimpan nilai.")
    } finally {
      setSaving(false)
    }
  }

  const gantiPengajaran = (newId: string) => {
    if (changes.length > 0) {
      if (!window.confirm("Ada perubahan nilai yang belum disimpan. Yakin ingin pindah kelas/mapel? Perubahan akan hilang.")) {
        return
      }
    }
    setIsEditMode(false)
    setSaveSuccess(null)
    setLoadingRekap(true)
    setIdPengajaran(newId)
  }

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (isEditMode && changes.length > 0) {
          e.preventDefault()
          simpanPerubahan()
        }
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  })

  // Hitung live average per siswa dari draftNilai
  const hitungRataRataLive = (idSiswa: string): number | null => {
    if (kolom.length === 0) return null
    const sDraft = draftNilai[idSiswa]
    if (!sDraft) return siswaList.find((s) => s.id_siswa === idSiswa)?.rata_rata ?? null

    const total = kolom.reduce((sum, k) => {
      const valStr = sDraft[k.id]
      if (!valStr || valStr.trim() === "") return sum + 0
      const num = Number(valStr)
      return sum + (!isNaN(num) ? num : 0)
    }, 0)

    return Math.round((total / kolom.length) * 100) / 100
  }

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
                <select className={selectClass} value={idPengajaran} onChange={(e) => gantiPengajaran(e.target.value)}>
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
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-3.5">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                <CardTitle>Tabel Nilai</CardTitle>
                {isEditMode && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="w-3 h-3" /> Mode Edit Excel
                  </span>
                )}
              </div>

              {kolom.length > 0 && siswaList.length > 0 && (
                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                      className="gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Nilai
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={batalEditMode}
                        disabled={saving}
                        className="gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                        Batal
                      </Button>
                      <Button
                        size="sm"
                        onClick={simpanPerubahan}
                        disabled={saving || changes.length === 0}
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Apply {changes.length > 0 ? `(${changes.length})` : ""}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardHeader>

            {saveSuccess && (
              <div className="flex items-center justify-between bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/20">
                <span>{saveSuccess}</span>
                <button onClick={() => setSaveSuccess(null)} className="hover:opacity-75">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isEditMode && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Panduan:</span>
                  <span>
                    Ubah nilai langsung di kotak sel. Tekan <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">Enter</kbd> atau <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">↓</kbd> untuk pindah ke siswa berikutnya, <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">Tab</kbd> untuk pindah kolom.
                  </span>
                </div>
                {changes.length > 0 && (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {changes.length} nilai diubah
                  </span>
                )}
              </div>
            )}

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
                          title={k.tipe === "tugas" ? "Tugas Portal" : "Nilai Manual"}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{k.label}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-tight ${
                                k.tipe === "tugas"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {k.tipe === "tugas" ? "Tugas" : "Manual"}
                            </span>
                          </div>
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
                      siswaList.map((s, rowIdx) => {
                        const liveAvg = hitungRataRataLive(s.id_siswa)
                        const origAvg = hitungRataRata(s.nilai, kolom)

                        return (
                          <tr key={s.id_siswa} className="hover:bg-muted/40">
                            <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium">{s.nama_lengkap}</td>
                            {kolom.map((k, colIdx) => {
                              const origVal = s.nilai[k.id]
                              const draftVal = draftNilai[s.id_siswa]?.[k.id] ?? ""
                              const isChanged =
                                (draftVal.trim() === "" && origVal !== null && origVal !== undefined) ||
                                (draftVal.trim() !== "" && (origVal === null || origVal === undefined || String(origVal) !== draftVal.trim()))

                              if (isEditMode) {
                                return (
                                  <td key={k.id} className="p-1">
                                    <input
                                      id={`cell-${rowIdx}-${colIdx}`}
                                      type="number"
                                      inputMode="decimal"
                                      min={0}
                                      max={100}
                                      step="any"
                                      placeholder="-"
                                      value={draftVal}
                                      onChange={(e) => ubahDraftNilai(s.id_siswa, k.id, e.target.value)}
                                      onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                                      className={`h-8 w-24 rounded border px-2 text-center font-mono text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 ${
                                        isChanged
                                          ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300"
                                          : "border-input bg-background hover:border-muted-foreground/50 dark:bg-input/20"
                                      }`}
                                    />
                                  </td>
                                )
                              }

                              return (
                                <td
                                  key={k.id}
                                  onClick={() => mulaiEditCell(rowIdx, colIdx)}
                                  className="group/cell relative cursor-pointer px-3 py-2.5 transition-colors hover:bg-primary/5 select-none"
                                  title="Klik untuk edit nilai langsung"
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="font-mono">
                                      {origVal !== null && origVal !== undefined ? origVal : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </span>
                                    <Pencil className="w-3 h-3 text-muted-foreground/40 opacity-0 transition-opacity group-hover/cell:opacity-100" />
                                  </div>
                                </td>
                              )
                            })}
                            <td className="px-4 py-2.5 font-semibold">
                              <span
                                className={`font-mono ${
                                  isEditMode && liveAvg !== origAvg
                                    ? "font-bold text-emerald-600 dark:text-emerald-400"
                                    : ""
                                }`}
                              >
                                {liveAvg !== null ? liveAvg : (s.rata_rata ?? "-")}
                              </span>
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
        </>
      )}
    </div>
  )
}
