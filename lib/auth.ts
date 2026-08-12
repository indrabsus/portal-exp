import { apiFetch } from "@/lib/api"

export type UserLogin = {
  userId: string
  username: string
  id_role: string | number
  nama_role: string
  role: string
  gambar?: string | null
  id_data?: string
}

export type Role = "admin" | "kajur" | "guru" | "siswa"

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin/dashboard",
  kajur: "/kajur/dashboard",
  guru: "/guru/dashboard",
  siswa: "/siswa/dashboard",
}

export const saveAuth = (token: string, user: UserLogin) => {
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user))
}

export const getToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export const getUser = (): UserLogin | null => {
  if (typeof window === "undefined") return null

  const raw = localStorage.getItem("user")
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const logout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export const getRole = (user: UserLogin | null): string => {
  return String(user?.role || user?.nama_role || "")
    .toLowerCase()
    .trim()
}

export const isAdmin = (user: UserLogin | null) => getRole(user) === "admin"
export const isKajur = (user: UserLogin | null) => getRole(user) === "kajur"
export const isGuru = (user: UserLogin | null) => getRole(user) === "guru"
export const isSiswa = (user: UserLogin | null) => getRole(user) === "siswa"

export const getRoleHome = (user: UserLogin | null) => {
  const role = getRole(user) as Role
  return ROLE_HOME[role] || null
}

export const login = async (username: string, password: string) => {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })

  const user: UserLogin = res.data
  saveAuth(res.token, user)

  return user
}
