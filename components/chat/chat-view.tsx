"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  ArrowLeft,
  X,
  FileText,
  Download,
  Loader2,
  Users,
  MessageSquare,
  Sparkles,
  Smile,
} from "lucide-react"

import { apiFetch, getAssetUrl } from "@/lib/api"
import { UserLogin } from "@/lib/auth"
import { getSocket } from "@/lib/socket"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type ChatPartner = {
  userId: string
  nama: string
  role: string
  avatar: string | null
  isOnline?: boolean
}

export type ChatMessageItem = {
  id: string
  room_id: string
  sender_id: string
  sender_name: string
  sender_role: string
  sender_avatar: string | null
  receiver_id: string | null
  pesan: string
  lampiran: string | null
  lampiran_tipe: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export type ConversationItem = {
  partner: ChatPartner
  lastMessage: {
    id: string
    pesan: string
    lampiran: string | null
    lampiran_tipe: string | null
    sender_id: string
    is_read: boolean
    created_at: string
  }
  unreadCount: number
}

function formatChatTime(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ""

  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()

  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  const timeStr = `${hours}:${minutes}`

  if (isToday) return timeStr

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) {
    return `Kemarin ${timeStr}`
  }

  const day = String(d.getDate()).padStart(2, "0")
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ]
  const month = monthNames[d.getMonth()]
  return `${day} ${month} ${timeStr}`
}

