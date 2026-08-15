const API_URL = process.env.NEXT_PUBLIC_API_URL

// Backend mengembalikan path relatif (mis. "/uploads/profil/xxx.jpg") -
// tempel base URL backend di depannya biar bisa dipakai langsung sebagai src.
export function getAssetUrl(path: string | null | undefined) {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return `${API_URL}${path}`
}

// Pesan yang dikembalikan backend (middleware auth) saat token tidak ada /
// tidak valid / kedaluwarsa. Kalau ini muncul padahal kita memang sedang
// mengirim token, berarti sesi login sudah tidak berlaku lagi.
const AUTH_ERROR_MESSAGES = ["Invalid Token.", "Access Denied. No Token Provided."]

function paksaLogout() {
  if (typeof window === "undefined") return

  localStorage.removeItem("token")
  localStorage.removeItem("user")

  if (window.location.pathname !== "/login") {
    window.location.href = "/login"
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL belum diset di .env.local")
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = res.headers.get("content-type") || ""

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bentuk JSON beda-beda per endpoint
  let data: any = null

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null)
  } else {
    const text = await res.text().catch(() => "")
    data = text ? { message: text } : null
  }

  if (!res.ok) {
    const message = data?.message || data?.error || "Terjadi kesalahan"

    if (token && (res.status === 401 || AUTH_ERROR_MESSAGES.includes(message))) {
      paksaLogout()
      // Jangan lempar error ke pemanggil (biar tidak sempat muncul alert
      // "Invalid Token" sesaat sebelum redirect ke halaman login).
      return new Promise<never>(() => {})
    }

    throw new Error(message)
  }

  return data
}
