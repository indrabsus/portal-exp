import Image from "next/image"
import { Italianno } from "next/font/google"

const fontCertificate = Italianno({
  subsets: ["latin"],
  weight: "400",
})

export type ItemNilaiKompetensi = {
  kompetensi: string
  nilai: number
}

export type CertificateData = {
  namaSiswa: string
  judulKompetensi: string
  tipeSertifikat?: "kompetensi" | "mengikuti" | string | null
  keteranganCustom?: string | null
  nilai: number | null
  daftarNilai?: ItemNilaiKompetensi[] | null
  nomorSertifikat: string | null
  tanggalTerbit: string | null
  namaKajur: string | null
  jabatanKajur: string | null
  namaKepsek?: string | null
  nipKepsek?: string | null
  qrDataUrl: string | null
  namaSekolah: string
}

function formatNamaSiswa(nama: string): string {
  if (!nama || nama !== nama.toUpperCase()) return nama
  return nama.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
}

function InfoSertifikat({
  nomor,
  tanggal,
  qrDataUrl,
}: {
  nomor: string | null
  tanggal: string | null
  qrDataUrl: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-[10px] text-neutral-500">No. Sertifikat</p>
      <p className="font-mono text-xs font-semibold text-neutral-900">{nomor ?? "-"}</p>
      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL, next/image tidak berlaku untuk ini
        <img src={qrDataUrl} alt="QR Verifikasi" className="mt-1 size-14 rounded-md border border-neutral-300 bg-white p-1" />
      )}
      <p className="text-[9px] text-neutral-500">
        {tanggal
          ? new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
          : "-"}
      </p>
    </div>
  )
}

function TandaTangan({
  jabatan,
  nama,
  nip,
  nipLabel = "NIP",
  digitalQrDataUrl,
}: {
  jabatan: string
  nama: string
  nip?: string | null
  nipLabel?: string
  digitalQrDataUrl?: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <p className="whitespace-nowrap text-xs text-neutral-500">{jabatan}</p>
      <div className="flex h-10 items-center justify-center">
        {digitalQrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- data URL, next/image tidak berlaku untuk ini
          <img src={digitalQrDataUrl} alt="Tanda Tangan Digital" className="size-10" />
        )}
      </div>
      <p className="whitespace-nowrap font-semibold text-neutral-900 underline decoration-neutral-400 underline-offset-4">
        {nama}
      </p>
      <p className={`whitespace-nowrap text-[10px] text-neutral-500 ${nip ? "" : "invisible"}`}>
        {nipLabel}. {nip ?? "-"}
      </p>
    </div>
  )
}