function AvatarBox({
  nama,
  avatar,
  isOnline,
  size = "size-10",
  textSize = "text-sm",
}: {
  nama: string
  avatar: string | null
  isOnline?: boolean
  size?: string
  textSize?: string
}) {
  const url = getAssetUrl(avatar)

  return (
    <div className="relative shrink-0">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={nama}
          className={`${size} rounded-full object-cover border border-slate-700/50`}
        />
      ) : (
        <div
          className={`flex ${size} items-center justify-center rounded-full bg-primary/20 ${textSize} font-bold text-primary border border-primary/30`}
        >
          {nama?.slice(0, 2).toUpperCase() || "??"}
        </div>
      )}
      {typeof isOnline === "boolean" && (
        <span
          className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-slate-950 ${
            isOnline ? "bg-emerald-500 ring-2 ring-emerald-500/30" : "bg-slate-500"
          }`}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  )
}

export function ChatView({
  user,
  initialPartnerId,
}: {
  user: UserLogin
  initialPartnerId?: string
}) {
  const myId = String(user.userId)

  const [activeTab, setActiveTab] = useState<"chat" | "kontak">("chat")
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "guru" | "siswa">("all")

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [contacts, setContacts] = useState<ChatPartner[]>([])
  const [activePartner, setActivePartner] = useState<ChatPartner | null>(null)
  const [messages, setMessages] = useState<ChatMessageItem[]>([])

  const [pesanInput, setPesanInput] = useState("")
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  const [partnerTyping, setPartnerTyping] = useState(false)
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    })
  }

  // 1. Muat Daftar Percakapan
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true)
      const res = await apiFetch("/chat/conversations")
      if (res?.status === "success") {
        setConversations(res.data || [])
      }
    } catch (err) {
      console.error("Gagal memuat percakapan:", err)
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  // 2. Muat Daftar Kontak
  const fetchContacts = useCallback(
    async (q = "", role = "") => {
      try {
        setLoadingContacts(true)
        const params = new URLSearchParams()
        if (q) params.set("q", q)
        if (role && role !== "all") params.set("role", role)

        const res = await apiFetch(`/chat/contacts?${params.toString()}`)
        if (res?.status === "success") {
          setContacts(res.data || [])
        }
      } catch (err) {
        console.error("Gagal memuat kontak:", err)
      } finally {
        setLoadingContacts(false)
      }
    },
    []
  )

  // 3. Muat Riwayat Pesan dengan Lawan Bicara
  const fetchMessages = useCallback(
    async (partnerId: string) => {
      try {
        setLoadingMessages(true)
        const res = await apiFetch(`/chat/messages/${partnerId}`)
        if (res?.status === "success") {
          setMessages(res.data || [])
          setTimeout(() => scrollToBottom(false), 80)
        }
      } catch (err) {
        console.error("Gagal memuat pesan:", err)
      } finally {
        setLoadingMessages(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (activeTab === "kontak") {
      fetchContacts(searchQuery, roleFilter)
    }
  }, [activeTab, searchQuery, roleFilter, fetchContacts])

  // Inisialisasi Socket.IO
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const onNewMessage = (msg: ChatMessageItem) => {
      // Jika pesan adalah percakapan dengan activePartner saat ini
      if (
        activePartner &&
        (msg.sender_id === activePartner.userId ||
          msg.receiver_id === activePartner.userId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        setTimeout(() => scrollToBottom(true), 60)

        // Otomatis tandai sebagai dibaca jika pesan masuk dari activePartner
        if (msg.sender_id === activePartner.userId) {
          socket.emit("mark_as_read", { senderId: activePartner.userId })
        }
      }

      // Perbarui daftar percakapan
      setConversations((prev) => {
        const partnerId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id
        if (!partnerId) return prev

        const existingIdx = prev.findIndex((c) => c.partner.userId === partnerId)
        const isCurrentActive = activePartner?.userId === partnerId

        const newUnread =
          isCurrentActive || msg.sender_id === myId
            ? 0
            : existingIdx >= 0
            ? prev[existingIdx].unreadCount + 1
            : 1

        const updatedItem: ConversationItem = {
          partner:
            existingIdx >= 0
              ? prev[existingIdx].partner
              : {
                  userId: partnerId,
                  nama: msg.sender_id === partnerId ? msg.sender_name : "Pengguna",
                  role: msg.sender_id === partnerId ? msg.sender_role : "Pengguna",
                  avatar: msg.sender_id === partnerId ? msg.sender_avatar : null,
                  isOnline: onlineUserIds.has(partnerId),
                },
          lastMessage: {
            id: msg.id,
            pesan: msg.pesan,
            lampiran: msg.lampiran,
            lampiran_tipe: msg.lampiran_tipe,
            sender_id: msg.sender_id,
            is_read: isCurrentActive ? true : msg.is_read,
            created_at: msg.created_at,
          },
          unreadCount: newUnread,
        }

        const filtered = prev.filter((c) => c.partner.userId !== partnerId)
        return [updatedItem, ...filtered]
      })
    }

    const onUserTyping = (data: {
      fromUserId: string
      fromUserName: string
      isTyping: boolean
    }) => {
      if (activePartner && String(data.fromUserId) === activePartner.userId) {
        setPartnerTyping(!!data.isTyping)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setPartnerTyping(false)
          }, 3000)
        }
      }
    }

    const onMessagesRead = (data: { readBy: string; readAt: string }) => {
      if (activePartner && String(data.readBy) === activePartner.userId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_id === myId ? { ...m, is_read: true, read_at: data.readAt } : m
          )
        )
      }
    }

    const onUserStatus = (data: { userId: string; status: "online" | "offline" }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev)
        if (data.status === "online") next.add(String(data.userId))
        else next.delete(String(data.userId))
        return next
      })

      // Update activePartner status
      if (activePartner && String(data.userId) === activePartner.userId) {
        setActivePartner((prev) =>
          prev ? { ...prev, isOnline: data.status === "online" } : null
        )
      }
    }

    const onOnlineUsersList = (ids: string[]) => {
      setOnlineUserIds(new Set(ids.map(String)))
    }

    socket.on("new_message", onNewMessage)
    socket.on("user_typing", onUserTyping)
    socket.on("messages_read", onMessagesRead)
    socket.on("user_status", onUserStatus)
    socket.on("online_users_list", onOnlineUsersList)

    // Trigger minta daftar user online saat komponen dimuat
    socket.emit("get_online_users")

    return () => {
      socket.off("new_message", onNewMessage)
      socket.off("user_typing", onUserTyping)
      socket.off("messages_read", onMessagesRead)
      socket.off("user_status", onUserStatus)
      socket.off("online_users_list", onOnlineUsersList)
    }
  }, [activePartner, myId, onlineUserIds])

  // Pilih Partner Chat
  const selectPartner = (partner: ChatPartner) => {
    setActivePartner({
      ...partner,
      isOnline: onlineUserIds.has(partner.userId),
    })
    setPartnerTyping(false)
    fetchMessages(partner.userId)

    // Reset unread count di percakapan
    setConversations((prev) =>
      prev.map((c) =>
        c.partner.userId === partner.userId ? { ...c, unreadCount: 0 } : c
      )
    )

    const socket = getSocket()
    if (socket) {
      socket.emit("mark_as_read", { senderId: partner.userId })
    }
  }

  // Handle Pengetikan
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPesanInput(e.target.value)

    if (activePartner) {
      const socket = getSocket()
      if (socket) {
        socket.emit("typing", {
          receiverId: activePartner.userId,
          isTyping: e.target.value.length > 0,
        })
      }
    }
  }

  // Handle Pilih Lampiran File
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file)
      setFilePreview(previewUrl)
    } else {
      setFilePreview(null)
    }
  }

  const cancelFile = () => {
    setSelectedFile(null)
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Kirim Pesan
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!activePartner) return

    const text = pesanInput.trim()
    if (!text && !selectedFile) return

    setSending(true)

    // Hentikan typing emit
    const socket = getSocket()
    if (socket) {
      socket.emit("typing", {
        receiverId: activePartner.userId,
        isTyping: false,
      })
    }

    try {
      if (selectedFile) {
        // Kirim via REST Multipart jika ada file
        const formData = new FormData()
        formData.append("receiver_id", activePartner.userId)
        formData.append("pesan", text)
        formData.append("lampiran", selectedFile)

        const res = await apiFetch("/chat/send", {
          method: "POST",
          body: formData,
        })

        if (res?.status === "success") {
          setPesanInput("")
          cancelFile()
        }
      } else {
        // Kirim realtime via Socket.IO untuk performa ultra-cepat
        if (socket && socket.connected) {
          socket.emit(
            "send_message",
            {
              receiverId: activePartner.userId,
              pesan: text,
            },
            (response: { ok: boolean; error?: string }) => {
              if (!response?.ok) {
                console.error("Gagal kirim via socket:", response?.error)
              }
            }
          )
          setPesanInput("")
        } else {
          // Fallback ke REST API jika socket terputus
          await apiFetch("/chat/send", {
            method: "POST",
            body: JSON.stringify({
              receiver_id: activePartner.userId,
              pesan: text,
            }),
          })
          setPesanInput("")
        }
      }
    } catch (err) {
      console.error("Gagal mengirim pesan:", err)
      alert("Gagal mengirim pesan: " + (err instanceof Error ? err.message : "Kesalahan sistem"))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="dark flex h-[calc(100vh-140px)] min-h-[500px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
      {/* ------------------------------------------------------------- */}
      {/* KOLOM KIRI: DAFTAR CHAT & KONTAK */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`
          flex w-full flex-col border-r border-slate-800 bg-slate-900/95 text-slate-100 transition-all duration-300 md:w-80 lg:w-96
          ${activePartner ? "hidden md:flex" : "flex"}
        `}
      >
        {/* Header Sisi Kiri */}
        <div className="border-b border-slate-800 p-3.5">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <MessageSquare className="size-4" />
              </div>
              <h2 className="text-base font-bold tracking-tight text-slate-100">Pesan & Obrolan</h2>
            </div>
            <Badge variant="outline" className="text-xs border-slate-700 text-slate-300">
              {onlineUserIds.size} Online
            </Badge>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder={activeTab === "chat" ? "Cari percakapan..." : "Cari kontak nama..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 text-xs bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-400 focus-visible:ring-primary/40"
            />
          </div>

          {/* Tab Switcher: Percakapan vs Direktori Kontak */}
          <div className="mt-3 flex rounded-lg bg-slate-950 p-1 border border-slate-800/80">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Percakapan
            </button>
            <button
              onClick={() => setActiveTab("kontak")}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "kontak"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Daftar Kontak
            </button>
          </div>

          {/* Filter Role (Khusus Tab Kontak) */}
          {activeTab === "kontak" && (
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
              {(["all", "guru", "siswa"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors cursor-pointer border ${
                    roleFilter === r
                      ? "bg-primary/20 text-sky-300 border-primary/50 font-semibold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700/60 hover:text-white border-slate-700/60"
                  }`}
                >
                  {r === "all" ? "Semua" : r === "guru" ? "Guru & Staf" : "Siswa"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {activeTab === "chat" ? (
            /* TAB PERCAKAPAN */
            loadingConversations ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="mt-2 text-xs">Memuat percakapan...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="flex size-12 items-center justify-center rounded-full bg-slate-800/50 text-slate-400">
                  <MessageSquare className="size-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-200">Belum Ada Percakapan</p>
                <p className="mt-1 text-xs text-slate-400">
                  Buka tab <strong>Daftar Kontak</strong> untuk memulai percakapan baru.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("kontak")}
                  className="mt-4 text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  <Users className="mr-1.5 size-3.5" />
                  Buka Kontak
                </Button>
              </div>
            ) : (
              conversations
                .filter((c) =>
                  searchQuery
                    ? c.partner.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.lastMessage.pesan.toLowerCase().includes(searchQuery.toLowerCase())
                    : true
                )
                .map((item) => {
                  const isSelected = activePartner?.userId === item.partner.userId
                  const isOnline = onlineUserIds.has(item.partner.userId)

                  return (
                    <button
                      key={item.partner.userId}
                      onClick={() => selectPartner(item.partner)}
                      className={`
                        w-full flex items-center gap-3 p-3.5 text-left transition-colors cursor-pointer
                        ${
                          isSelected
                            ? "bg-primary/20 border-l-4 border-primary"
                            : "hover:bg-white/5"
                        }
                      `}
                    >
                      <AvatarBox
                        nama={item.partner.nama}
                        avatar={item.partner.avatar}
                        isOnline={isOnline}
                        size="size-11"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-sm font-semibold text-slate-100">{item.partner.nama}</p>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {formatChatTime(item.lastMessage.created_at)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-slate-400 flex items-center gap-1">
                            {item.lastMessage.sender_id === myId && (
                              <span className="text-primary shrink-0">
                                {item.lastMessage.is_read ? (
                                  <CheckCheck className="size-3.5 inline text-sky-400" />
                                ) : (
                                  <Check className="size-3.5 inline text-slate-400" />
                                )}
                              </span>
                            )}
                            <span className="truncate">
                              {item.lastMessage.lampiran && !item.lastMessage.pesan
                                ? "📎 Lampiran file"
                                : item.lastMessage.pesan}
                            </span>
                          </p>

                          {item.unreadCount > 0 && (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                              {item.unreadCount > 99 ? "99+" : item.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
            )
          ) : (
            /* TAB DAFTAR KONTAK */
            loadingContacts ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="mt-2 text-xs">Mencari kontak...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada kontak yang cocok dengan pencarian.
              </div>
            ) : (
              contacts.map((contact) => {
                const isSelected = activePartner?.userId === contact.userId
                const isOnline = onlineUserIds.has(contact.userId)

                return (
                  <button
                    key={contact.userId}
                    onClick={() => selectPartner(contact)}
                    className={`
                      w-full flex items-center gap-3 p-3.5 text-left transition-colors cursor-pointer
                      ${
                        isSelected
                          ? "bg-primary/20 border-l-4 border-primary"
                          : "hover:bg-white/5"
                      }
                    `}
                  >
                    <AvatarBox
                      nama={contact.nama}
                      avatar={contact.avatar}
                      isOnline={isOnline}
                      size="size-10"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">{contact.nama}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider border-slate-700 bg-slate-800/80 text-slate-200"
                        >
                          {contact.role}
                        </Badge>
                        <span className="text-[11px]">
                          {isOnline ? (
                            <span className="text-emerald-400 font-medium">Online</span>
                          ) : (
                            <span className="text-slate-400">Offline</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            )
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* KOLOM KANAN: JENDELA PERCAKAPAN AKTIF */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`
          flex flex-1 flex-col bg-slate-950
          ${!activePartner ? "hidden md:flex" : "flex"}
        `}
      >
        {activePartner ? (
          <>
            {/* Header Chat Aktif */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setActivePartner(null)}
                >
                  <ArrowLeft className="size-5" />
                </Button>

                <AvatarBox
                  nama={activePartner.nama}
                  avatar={activePartner.avatar}
                  isOnline={onlineUserIds.has(activePartner.userId)}
                  size="size-10"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold truncate max-w-[200px] md:max-w-xs text-slate-100">
                      {activePartner.nama}
                    </h3>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold uppercase border-slate-700 bg-slate-800/80 text-slate-200">
                      {activePartner.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    {partnerTyping ? (
                      <span className="text-primary font-medium italic animate-pulse">
                        sedang mengetik...
                      </span>
                    ) : onlineUserIds.has(activePartner.userId) ? (
                      <span className="text-emerald-400 font-medium">Online</span>
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Area Pesan Chat (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              {loadingMessages ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  <Loader2 className="size-7 animate-spin text-primary" />
                  <p className="mt-2 text-xs">Memuat riwayat chat...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 p-6">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="size-7" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-100">
                    Mulai Obrolan dengan {activePartner.nama}
                  </h4>
                  <p className="mt-1 text-xs max-w-xs text-slate-400">
                    Kirim pesan salam, pertanyaan materi, atau diskusi tugas di sini.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === myId
                  const lampiranUrl = getAssetUrl(msg.lampiran)

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`
                          relative max-w-[85%] sm:max-w-md md:max-w-lg rounded-2xl px-3.5 py-2.5 shadow-sm text-sm
                          ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none"
                          }
                        `}
                      >
                        {/* Lampiran Gambar / Dokumen */}
                        {lampiranUrl && (
                          <div className="mb-2 overflow-hidden rounded-xl">
                            {msg.lampiran_tipe === "image" ? (
                              <a href={lampiranUrl} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={lampiranUrl}
                                  alt="Lampiran"
                                  className="max-h-60 w-full object-cover rounded-lg hover:opacity-95 transition-opacity"
                                />
                              </a>
                            ) : (
                              <a
                                href={lampiranUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 rounded-lg bg-black/20 p-2.5 text-xs hover:bg-black/30 transition-colors"
                              >
                                <FileText className="size-5 shrink-0" />
                                <span className="flex-1 truncate font-medium">Lihat Dokumen</span>
                                <Download className="size-4 shrink-0" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Pesan Teks */}
                        {msg.pesan && (
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {msg.pesan}
                          </p>
                        )}

                        {/* Timestamp & Status Baca */}
                        <div
                          className={`
                            mt-1 flex items-center justify-end gap-1 text-[10px]
                            ${isMe ? "text-primary-foreground/75" : "text-slate-400"}
                          `}
                        >
                          <span>{formatChatTime(msg.created_at)}</span>
                          {isMe && (
                            <span>
                              {msg.is_read ? (
                                <CheckCheck className="size-3.5 text-emerald-300" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview Lampiran Sebelum Kirim */}
            {selectedFile && (
              <div className="border-t border-slate-800 bg-slate-900/80 px-4 py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {filePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={filePreview}
                      alt="preview"
                      className="size-10 rounded-lg object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-lg bg-slate-800 text-primary">
                      <FileText className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-100">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="size-7" onClick={cancelFile}>
                  <X className="size-4 text-destructive" />
                </Button>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/70 p-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Kirim Foto / Berkas"
                className="shrink-0 text-slate-400 hover:text-slate-100"
              >
                <Paperclip className="size-4" />
              </Button>

              <Input
                type="text"
                placeholder={`Ketik pesan ke ${activePartner.nama}...`}
                value={pesanInput}
                onChange={handleInputChange}
                className="flex-1 bg-slate-950 border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-primary/50"
              />

              <Button
                type="submit"
                disabled={sending || (!pesanInput.trim() && !selectedFile)}
                className="shrink-0 font-semibold"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Kirim</span>
                    <Send className="size-4 sm:ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          /* TAMPILAN KOSONG JIKA BELUM PILIH CHAT */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-primary shadow-inner">
              <MessageSquare className="size-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-100">
              Pusat Pesan & Chat Realtime
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              Pilih salah satu kontak Guru, Siswa, atau staf di menu sebelah kiri untuk memulai
              obrolan langsung secara realtime.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
