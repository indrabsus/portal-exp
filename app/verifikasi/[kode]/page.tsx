import { CheckCircle2, XCircle } from "lucide-react"

export const dynamic = "force-dynamic"

type VerifikasiData = {
  valid: boolean
  sertifikat: {
    nama_siswa: string
    judul_manual: string
    tipe_sertifikat?: "kompetensi" | "mengikuti" | string | null
    keterangan_custom?: string | null
    nilai: number | null
    daftar_nilai?: { kompetensi: string; nilai: number }[] | null
    nomor_sertifikat: string
    tanggal_terbit: string
  } | null
}

async function getVerifikasi(kode: string): Promise<VerifikasiData> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return { valid: false, sertifikat: null }

  try {
    const res = await fetch(`${apiUrl}/public/verifikasi/${kode}`, { cache: "no-store" })
    if (!res.ok) return { valid: false, sertifikat: null }
    const json = await res.json()
    return json.data as VerifikasiData
  } catch {
    return { valid: false, sertifikat: null }
  }
}

export default async function VerifikasiPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params
  const { valid, sertifikat } = await getVerifikasi(kode)

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/90 p-8 text-center shadow-xl shadow-primary/5 backdrop-blur-sm">
        {valid ? (
          <CheckCircle2 className="mx-auto size-14 text-primary" />
        ) : (
          <XCircle className="mx-auto size-14 text-destructive" />
        )}

        <h1 className="mt-4 text-xl font-bold tracking-tight">
          {valid ? "Sertifikat Valid" : "Sertifikat Tidak Ditemukan"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {valid
            ? "Sertifikat ini terdaftar resmi di Portal Akademik."
            : "Kode verifikasi tidak valid atau sertifikat telah dicabut."}
        </p>

        {sertifikat && (
          <div className="mt-6 flex flex-col gap-2.5 rounded-xl border border-border bg-muted/30 p-4 text-left text-sm">
            <Row label="Nama Siswa" value={sertifikat.nama_siswa} />
            <Row
              label="Jenis"
              value={sertifikat.tipe_sertifikat === "mengikuti" ? "Sertifikat Pelatihan" : "Sertifikat Kompetensi"}
            />
            <Row label="Judul" value={sertifikat.judul_manual} />
            {Array.isArray(sertifikat.daftar_nilai) && sertifikat.daftar_nilai.length > 0 && (
              <div className="mt-1 rounded-lg border border-border p-2 bg-background/50">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Materi / Unit Kompetensi:
                </p>
                <div className="divide-y divide-border text-xs">
                  {sertifikat.daftar_nilai.map((d, i) => (
                    <div key={i} className="flex justify-between py-1">
                      <span>{d.kompetensi}</span>
                      <span className="font-mono font-bold">{d.nilai}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sertifikat.nilai !== null && (
              <Row label="Nilai Akhir" value={String(sertifikat.nilai)} />
            )}
            <Row label="No. Sertifikat" value={sertifikat.nomor_sertifikat} mono />
            <Row
              label="Tanggal Terbit"
              value={new Date(sertifikat.tanggal_terbit).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-foreground" : "font-medium text-foreground"}>{value}</span>
    </div>
  )
}
