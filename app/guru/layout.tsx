"use client"

import {
  BookMarked,
  BookOpen,
  CalendarRange,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  School,
} from "lucide-react"

import { RequireRole } from "@/components/require-role"
import { PortalShell, PortalMenuItem } from "@/components/portal-shell"

const menus: PortalMenuItem[] = [
  { title: "Dashboard", href: "/guru/dashboard", icon: LayoutDashboard },
  { title: "Absen", href: "/guru/absen", icon: CalendarRange },
  { title: "Pembagian Mengajar", href: "/guru/mengajar", icon: School },
  { title: "Absen Siswa", href: "/guru/absen-siswa", icon: ClipboardList },
  { title: "Rekap Absen Siswa", href: "/guru/rekap-absen-siswa", icon: ListChecks },
  { title: "Nilai Manual", href: "/guru/nilai-manual", icon: NotebookPen },
  { title: "Materi", href: "/guru/materi", icon: BookOpen },
  { title: "Bank Soal", href: "/guru/bank-soal", icon: BookMarked },
  { title: "Tugas", href: "/guru/tugas", icon: FileText },
]

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireRole role="guru">
      {(user) => (
        <PortalShell user={user} roleLabel="Guru" menus={menus}>
          {children}
        </PortalShell>
      )}
    </RequireRole>
  )
}
