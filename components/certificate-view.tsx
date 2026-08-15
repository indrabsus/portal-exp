import Image from "next/image"
import { Italianno } from "next/font/google"

const fontCertificate = Italianno({
  subsets: ["latin"],
  weight: "400",
})

type CertificateData = {
  namaSiswa: string
  judulKompetensi: string
  nilai: number | null
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
        <img src={qrDataUrl} alt="QR Verifikasi" className="mt-1 size-16 rounded-md border border-neutral-300 bg-white p-1" />
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
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="whitespace-nowrap text-xs text-neutral-500">{jabatan}</p>
      <div className="flex h-12 items-center justify-center">
        {digitalQrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- data URL, next/image tidak berlaku untuk ini
          <img src={digitalQrDataUrl} alt="Tanda Tangan Digital" className="size-12" />
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

      <div className="absolute inset-0 flex flex-col items-center px-16 py-8 text-center sm:px-24 sm:py-10">
        <div className="mt-5 flex w-full flex-col items-center gap-1.5">
          <Image
            src="/logo.png"
            alt="Logo Sekolah"
            width={96}
            height={96}
            className="h-20 w-auto translate-y-0.5 object-contain sm:h-24"
          />
          <p className="mt-1 text-base font-bold uppercase tracking-[0.15em] text-neutral-900 sm:text-lg">
            {data.namaSekolah}
          </p>
          <div className="mt-1 h-px w-28 bg-[#c9a227]" />
        </div>

        <div className="mt-2 flex flex-col items-center gap-2 sm:mt-3">
          <h1 className="text-xl font-extrabold uppercase tracking-[0.08em] text-neutral-900 sm:text-2xl">
            Sertifikat Kompetensi
          </h1>
          <p className="text-xs text-neutral-500 sm:text-sm">Dengan ini menyatakan bahwa</p>
          <p
            className={`${fontCertificate.className} text-5xl leading-tight text-neutral-900 sm:text-6xl`}
          >
            {formatNamaSiswa(data.namaSiswa)}
          </p>
          <p className="max-w-xl text-xs text-neutral-500 sm:text-sm">
            telah dinyatakan <span className="font-semibold text-neutral-900">LULUS</span> dalam uji kompetensi
          </p>
          <p className="text-base font-bold text-neutral-900 sm:text-lg">{data.judulKompetensi}</p>

          {data.nilai != null && (
            <div className="mt-1 flex w-full max-w-xs items-center justify-between gap-3 rounded-lg border border-[rgba(201,162,39,0.5)] bg-[rgba(201,162,39,0.05)] px-4 py-1.5 text-xs font-bold sm:text-sm">
              <span className="text-neutral-900">Nilai Akhir</span>
              <span className="text-neutral-900">{data.nilai}</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex w-full -translate-y-10 items-end gap-6 px-6 sm:px-10">
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
