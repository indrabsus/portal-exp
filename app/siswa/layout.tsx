"use client"

import {
  Award,
  BookOpen,
  CalendarRange,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  Sparkles,
} from "lucide-react"

import { RequireRole } from "@/components/require-role"
import { PortalShell, PortalMenuItem } from "@/components/portal-shell"

const menus: PortalMenuItem[] = [
  { title: "Dashboard", href: "/siswa/dashboard", icon: LayoutDashboard },
  { title: "Tugas", href: "/siswa/tugas", icon: FileText },
  { title: "Nilai", href: "/siswa/nilai", icon: NotebookPen },
  { title: "Materi", href: "/siswa/materi", icon: BookOpen },
  { title: "Absen", href: "/siswa/absen", icon: CalendarRange },
  { title: "Sertifikat", href: "/siswa/sertifikat", icon: Award },
  { title: "Status SPP", href: "/siswa/spp", icon: CreditCard },
  { title: "Status PPDB", href: "/siswa/ppdb", icon: GraduationCap },
  { title: "Project & Inovasi Saya", href: "/siswa/proyek", icon: Sparkles },
]

export default function SiswaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireRole role="siswa">
      {(user) => (
        <PortalShell user={user} roleLabel="Siswa" menus={menus}>
          {children}
        </PortalShell>
      )}
    </RequireRole>
  )
}
