import Link from "next/link"
import Image from "next/image"
import {
  Award,
  Sparkles,
  Target,
  Heart,
  MapPin,
  Mail,
  AtSign,
  Phone,
  ExternalLink,
  Compass,
  BookOpen,
  Dumbbell,
  Music,
  Camera,
  Computer,
  FlaskConical,
  Library,
  Building2,
  Trees,
  Users,
  GraduationCap,
  Layers,
  Quote,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InitialsAvatar } from "@/components/initials-avatar"
import { YoutubeThumbnail } from "@/components/youtube-thumbnail"
import { LandingNav } from "@/components/landing-nav"
import { HeroImage } from "@/components/hero-image"
import { ShatterOut } from "@/components/shatter-out"
import { ShatterPiece } from "@/components/shatter-piece"
import { Reveal } from "@/components/reveal"
import { JurusanCarousel } from "@/components/jurusan-carousel"

export const dynamic = "force-dynamic"

const EKSKUL = [
  { nama: "Pramuka", desc: "Membentuk jiwa kepemimpinan, kemandirian, dan kedisiplinan siswa.", icon: Compass },
  { nama: "Rohis", desc: "Pembinaan keagamaan dan akhlak mulia bagi seluruh siswa.", icon: Heart },
  { nama: "Futsal", desc: "Mengasah kerja sama tim dan sportivitas melalui olahraga.", icon: Dumbbell },
  { nama: "Paduan Suara", desc: "Mengembangkan minat dan talenta siswa di bidang seni musik.", icon: Music },
  { nama: "Jurnalistik & Fotografi", desc: "Melatih kemampuan menulis, dokumentasi, dan publikasi sekolah.", icon: Camera },
  { nama: "PMR", desc: "Pelatihan pertolongan pertama dan kepedulian sosial.", icon: Heart },
]

const FASILITAS = [
  { nama: "Lab Komputer", desc: "Ruang praktik dengan perangkat dan jaringan terkini.", icon: Computer },
  { nama: "Perpustakaan", desc: "Koleksi buku lengkap dan ruang baca yang nyaman.", icon: Library },
  { nama: "Masjid Sekolah", desc: "Tempat ibadah dan pembinaan rohani warga sekolah.", icon: Building2 },
  { nama: "Lab Praktik Kejuruan", desc: "Ruang praktik sesuai kompetensi keahlian masing-masing jurusan.", icon: FlaskConical },
  { nama: "Lapangan Olahraga", desc: "Area olahraga dan kegiatan ekstrakurikuler luar ruang.", icon: Trees },
  { nama: "Ruang Multimedia", desc: "Ruang serbaguna untuk presentasi dan kegiatan kreatif siswa.", icon: BookOpen },
]

const FOTO_JURUSAN: Record<string, string> = {
  PPLG: "/jurusan/rpl.jpg",
  AKL: "/jurusan/ak.jpg",
  PM: "/jurusan/bdp.jpg",
  MPLB: "/jurusan/mplb.jpg",
}

type LandingData = {
  informasi_sekolah: {
    nama_sekolah: string
    alamat: string | null
    email: string | null
    instagram: string | null
    no_telepon: string | null
    nama_kepala_sekolah: string | null
    visi: string | null
    misi: string | null
  } | null
  stats: { siswa: number; guru: number; jurusan: number; sertifikat: number }
  jurusan: { kode: string; nama: string; ketua: string | null }[]
  sertifikat_terbaru: { nama_siswa: string; kelas: string | null; judul_manual: string }[]
  project_terbaru: {
    nama_siswa: string
    kelas: string | null
    nama_project: string
    deskripsi: string | null
    link_youtube: string | null
  }[]
}

async function getLandingData(): Promise<LandingData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return null

  try {
    const res = await fetch(`${apiUrl}/public/landing`, { cache: "no-store" })
    if (!res.ok) return null
    const json = await res.json()
    return json.data as LandingData
  } catch {
    return null
  }
}

