"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { getRole, getRoleHome, getUser, UserLogin } from "@/lib/auth"

export function RequireRole({
  role,
  children,
}: {
  role: "admin" | "kajur" | "guru" | "siswa"
  children: (user: UserLogin) => React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<UserLogin | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const currentUser = getUser()

    if (!currentUser) {
      router.replace("/")
      return
    }

    if (getRole(currentUser) !== role) {
      router.replace(getRoleHome(currentUser) || "/")
      return
    }

    setUser(currentUser)
    setChecked(true)
  }, [router, role])

  if (!checked || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return <>{children(user)}</>
}
