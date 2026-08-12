"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { GraduationCap, LogOut, Menu, X } from "lucide-react"

import { logout, UserLogin } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type PortalMenuItem = {
  title: string
  href: string
  icon: LucideIcon
}

export function PortalShell({
  user,
  roleLabel,
  menus,
  children,
}: {
  user: UserLogin
  roleLabel: string
  menus: PortalMenuItem[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <main className="min-h-screen text-foreground">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          dark fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-950 text-foreground transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-tight">
                Portal Akademik
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {roleLabel}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {user.username?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <Badge variant="outline" className="mt-1">
                {roleLabel}
              </Badge>
            </div>
          </div>
        </div>

        <nav className="px-3 space-y-1 pb-24">
          {menus.map((menu) => {
            const Icon = menu.icon
            const active =
              pathname === menu.href || pathname.startsWith(menu.href + "/")

            return (
              <button
                key={menu.href}
                onClick={() => {
                  router.push(menu.href)
                  setMobileOpen(false)
                }}
                className={`
                  group relative w-full flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150
                  ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{menu.title}</span>
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      <section className="transition-all duration-300 md:pl-72">
        <header className="dark sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950 text-foreground flex items-center justify-between px-4 md:px-6">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden md:block">
            <h2 className="font-semibold">Portal Akademik</h2>
            <p className="text-xs text-muted-foreground">
              SMK Sangkuriang 1 Cimahi
            </p>
          </div>

          <Badge variant="outline">{roleLabel}</Badge>
        </header>

        <div className="p-4 md:p-6">{children}</div>
      </section>
    </main>
  )
}
