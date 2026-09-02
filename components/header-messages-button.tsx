"use client"

import { MessageSquare } from "lucide-react"
import { chatStore, useChatStore } from "@/lib/chat-store"

// Top-of-app messages button: shows how many unread replies the client has and opens the chat.
export function HeaderMessagesButton() {
  const { unread } = useChatStore()
  const hasUnread = unread > 0

  return (
    <button
      type="button"
      onClick={() => chatStore.setOpen(true)}
      aria-label={hasUnread ? `Ubutumwa: ${unread} butarasomwa` : "Fungura ubutumwa"}
      className={`relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow transition ${
        hasUnread
          ? "border-red-500 bg-red-600 text-white hover:bg-red-500"
          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
      }`}
    >
      <MessageSquare className={`h-3.5 w-3.5 ${hasUnread ? "text-white" : "text-red-400"}`} />
      <span>Ubutumwa</span>
      {hasUnread ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-white px-1 text-[10px] font-black text-red-600 tabular-nums">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </button>
  )
}
