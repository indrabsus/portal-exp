"use client"

import {
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  School,
} from "lucide-react"

import { RequireRole } from "@/components/require-role"
import { PortalShell, PortalMenuItem } from "@/components/portal-shell"

const menus: PortalMenuItem[] = [
  { title: "Dashboard", href: "/kurikulum/dashboard", icon: LayoutDashboard },
  { title: "Rekap Nilai Siswa", href: "/kurikulum/nilai", icon: ClipboardCheck },
  { title: "Rekap Absen Siswa", href: "/kurikulum/absen", icon: ListChecks },
  { title: "Pembagian Mengajar", href: "/kurikulum/mengajar", icon: School },
  { title: "Chat", href: "/kurikulum/chat", icon: MessageSquare },
]

export default function KurikulumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireRole role="kurikulum">
      {(user) => (
        <PortalShell user={user} roleLabel="Kurikulum" menus={menus}>
          {children}
        </PortalShell>
      )}
    </RequireRole>
  )
}
