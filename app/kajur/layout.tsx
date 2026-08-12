"use client"

import { LayoutDashboard } from "lucide-react"

import { RequireRole } from "@/components/require-role"
import { PortalShell, PortalMenuItem } from "@/components/portal-shell"

const menus: PortalMenuItem[] = [
  { title: "Dashboard", href: "/kajur/dashboard", icon: LayoutDashboard },
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
