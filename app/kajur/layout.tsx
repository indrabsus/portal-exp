"use client"

import { Award, LayoutDashboard, MessageSquareText, Sparkles, Wallet } from "lucide-react"

import { RequireRole } from "@/components/require-role"
import { PortalShell, PortalMenuItem } from "@/components/portal-shell"

const menus: PortalMenuItem[] = [
  { title: "Dashboard", href: "/kajur/dashboard", icon: LayoutDashboard },
  { title: "Sertifikat Manual", href: "/kajur/sertifikat-manual", icon: Award },
  { title: "Project & Inovasi Siswa", href: "/kajur/inovasi-siswa", icon: Sparkles },
  { title: "Catatan Siswa", href: "/kajur/catatan-siswa", icon: MessageSquareText },
  { title: "Keuangan Siswa", href: "/kajur/keuangan-siswa", icon: Wallet },
]

export default function KajurLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireRole role="kajur">
      {(user) => (
        <PortalShell user={user} roleLabel="Kepala Jurusan" menus={menus}>
          {children}
        </PortalShell>
      )}
    </RequireRole>
  )
}
