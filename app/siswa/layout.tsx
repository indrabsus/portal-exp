"use client"

import { LayoutDashboard } from "lucide-react"

import { RequireRole } from "@/components/require-role"
import { PortalShell, PortalMenuItem } from "@/components/portal-shell"

const menus: PortalMenuItem[] = [
  { title: "Dashboard", href: "/siswa/dashboard", icon: LayoutDashboard },
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
