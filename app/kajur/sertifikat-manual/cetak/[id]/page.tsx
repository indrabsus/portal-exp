"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import QRCode from "qrcode"
import { Loader2, Printer } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { CertificateView } from "@/components/certificate-view"

type SertifikatDetail = {
  nomor_sertifikat: string
  judul_manual: string
  nilai: number | null
  created_at: string
  nama_kajur: string | null
  jabatan_kajur: string
  nama_kepsek: string | null
  nip_kepsek: string | null
  nama_siswa: string
  kode_verifikasi: string
}

export default function CetakSertifikatPage() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<SertifikatDetail | null>(null)
  const [namaSekolah, setNamaSekolah] = useState("Portal Akademik")
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      apiFetch(`/sertifikat/${params.id}/cetak`),
      apiFetch("/informasi-sekolah"),
    ])
      .then(async ([certRes, sekolahRes]) => {
        if (cancelled) return
        setData(certRes.data)
        if (sekolahRes.data?.nama_sekolah) setNamaSekolah(sekolahRes.data.nama_sekolah)

        const verifikasiUrl = `${window.location.origin}/verifikasi/${certRes.data.kode_verifikasi}`
        const qr = await QRCode.toDataURL(verifikasiUrl, {
          margin: 1,
          width: 200,
          color: { dark: "#1e293b", light: "#ffffff" },
        })
        if (!cancelled) setQrDataUrl(qr)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat sertifikat.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat sertifikat...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-destructive">
        {error || "Sertifikat tidak ditemukan."}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 print:gap-0 print:p-0">
      <div className="flex w-full max-w-[1100px] items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pratinjau Sertifikat</h1>
          <p className="text-sm text-muted-foreground">Periksa tampilan sebelum mencetak</p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          Cetak
        </Button>
      </div>

      <CertificateView
        data={{
          namaSiswa: data.nama_siswa,
          judulKompetensi: data.judul_manual,
          nilai: data.nilai,
          nomorSertifikat: data.nomor_sertifikat,
          tanggalTerbit: data.created_at,
          namaKajur: data.nama_kajur,
          jabatanKajur: data.jabatan_kajur,
          namaKepsek: data.nama_kepsek,
          nipKepsek: data.nip_kepsek,
          qrDataUrl,
          namaSekolah,
        }}
      />
    </div>
  )
}
