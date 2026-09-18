"use client"

import { useEffect, useState } from "react"
import { getUser, UserLogin } from "@/lib/auth"
import { ChatView } from "@/components/chat/chat-view"

export default function AdminChatPage() {
  const [user, setUser] = useState<UserLogin | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  if (!user) return null

  return <ChatView user={user} />
}
