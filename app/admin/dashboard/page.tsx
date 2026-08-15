"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  Building,
  CalendarRange,
  GraduationCap,
  KeyRound,
  Loader2,
  School,
  UserCheck,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatCard = {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
}

const MENU_ADMIN = [
  { href: "/admin/tahun-ajaran", label: "Tahun Ajaran", desc: "Kelola periode tahun ajaran sekolah.", icon: CalendarRange },
  { href: "/admin/pengguna", label: "Pengguna", desc: "Kelola akun staf di luar guru & siswa.", icon: Users },
  { href: "/admin/kelas", label: "Kelas", desc: "Lihat isi kelas per tahun ajaran.", icon: School },
  { href: "/admin/guru", label: "Guru", desc: "Kelola data guru dan akun pengajar.", icon: GraduationCap },
  { href: "/admin/siswa", label: "Siswa", desc: "Kelola data siswa.", icon: Users },
  { href: "/admin/mapel", label: "Mata Pelajaran", desc: "Kelola daftar mata pelajaran.", icon: BookOpen },
  { href: "/admin/informasi-sekolah", label: "Informasi Sekolah", desc: "Profil sekolah untuk kop sertifikat.", icon: Building },
  { href: "/admin/reset-password", label: "Ubah Password", desc: "Ubah password akun Anda sendiri.", icon: KeyRound },
]

export default function AdminDashboardPage() {
  const [cards, setCards] = useState<StatCard[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const muat = async () => {
      try {
        const tahunAjaranRes = await apiFetch("/tahun-ajaran")
        const tahunAjaranList = tahunAjaranRes.data || []
        const aktif = tahunAjaranList.find((t: { is_aktif: boolean }) => t.is_aktif)

        const [siswaTotal, siswaAktif, guruRes, mapelRes, penggunaRes, kelasRes] =
          await Promise.all([
            apiFetch("/siswa/master?limit=1"),
            apiFetch("/siswa/master?limit=1&status=aktif"),
            apiFetch("/data/guru/"),
            apiFetch("/mapel"),
            apiFetch("/role/user"),
            aktif
              ? apiFetch(`/riwayat-kelas/kelas-list?tahun_ajaran=${encodeURIComponent(aktif.nama)}`)
              : Promise.resolve({ data: [] }),
          ])

        if (cancelled) return

        const guruList: { user: { acc: "y" | "n" } }[] = guruRes.data || []
        const guruAktifCount = guruList.filter((g) => g.user?.acc === "y").length

        setCards([
          {
            label: "Total Siswa",
            value: (siswaTotal.pagination?.total ?? 0).toLocaleString("id-ID"),
            sub: `${(siswaAktif.pagination?.total ?? 0).toLocaleString("id-ID")} aktif`,
            icon: Users,
          },
          {
            label: "Total Guru",
            value: String(guruList.length),
            sub: `${guruAktifCount} akun aktif`,
            icon: GraduationCap,
          },
          {
            label: "Kelas",
            value: String((kelasRes.data || []).length),
            sub: aktif ? `TA ${aktif.nama}` : "Belum ada tahun ajaran aktif",
            icon: School,
          },
          {
            label: "Mata Pelajaran",
            value: String((mapelRes.data || []).length),
            icon: BookOpen,
          },
          {
            label: "Pengguna Staf",
            value: String((penggunaRes.data || []).length),
            sub: "Di luar guru & siswa",
            icon: UserCheck,
          },
          {
            label: "Tahun Ajaran Aktif",
            value: aktif ? aktif.nama : "-",
            icon: CalendarRange,
          },
        ])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data dashboard.")
        }
      }
    }

    muat()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan data sekolah secara keseluruhan.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!cards && !error ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data...
        </div>
      ) : (
        cards && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.label} className="dashboard-card">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <card.icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tracking-tight truncate">{card.value}</p>
                  {card.sub && (
                    <p className="text-xs text-muted-foreground">{card.sub}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-base font-bold">Menu Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MENU_ADMIN.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/70">
                  <item.icon className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
