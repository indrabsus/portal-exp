import { io, Socket } from "socket.io-client"
import { getToken } from "./auth"

let socket: Socket | null = null

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null

  if (!socket) {
    const token = getToken()
    if (!token) return null

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://exs.sakuci.id")

    socket = io(apiUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on("connect", () => {
      // Minta daftar user yang sedang online saat terhubung
      socket?.emit("get_online_users")
    })

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message)
    })
  }

  return socket
}

export function reconnectSocket(): Socket | null {
  disconnectSocket()
  return getSocket()
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
