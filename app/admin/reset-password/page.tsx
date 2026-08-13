"use client"

import { useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function UbahPasswordPage() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ubah Password</h1>
        <p className="text-sm text-muted-foreground">
          Ubah password akun Anda sendiri.
        </p>
      </div>

      <Card className="dashboard-card max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            Ganti Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>
    </div>
  )
}
