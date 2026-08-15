"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, GraduationCap, Loader2, LockKeyhole, User } from "lucide-react"

import { getRoleHome, getUser, login } from "@/lib/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <div className="relative flex w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40">
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-slate-900 p-10 text-white md:flex">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white/90">
              Portal Akademik
            </span>
          </div>

          <div className="relative space-y-3">
            <h2 className="text-3xl font-bold leading-tight">
              Portal Akademik
              <br />
              SMK Sangkuriang 1 Cimahi
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-white/70">
              Satu portal untuk admin, kajur, guru, dan siswa - materi,
              tugas, bank soal, sertifikat, dan lainnya.
            </p>
          </div>

          <p className="relative text-xs text-white/50">
            &copy; {new Date().getFullYear()} SMK Sangkuriang 1 Cimahi.
          </p>
        </div>

        <div className="flex w-full flex-col justify-center bg-card px-6 py-10 sm:px-10 md:w-1/2 dark:bg-slate-900">
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-sm font-semibold tracking-wide">
              Portal Akademik
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Selamat Datang
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="h-10 pl-9 pr-9"
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
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
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

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Hubungi administrator jika Anda mengalami kendala akses.
          </p>
        </div>
      </div>
    </main>
  )
}