export function CertificateView({ data }: { data: CertificateData }) {
  const isMengikuti = data.tipeSertifikat === "mengikuti"
  const hasDaftarNilai = Array.isArray(data.daftarNilai) && data.daftarNilai.length > 0

  return (
    <div className="relative mx-auto aspect-[297/210] w-full max-w-[1100px] overflow-hidden rounded-md bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5 print:m-0 print:aspect-auto print:h-[210mm] print:w-[297mm] print:max-w-none print:rounded-none print:shadow-none print:ring-0">
      <Image
        src="/sertifikat-bg.png"
        alt=""
        aria-hidden
        fill
        sizes="1100px"
        className="pointer-events-none object-cover"
      />

      <div className="absolute inset-0 flex flex-col items-center px-12 py-6 text-center sm:px-20 sm:py-8">
        {/* Kop / Logo Sekolah */}
        <div className="mt-3 flex w-full flex-col items-center gap-1">
          <Image
            src="/logo.png"
            alt="Logo Sekolah"
            width={96}
            height={96}
            className="h-16 w-auto translate-y-0.5 object-contain sm:h-20"
          />
          <p className="mt-0.5 text-sm font-bold uppercase tracking-[0.15em] text-neutral-900 sm:text-base">
            {data.namaSekolah}
          </p>
          <div className="mt-0.5 h-px w-24 bg-[#c9a227]" />
        </div>

        {/* Konten Utama */}
        <div className={`mt-1 flex flex-col items-center ${hasDaftarNilai ? "gap-1" : "gap-2"}`}>
          <h1 className="text-lg font-extrabold uppercase tracking-[0.08em] text-neutral-900 sm:text-xl">
            {isMengikuti ? "Sertifikat Pelatihan" : "Sertifikat Kompetensi"}
          </h1>
          <p className="text-[11px] text-neutral-500 sm:text-xs">Dengan ini menyatakan bahwa</p>
          <p
            className={`${fontCertificate.className} leading-tight text-neutral-900 ${
              hasDaftarNilai ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl"
            }`}
          >
            {formatNamaSiswa(data.namaSiswa)}
          </p>

          <p className="max-w-xl text-[11px] text-neutral-500 sm:text-xs">
            {data.keteranganCustom ? (
              data.keteranganCustom
            ) : isMengikuti ? (
              <>telah aktif mengikuti dan menyelesaikan kegiatan</>
            ) : (
              <>
                telah dinyatakan <span className="font-semibold text-neutral-900">LULUS</span> dalam uji kompetensi
              </>
            )}
          </p>

          <p className={`font-bold text-neutral-900 ${hasDaftarNilai ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>
            {data.judulKompetensi}
          </p>

          {/* Rincian Nilai Kompetensi di Halaman Depan */}
          {hasDaftarNilai ? (
            <div className="mt-1 w-full max-w-lg overflow-hidden rounded-md border border-[#c9a227]/40 bg-white/85 shadow-2xs backdrop-blur-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#c9a227]/30 bg-[rgba(201,162,39,0.08)] text-[10px] font-bold uppercase tracking-wider text-neutral-800">
                    <th className="w-8 py-1 px-3 text-center">No</th>
                    <th className="py-1 px-3">Materi / Unit Kompetensi</th>
                    <th className="w-16 py-1 px-3 text-right">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60 text-[11px]">
                  {data.daftarNilai!.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-0.5 px-3 text-center text-neutral-500">{idx + 1}</td>
                      <td className="py-0.5 px-3 font-medium text-neutral-900">{item.kompetensi}</td>
                      <td className="py-0.5 px-3 font-mono font-bold text-right text-neutral-900">{item.nilai}</td>
                    </tr>
                  ))}
                </tbody>
                {data.nilai != null && (
                  <tfoot>
                    <tr className="border-t border-[#c9a227]/30 bg-[rgba(201,162,39,0.06)] text-[11px] font-bold text-neutral-900">
                      <td colSpan={2} className="py-1 px-3 text-right">
                        Nilai Akhir (Rata-rata):
                      </td>
                      <td className="py-1 px-3 font-mono text-right text-neutral-900">{data.nilai}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : data.nilai != null ? (
            <div className="mt-1 flex w-full max-w-xs items-center justify-between gap-3 rounded-lg border border-[rgba(201,162,39,0.5)] bg-[rgba(201,162,39,0.05)] px-4 py-1.5 text-xs font-bold sm:text-sm">
              <span className="text-neutral-900">Nilai Akhir</span>
              <span className="text-neutral-900">{data.nilai}</span>
            </div>
          ) : null}
        </div>

        {/* Tanda Tangan & QR */}
        <div className="mt-auto flex w-full -translate-y-6 items-end gap-6 px-6 sm:px-10">
          {data.namaKepsek ? (
            <>
              <div className="flex flex-1 justify-center">
                <TandaTangan
                  jabatan={data.jabatanKajur ?? "Kepala Jurusan"}
                  nama={data.namaKajur ?? ""}
                />
              </div>
              <InfoSertifikat nomor={data.nomorSertifikat} tanggal={data.tanggalTerbit} qrDataUrl={data.qrDataUrl} />
              <div className="flex flex-1 justify-center">
                <TandaTangan jabatan="Kepala Satuan Pendidikan" nama={data.namaKepsek} nip={data.nipKepsek} />
              </div>
            </>
          ) : (
            <>
              <InfoSertifikat nomor={data.nomorSertifikat} tanggal={data.tanggalTerbit} qrDataUrl={data.qrDataUrl} />
              <div className="flex flex-1 justify-end">
                <TandaTangan
                  jabatan={data.jabatanKajur ?? "Kepala Jurusan"}
                  nama={data.namaKajur ?? ""}
                  digitalQrDataUrl={data.qrDataUrl}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
