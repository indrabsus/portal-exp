"use client"

import { LayoutDashboard } from "lucide-react"

import { RequireRole } from "@/components/require-role"
import { PortalShell, PortalMenuItem } from "@/components/portal-shell"

const menus: PortalMenuItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
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
