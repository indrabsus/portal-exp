"use client"

import { LayoutDashboard } from "lucide-react"

import { RequireRole } from "@/components/require-role"
import { PortalShell, PortalMenuItem } from "@/components/portal-shell"

const menus: PortalMenuItem[] = [
  { title: "Dashboard", href: "/guru/dashboard", icon: LayoutDashboard },
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
