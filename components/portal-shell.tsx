"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  Camera,
  ChevronDown,
  GraduationCap,
  KeyRound,
  Loader2,
  LogOut,
  Menu,
  X,
} from "lucide-react"

import { apiFetch, getAssetUrl } from "@/lib/api"
import { logout, updateUserGambar, UserLogin } from "@/lib/auth"
import { Modal } from "@/components/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type PortalMenuItem = {
  title: string
  href: string
  icon: LucideIcon
}

function Avatar({
  username,
  gambar,
  size = "size-9",
  textSize = "text-sm",
}: {
  username: string
  gambar: string | null
  size?: string
  textSize?: string
}) {
  const url = getAssetUrl(gambar)

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar dari backend eksternal, bukan aset statis Next
      <img
        src={url}
        alt={username}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    )
  }

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-primary/15 ${textSize} font-semibold text-primary`}
    >
      {username?.slice(0, 2).toUpperCase()}
    </div>
  )
}

export function PortalShell({
  user,
  roleLabel,
  menus,
  children,
}: {
  user: UserLogin
  roleLabel: string
  menus: PortalMenuItem[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [gambar, setGambar] = useState<string | null>(user.gambar ?? null)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleUploadFoto = async (file: File) => {
    const formData = new FormData()
    formData.append("foto", file)

    const res = await apiFetch("/profile/foto", {
      method: "POST",
      body: formData,
    })

    const gambarBaru: string = res.data.gambar
    updateUserGambar(gambarBaru)
    setGambar(gambarBaru)
  }

  return (
    <main className="min-h-screen text-foreground print:min-h-0">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          dark fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-950 text-foreground transition-transform duration-300 print:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-tight">
                Portal Akademik
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {roleLabel}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center gap-3">
            <Avatar username={user.username} gambar={gambar} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <Badge variant="outline" className="mt-1">
                {roleLabel}
              </Badge>
            </div>
          </div>
        </div>

        <nav className="px-3 space-y-1 pb-4">
          {menus.map((menu) => {
            const Icon = menu.icon
            const active =
              pathname === menu.href || pathname.startsWith(menu.href + "/")

            return (
              <button
                key={menu.href}
                onClick={() => {
                  router.push(menu.href)
                  setMobileOpen(false)
                }}
                className={`
                  group relative w-full flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150
                  ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{menu.title}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <section className="transition-all duration-300 md:pl-72 print:pl-0">
        <header className="dark sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950 text-foreground flex items-center justify-between px-4 md:px-6 print:hidden">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden md:block">
            <h2 className="font-semibold">Portal Akademik</h2>
            <p className="text-xs text-muted-foreground">
              SMK Sangkuriang 1 Cimahi
            </p>
          </div>

          <UserMenu
            user={user}
            roleLabel={roleLabel}
            gambar={gambar}
            onLogout={handleLogout}
            onUploadFoto={handleUploadFoto}
          />
        </header>

        <div className="p-4 md:p-6 print:p-0">{children}</div>
      </section>
    </main>
  )
}

function UserMenu({
  user,
  roleLabel,
  gambar,
  onLogout,
  onUploadFoto,
}: {
  user: UserLogin
  roleLabel: string
  gambar: string | null
  onLogout: () => void
  onUploadFoto: (file: File) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  const pilihFoto = () => {
    setUploadError(null)
    fileInputRef.current?.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setUploading(true)
    setUploadError(null)

    try {
      await onUploadFoto(file)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Gagal mengupload foto.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-white/5"
      >
        <Avatar username={user.username} gambar={gambar} size="size-8" textSize="text-xs" />
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="dark absolute top-full right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-foreground shadow-lg">
          <div className="border-b border-slate-800 px-3.5 py-3">
            <p className="truncate text-sm font-semibold">{user.username}</p>
            <Badge variant="outline" className="mt-1">
              {roleLabel}
            </Badge>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />

          <button
            onClick={pilihFoto}
            disabled={uploading}
            className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Camera className="w-4 h-4" />
            {uploading ? "Mengupload..." : "Ganti Foto Profil"}
          </button>

          {uploadError && (
            <p className="px-3.5 pb-2 text-xs text-destructive">{uploadError}</p>
          )}

          <button
            onClick={() => {
              setOpen(false)
              setPasswordModalOpen(true)
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-white/5"
          >
            <KeyRound className="w-4 h-4" />
            Ubah Password
          </button>

          <button
            onClick={onLogout}
            className="flex w-full cursor-pointer items-center gap-2.5 border-t border-slate-800 px-3.5 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}

      {passwordModalOpen && (
        <ChangePasswordModal onClose={() => setPasswordModalOpen(false)} />
      )}
    </div>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [passwordLama, setPasswordLama] = useState("")
  const [passwordBaru, setPasswordBaru] = useState("")
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setInfo(null)

    if (!passwordLama || !passwordBaru) {
      setError("Password lama dan password baru wajib diisi.")
      return
    }

    if (passwordBaru.length < 6) {
      setError("Password baru minimal 6 karakter.")
      return
    }

    if (passwordBaru !== konfirmasiPassword) {
      setError("Konfirmasi password baru tidak sama.")
      return
    }

    setSaving(true)

    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          password_lama: passwordLama,
          password_baru: passwordBaru,
          konfirmasi_password: konfirmasiPassword,
        }),
      })
      setInfo("Password berhasil diubah.")
      setPasswordLama("")
      setPasswordBaru("")
      setKonfirmasiPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah password.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Ubah Password" onClose={onClose}>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Password Lama
          </label>
          <Input
            type="password"
            value={passwordLama}
            onChange={(e) => setPasswordLama(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Password Baru
          </label>
          <Input
            type="password"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            placeholder="Minimal 6 karakter"
            disabled={saving}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Konfirmasi Password Baru
          </label>
          <Input
            type="password"
            value={konfirmasiPassword}
            onChange={(e) => setKonfirmasiPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit()
            }}
            disabled={saving}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {info && <p className="text-sm text-primary">{info}</p>}

        <Button onClick={submit} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <KeyRound className="w-4 h-4" />
          )}
          Ubah Password
        </Button>
      </div>
    </Modal>
  )
}
