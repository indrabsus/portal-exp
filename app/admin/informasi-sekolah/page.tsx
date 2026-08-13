"use client"

import { useEffect, useState } from "react"
import { Building, Loader2, Save } from "lucide-react"

import { apiFetch } from "@/lib/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Sekolah = {
  id_sekolah?: string
  nama_sekolah: string
  alamat: string | null
  email: string | null
  instagram: string | null
  no_telepon: string | null
  nama_kepala_sekolah: string | null
  nip_kepala_sekolah: string | null
  visi: string | null
  misi: string | null
}

const EMPTY: Sekolah = {
  nama_sekolah: "",
  alamat: "",
  email: "",
  instagram: "",
  no_telepon: "",
  nama_kepala_sekolah: "",
  nip_kepala_sekolah: "",
  visi: "",
  misi: "",
}

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

export default function InformasiSekolahPage() {
  const [form, setForm] = useState<Sekolah>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiFetch("/informasi-sekolah")
      .then((res) => {
        if (!cancelled && res.data) {
          setForm({ ...EMPTY, ...res.data })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const field = (name: keyof Sekolah) => ({
    value: form[name] || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [name]: e.target.value })),
    disabled: saving,
  })

  const simpan = async () => {
    setError(null)
    setInfo(null)

    if (!form.nama_sekolah.trim()) {
      setError("Nama sekolah wajib diisi.")
      return
    }

    setSaving(true)

    try {
      const res = await apiFetch("/informasi-sekolah", {
        method: "PUT",
        body: JSON.stringify(form),
      })
      setForm({ ...EMPTY, ...res.data })
      setInfo("Informasi sekolah berhasil disimpan.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Informasi Sekolah</h1>
        <p className="text-sm text-muted-foreground">
          Digunakan untuk kop sertifikat dan halaman publik.
        </p>
      </div>

      <Card className="dashboard-card max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            Profil Sekolah
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat data...
            </div>
          ) : (
            <div className="space-y-3">
              <FieldWrap label="Nama Sekolah">
                <Input {...field("nama_sekolah")} required />
              </FieldWrap>
              <FieldWrap label="Alamat">
                <Input {...field("alamat")} />
              </FieldWrap>
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldWrap label="Email">
                  <Input type="email" {...field("email")} />
                </FieldWrap>
                <FieldWrap label="Instagram">
                  <Input placeholder="@namasekolah" {...field("instagram")} />
                </FieldWrap>
              </div>
              <FieldWrap label="No. Telepon">
                <Input {...field("no_telepon")} />
              </FieldWrap>
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldWrap label="Nama Kepala Sekolah">
                  <Input {...field("nama_kepala_sekolah")} />
                </FieldWrap>
                <FieldWrap label="NIP Kepala Sekolah (untuk sertifikat)">
                  <Input {...field("nip_kepala_sekolah")} />
                </FieldWrap>
              </div>
              <FieldWrap label="Visi (untuk halaman publik)">
                <textarea className={textareaClass} rows={2} {...field("visi")} />
              </FieldWrap>
              <FieldWrap label="Misi (untuk halaman publik, satu poin per baris)">
                <textarea className={textareaClass} rows={4} {...field("misi")} />
              </FieldWrap>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {info && <p className="text-sm text-primary">{info}</p>}

              <Button onClick={simpan} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
