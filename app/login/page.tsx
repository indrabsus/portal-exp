"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, Loader2, LockKeyhole, User } from "lucide-react"

import { getRoleHome, getUser, login } from "@/lib/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Foto-foto yang sudah ada di /public, dipakai buat galeri di sisi kiri.
const GALLERY = [
  { src: "/hero.jpg", alt: "Upacara SMK Sangkuriang 1 Cimahi", rotate: -3 },
  { src: "/kepsek.jpg", alt: "Kepala Sekolah", rotate: 2 },
  { src: "/jurusan/rpl.jpg", alt: "Jurusan PPLG", rotate: -2 },
  { src: "/jurusan/ak.jpg", alt: "Jurusan AKL", rotate: 3 },
  { src: "/jurusan/bdp.jpg", alt: "Jurusan Pemasaran", rotate: -1 },
  { src: "/jurusan/mplb.jpg", alt: "Jurusan MPLB", rotate: 2 },
]

// Satu foto galeri: dimiringkan sedikit (statis) untuk kesan koleksi
// foto ditempel, muncul dengan animasi stagger (delay beda per item),
// lalu di-hover jadi lurus + membesar + bayangannya naik.
function GalleryPhoto({
  src,
  alt,
  rotate,
  delay,
}: {
  src: string
  alt: string
  rotate: number
  delay: number
}) {
  return (
    <div
      className="group relative aspect-[3/4]"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div
        className="login-gallery-in relative size-full overflow-hidden rounded-xl border-2 border-white/30 shadow-lg transition-all duration-300 ease-out group-hover:z-10 group-hover:scale-110 group-hover:rotate-0 group-hover:shadow-2xl group-hover:shadow-black/50"
        style={{ animationDelay: `${delay}s` }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 15vw, 0px"
          className="object-cover"
        />
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const user = getUser()
    const home = getRoleHome(user)
    if (home) router.replace(home)
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setError("Username dan password wajib diisi")
      return
    }

    setError("")
    setLoading(true)

    try {
      const user = await login(username, password)
      const home = getRoleHome(user)

      if (!home) {
        setError("Akun ini belum punya akses ke Portal Akademik.")
        return
      }

      router.push(home)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Image
        src="/staf-pengajar.jpg"
        alt="Staf Pengajar SMK Sangkuriang 1 Cimahi"
        fill
        preload
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 100%, rgba(15,23,42,0.35) 0%, rgba(15,23,42,0.72) 60%, rgba(15,23,42,0.88) 100%), linear-gradient(to bottom, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.15) 30%, rgba(15,23,42,0.15) 60%, rgba(15,23,42,0.75) 100%)",
        }}
      />

      <div className="absolute top-6 left-6 flex items-center gap-3 sm:top-8 sm:left-10">
        <div className="flex size-11 items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-lg">
          <Image
            src="/logo.png"
            alt="Logo SMK Sangkuriang 1 Cimahi"
            width={36}
            height={36}
            className="size-full object-contain"
          />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white drop-shadow-sm">
            Portal Akademik
          </p>
          <p className="text-xs text-white/75 drop-shadow-sm">
            SMK Sangkuriang 1 Cimahi
          </p>
        </div>
      </div>

      {/* Animasi: logo Sangkuriang meledak di tengah lalu lenyap,
          mengungkap galeri foto (kiri) dan kartu login (kanan). Cuma di
          desktop, lihat .login-* di globals.css. */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
        <div className="login-logo-burst relative">
          <div className="login-explosion-flash absolute top-1/2 left-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/70 blur-2xl" />
          <div className="login-explosion-ring absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-200/70" />
          <div className="login-explosion-ring login-explosion-ring-2 absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />

          <div className="relative flex size-20 items-center justify-center rounded-full bg-white p-3 shadow-[0_0_40px_10px_rgba(96,165,250,0.35)]">
            <Image
              src="/logo.png"
              alt="Logo SMK Sangkuriang 1 Cimahi"
              width={56}
              height={56}
              className="size-full object-contain"
            />
          </div>
        </div>
      </div>

      <div className="relative z-20 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-10 px-4 py-10 md:flex-row md:items-center md:justify-between md:gap-6 md:px-10 lg:px-16">
        {/* Galeri foto - cuma di desktop */}
        <div className="hidden md:block md:w-[46%] lg:w-[42%]">
          <p className="login-gallery-in mb-4 text-sm font-medium text-white/85 drop-shadow-sm">
            Momen di SMK Sangkuriang 1 Cimahi
          </p>
          <div className="grid grid-cols-3 gap-4">
            {GALLERY.map((g, i) => (
              <GalleryPhoto key={g.src} {...g} delay={1 + i * 0.06} />
            ))}
          </div>
        </div>

        <div className="login-card-fly-in w-full max-w-sm rounded-3xl border border-white/15 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-md max-md:animate-in max-md:fade-in max-md:slide-in-from-bottom-6 max-md:duration-700 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
              Selamat Datang
            </h1>
            <p className="mt-1.5 text-sm text-white/80 drop-shadow-sm">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                className="h-10 border-white/40 bg-white/90 pl-9 placeholder:text-slate-500 focus-visible:bg-white"
              />
            </div>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="h-10 border-white/40 bg-white/90 pl-9 pr-9 placeholder:text-slate-500 focus-visible:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {error && (
              <p className="text-sm font-medium text-red-200 drop-shadow-sm">
                {error}
              </p>
            )}

            <Button className="h-10 w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-white/70 drop-shadow-sm">
            Hubungi administrator jika Anda mengalami kendala akses.
          </p>
        </div>
      </div>

      <p className="absolute inset-x-0 bottom-6 text-center text-xs text-white/70 drop-shadow-sm">
        &copy; {new Date().getFullYear()} SMK Sangkuriang 1 Cimahi.
      </p>
    </main>
  )
}
