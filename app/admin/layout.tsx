"use client"

import {
  Building,
  CalendarRange,
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  School,
  Users,
} from "lucide-react"

import { RequireRole } from "@/components/require-role"
import { PortalShell, PortalMenuItem } from "@/components/portal-shell"

const menus: PortalMenuItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Tahun Ajaran", href: "/admin/tahun-ajaran", icon: CalendarRange },
  { title: "Pengguna", href: "/admin/pengguna", icon: Users },
  { title: "Kelas", href: "/admin/kelas", icon: School },
  { title: "Guru", href: "/admin/guru", icon: GraduationCap },
  { title: "Siswa", href: "/admin/siswa", icon: Users },
  { title: "Mata Pelajaran", href: "/admin/mapel", icon: BookOpen },
  {
    title: "Informasi Sekolah",
    href: "/admin/informasi-sekolah",
    icon: Building,
  },
  { title: "Chat", href: "/admin/chat", icon: MessageSquare },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireRole role="admin">
      {(user) => (
        <PortalShell user={user} roleLabel="Admin" menus={menus}>
          {children}
        </PortalShell>
      )}
    </RequireRole>
  )
}