export default async function HomePage() {
  const data = await getLandingData()

  const sekolah = data?.informasi_sekolah ?? null
  const namaSekolah = sekolah?.nama_sekolah ?? "Portal Akademik"
  const misiList = (sekolah?.misi ?? "").split("\n").map((m) => m.trim()).filter(Boolean)
  const alamatLengkap = sekolah?.alamat || "Jl. Sangkuriang No. 76, Cimahi"
  const mapsQuery = encodeURIComponent(`${namaSekolah} ${alamatLengkap}`)
  const namaKepsek = sekolah?.nama_kepala_sekolah || "Kepala Sekolah"

  const jurusanList = data?.jurusan ?? []
  const projectList = data?.project_terbaru ?? []

  const STATS = [
    { label: "Siswa Aktif", value: data?.stats.siswa ?? 0, icon: Users },
    { label: "Tenaga Pendidik", value: data?.stats.guru ?? 0, icon: GraduationCap },
    { label: "Program Keahlian", value: data?.stats.jurusan ?? jurusanList.length, icon: Layers },
    { label: "Sertifikat Terbit", value: data?.stats.sertifikat ?? 0, icon: Award },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav namaSekolah={namaSekolah} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-28 pt-24 sm:px-6 sm:pb-36 sm:pt-32">
        <HeroImage />
        <CircuitGlow />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
          <ShatterOut seed={1} range={[0, 380]} className="inline-flex">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Sparkles className="size-3" /> Sekolah Menengah Kejuruan
            </span>
          </ShatterOut>
          <ShatterOut seed={2} range={[40, 420]}>
            <Image src="/logo.png" alt="Logo" width={80} height={80} className="h-20 w-auto object-contain drop-shadow-lg" />
          </ShatterOut>
          <ShatterOut seed={3} range={[80, 460]}>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{namaSekolah}</h1>
          </ShatterOut>
          <ShatterOut seed={4} range={[120, 500]}>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/90 sm:text-base">
              Modern <span className="text-white/40">&bull;</span> Profesional <span className="text-white/40">&bull;</span> Religius
            </p>
          </ShatterOut>
          <ShatterOut seed={5} range={[160, 540]}>
            <p className="max-w-2xl text-white/85 sm:text-lg">
              Mencetak generasi unggul yang kompeten di bidang keahliannya, berakhlak mulia, dan siap berkontribusi bagi bangsa.
            </p>
          </ShatterOut>
          <ShatterOut seed={6} range={[200, 580]} className="mt-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tentang"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Pelajari Lebih Lanjut
              </a>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-black/20 transition-transform hover:scale-[1.03] hover:bg-primary/90"
              >
                Masuk Portal
              </Link>
            </div>
          </ShatterOut>
        </div>
      </section>

      {/* Stats - overlapping hero */}
      <ShatterOut seed={7} range={[350, 750]} className="relative z-10 mx-4 -mt-14 sm:mx-6 sm:-mt-16">
        <Card className="relative mx-auto max-w-5xl overflow-hidden border-primary/10 shadow-xl shadow-black/5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />
          <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 sm:p-6">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <s.icon className="size-4.5" />
                </div>
                <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </ShatterOut>

      {/* Tentang & Visi Misi */}
      <section id="tentang" className="relative px-4 pt-20 pb-16 sm:px-6">
        <DotPattern />
        <div className="relative mx-auto max-w-5xl">
          <ShatterPiece seed={20}>
            <SectionHeading eyebrow="Profil Sekolah" title="Tentang Kami" subtitle="Visi dan misi yang menjadi landasan setiap langkah kami" />
          </ShatterPiece>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ShatterPiece seed={21}>
              <Card className="group relative overflow-hidden shadow-sm transition-shadow hover:shadow-lg">
                <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-125" />
                <CardHeader className="relative">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                    <Target className="size-5" />
                  </div>
                  <CardTitle>Visi</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {sekolah?.visi ||
                      "Menjadi lembaga pendidikan kejuruan yang modern, profesional, dan religius dalam mencetak lulusan yang kompeten dan berakhlak mulia."}
                  </p>
                </CardContent>
              </Card>
            </ShatterPiece>
            <ShatterPiece seed={22}>
              <Card className="group relative overflow-hidden shadow-sm transition-shadow hover:shadow-lg">
                <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-125" />
                <CardHeader className="relative">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                    <Heart className="size-5" />
                  </div>
                  <CardTitle>Misi</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  {misiList.length > 0 ? (
                    <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                      {misiList.map((m, idx) => (
                        <li key={idx} className="flex gap-2 leading-relaxed">
                          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {idx + 1}
                          </span>
                          {m}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Menyelenggarakan pendidikan kejuruan berkualitas, membangun karakter religius, dan menyiapkan siswa siap kerja maupun
                      berwirausaha.
                    </p>
                  )}
                </CardContent>
              </Card>
            </ShatterPiece>
          </div>
        </div>
      </section>

      {/* Jurusan */}
      <section id="jurusan" className="relative bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <ShatterPiece seed={23}>
            <SectionHeading eyebrow="Program Keahlian" title="4 Jurusan Unggulan" subtitle="Pilih jurusan sesuai minat dan bakatmu" />
          </ShatterPiece>
          <ShatterPiece seed={24}>
            <Reveal>
              <JurusanCarousel
                items={jurusanList.map((j) => ({
                  kode: j.kode,
                  nama: j.nama,
                  ketua: j.ketua,
                  foto: FOTO_JURUSAN[j.kode] ?? null,
                }))}
              />
            </Reveal>
          </ShatterPiece>
        </div>
      </section>

      {/* Sambutan Kepala Sekolah */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6">
        <GridPattern />
        <GlowOrb className="-left-20 top-10 size-72" />
        <div className="mx-auto max-w-4xl">
          <ShatterPiece seed={25}>
            <SectionHeading eyebrow="Pimpinan Sekolah" title="Sambutan Kepala Sekolah" subtitle="" />
          </ShatterPiece>
          <ShatterPiece seed={26}>
            <Card className="relative overflow-hidden border-primary/10 shadow-md">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/5" />
              <CardContent className="relative flex flex-col items-center gap-6 pt-6 text-center sm:flex-row sm:items-start sm:text-left">
                <Reveal className="relative shrink-0">
                  <Image
                    src="/kepsek.jpg"
                    alt={namaKepsek}
                    width={128}
                    height={128}
                    className="size-32 rounded-2xl object-cover shadow-md ring-4 ring-primary/10"
                  />
                  <div className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Quote className="size-4" />
                  </div>
                </Reveal>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-lg font-bold">{namaKepsek}</p>
                    <p className="text-sm text-muted-foreground">Kepala Sekolah</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    &ldquo;Assalamu&rsquo;alaikum warahmatullahi wabarakatuh. Selamat datang di {namaSekolah}. Kami berkomitmen
                    membina siswa-siswi menjadi pribadi yang kompeten di bidang keahliannya, profesional dalam bersikap, dan
                    senantiasa berpegang pada nilai-nilai keagamaan dalam setiap langkahnya. Melalui pembelajaran yang modern
                    dan relevan dengan kebutuhan dunia kerja, kami berharap setiap lulusan mampu bersaing secara global tanpa
                    meninggalkan akhlak yang mulia. Mari bersama membangun generasi yang cerdas, terampil, dan berintegritas.&rdquo;
                  </p>
                </div>
              </CardContent>
            </Card>
          </ShatterPiece>
        </div>
      </section>

      {/* Inovasi siswa */}
      <section id="inovasi" className="relative px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <ShatterPiece seed={27}>
            <SectionHeading eyebrow="Karya Siswa" title="Inovasi & Karya Siswa" subtitle="Project dan inovasi siswa yang telah disetujui Kajur" />
          </ShatterPiece>
          {projectList.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Belum ada karya siswa yang dipublikasikan.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projectList.map((p, idx) => (
                <ShatterPiece key={idx} seed={30 + idx}>
                  <Reveal delay={(idx % 3) * 0.1}>
                    <Card className="group overflow-hidden shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                      {p.link_youtube ? (
                        <div className="px-4 pt-4">
                          <YoutubeThumbnail url={p.link_youtube} />
                        </div>
                      ) : (
                        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
                          <Sparkles className="size-8 text-primary/50" />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-base">{p.nama_project}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        <p className="line-clamp-2 text-sm text-muted-foreground">{p.deskripsi ?? "-"}</p>
                        <div className="flex items-center gap-2 border-t border-border pt-2">
                          <InitialsAvatar name={p.nama_siswa} className="size-6 text-[10px]" />
                          <span className="text-xs text-muted-foreground">
                            {p.nama_siswa} &middot; {p.kelas ?? "-"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Reveal>
                </ShatterPiece>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ekskul */}
      <section className="relative overflow-hidden bg-muted/30 px-4 py-20 sm:px-6">
        <GridPattern />
        <GlowOrb className="-right-24 top-0 size-80" />
        <div className="mx-auto max-w-5xl">
          <ShatterPiece seed={40}>
            <SectionHeading eyebrow="Pengembangan Diri" title="Ekstrakurikuler" subtitle="Wadah pengembangan minat dan talenta siswa" />
          </ShatterPiece>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EKSKUL.map((item, idx) => (
              <ShatterPiece key={item.nama} seed={41 + idx}>
                <Card className="group relative overflow-hidden border-primary/10 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="absolute right-0 top-0 size-16 rounded-bl-3xl bg-primary/5 transition-colors group-hover:bg-primary/10" />
                  <CardContent className="relative flex items-start gap-3 pt-6">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.nama}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </ShatterPiece>
            ))}
          </div>
        </div>
      </section>

      {/* Fasilitas */}
      <section id="fasilitas" className="relative overflow-hidden px-4 py-20 sm:px-6">
        <DotPattern />
        <GlowOrb className="-left-24 bottom-0 size-80" />
        <div className="mx-auto max-w-5xl">
          <ShatterPiece seed={50}>
            <SectionHeading eyebrow="Sarana & Prasarana" title="Fasilitas Sekolah" subtitle="Sarana penunjang kegiatan belajar dan ibadah" />
          </ShatterPiece>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FASILITAS.map((item, idx) => (
              <ShatterPiece key={item.nama} seed={51 + idx}>
                <Card className="group relative overflow-hidden border-primary/10 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="absolute right-0 top-0 size-16 rounded-bl-3xl bg-primary/5 transition-colors group-hover:bg-primary/10" />
                  <CardContent className="relative flex items-start gap-3 pt-6">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.nama}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </ShatterPiece>
            ))}
          </div>
        </div>
      </section>

      {/* Lokasi */}
      <section id="lokasi" className="relative bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <ShatterPiece seed={60}>
            <SectionHeading eyebrow="Kunjungi Kami" title="Lokasi Kami" subtitle={alamatLengkap} />
          </ShatterPiece>
          <ShatterPiece seed={61}>
            <Card className="overflow-hidden shadow-md">
              <iframe
                title="Lokasi Sekolah"
                src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed`}
                className="h-80 w-full border-0"
                loading="lazy"
              />
            </Card>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
            >
              Buka di Google Maps <ExternalLink className="size-3.5" />
            </a>
          </ShatterPiece>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-border bg-background px-4 pt-14 pb-8 sm:px-6">
        <GridPattern className="opacity-[0.04]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="h-10 w-auto object-contain" />
            <p className="text-center text-sm font-semibold sm:text-left">{namaSekolah}</p>
            <p className="text-center text-xs text-muted-foreground sm:text-left">Modern &middot; Profesional &middot; Religius</p>
          </div>

          <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            <p className="text-sm font-semibold">Tautan Cepat</p>
            <a href="#tentang" className="text-xs text-muted-foreground hover:text-primary">Tentang Kami</a>
            <a href="#jurusan" className="text-xs text-muted-foreground hover:text-primary">Program Keahlian</a>
            <Link href="/login" className="text-xs text-muted-foreground hover:text-primary">Masuk Portal</Link>
          </div>

          <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            <p className="text-sm font-semibold">Kontak</p>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" /> {alamatLengkap}</span>
            {sekolah?.email && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="size-3.5" /> {sekolah.email}</span>}
            {sekolah?.no_telepon && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="size-3.5" /> {sekolah.no_telepon}</span>}
            {sekolah?.instagram && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><AtSign className="size-3.5" /> {sekolah.instagram}</span>}
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {namaSekolah}. Seluruh hak cipta dilindungi.
        </p>
      </footer>
    </div>
  )
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-10 flex flex-col items-center gap-2 text-center">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
        <span className="h-px w-4 bg-primary" /> {eyebrow} <span className="h-px w-4 bg-primary" />
      </span>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {subtitle && <p className="max-w-xl text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

function DotPattern() {
  return (
    <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-primary opacity-[0.05]" aria-hidden>
      <defs>
        <pattern id="dot-pattern" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-pattern)" />
    </svg>
  )
}

function GridPattern({ className = "" }: { className?: string }) {
  return (
    <svg className={`pointer-events-none absolute inset-0 -z-10 h-full w-full text-primary opacity-[0.06] ${className}`} aria-hidden>
      <defs>
        <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 H0 V40" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  )
}

function GlowOrb({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -z-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl ${className}`}
    />
  )
}

function CircuitGlow() {
  return (
    <svg className="absolute inset-0 h-full w-full text-primary/60 opacity-40" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden>
      <path d="M0 80 H180 L220 120 H420 L460 80 H1000" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M0 420 H160 L200 380 H520 L560 420 H1000" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="180" cy="80" r="4" fill="currentColor" />
      <circle cx="460" cy="80" r="4" fill="currentColor" />
      <circle cx="160" cy="420" r="4" fill="currentColor" />
      <circle cx="560" cy="420" r="4" fill="currentColor" />
    </svg>
  )
}
