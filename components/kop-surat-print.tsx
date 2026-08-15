export function KopSuratPrint() {
  return (
    <div className="relative border-b-2 border-black pb-2 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- kop cetak, harus <img> statis supaya tetap tampil saat print */}
      <img src="/logo.png" alt="Logo Sekolah" className="absolute left-0 top-0 h-16 w-auto object-contain" />
      <p className="text-sm font-bold uppercase leading-tight">Yayasan Pendidikan Dayang Sumbi Jaya Lestari</p>
      <p className="text-base font-bold uppercase leading-tight">Sekolah Menengah Kejuruan (SMK) Sangkuriang 1 Cimahi</p>
      <p className="text-xs uppercase leading-tight">Bidang Studi Keahlian Bisnis Manajemen dan Teknologi Informasi Komunikasi</p>
      <p className="text-xs leading-tight">Jl. Sangkuriang No.76 Telp. (022) 665117, Fax (022) 6626603 Cimahi 40511</p>
    </div>
  )
}
