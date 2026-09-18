"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getSocket } from "@/lib/socket"
import { UserLogin } from "@/lib/auth"

export function FloatingChatButton({ user }: { user: UserLogin }) {
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  // Jangan tampilkan floating button jika sudah berada di halaman /chat
  const isChatPage = pathname?.includes("/chat")

  useEffect(() => {
    // Ambil total unread saat awal muat
    const fetchUnread = async () => {
      try {
        const res = await apiFetch("/chat/unread-count")
        if (res?.status === "success") {
          setUnreadCount(res.data?.unread || 0)
        }
      } catch (e) {
        // Abaikan
      }
    }

    fetchUnread()

    // Dengarkan Socket.IO
    const socket = getSocket()
    if (!socket) return

    const onNewMessage = (msg: { receiver_id: string }) => {
      if (String(msg.receiver_id) === String(user.userId) && !isChatPage) {
        setUnreadCount((prev) => prev + 1)
      }
    }

    const onUnreadCleared = () => {
      fetchUnread()
    }

    socket.on("new_message", onNewMessage)
    socket.on("unread_cleared", onUnreadCleared)

    return () => {
      socket.off("new_message", onNewMessage)
      socket.off("unread_cleared", onUnreadCleared)
    }
  }, [user.userId, isChatPage])

  if (isChatPage) return null

  const role = String(user.role || user.nama_role || "siswa").toLowerCase()
  const chatUrl = `/${role}/chat`

  return (
    <div className="fixed bottom-6 right-6 z-40 print:hidden">
      <button
        onClick={() => router.push(chatUrl)}
        className="group relative flex size-13 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-primary/30 active:scale-95"
        title="Buka Chat Realtime"
      >
        <MessageSquare className="size-6 transition-transform group-hover:scale-110" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-5.5 items-center justify-center rounded-full bg-destructive text-[11px] font-extrabold text-destructive-foreground ring-2 ring-slate-950 animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
