"use client"

import { useState } from "react"
import useSWR from "swr"
import { MessageCircle, UserPlus, Bell, X, LogOut, ShieldCheck, Images, Users } from "lucide-react"
import { socialFetcher, type SocialUser } from "@/components/social/types"
import { AuthForms } from "@/components/social/auth-forms"
import { FeedPanel } from "@/components/social/feed-panel"
import { FriendsPanel } from "@/components/social/friends-panel"
import { ChatPanel } from "@/components/social/chat-panel"
import { NotificationsPanel } from "@/components/social/notifications-panel"

type Tab = "feed" | "chat" | "friends" | "notifications"

export function SocialHub() {
  const { data: meData, mutate: mutateMe } = useSWR("/api/auth/me", socialFetcher)
  const me: SocialUser | null = meData?.user ?? null

  const { data: notifData } = useSWR(me ? "/api/notifications" : null, socialFetcher, { refreshInterval: 20000 })
  const unread: number = notifData?.unread ?? 0

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("feed")
  const [activeChatUser, setActiveChatUser] = useState<SocialUser | null>(null)

  function openTo(t: Tab) {
    setTab(t)
    setOpen(true)
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    mutateMe({ user: null }, { revalidate: false })
    setOpen(false)
  }

  const iconBtn =
    "relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-emerald-500 hover:text-emerald-400"

  const tabBtn = (t: Tab, active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-bold transition ${active ? "text-emerald-400" : "text-slate-400"}`

  return (
    <>
      {/* Top-right button cluster: Chat, Add friends, Notifications */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => openTo("chat")} className={iconBtn} aria-label="Chat">
          <MessageCircle className="h-4 w-4" />
        </button>
        <button onClick={() => openTo("friends")} className={iconBtn} aria-label="Ongera abagenzi">
          <UserPlus className="h-4 w-4" />
        </button>
        <button onClick={() => openTo("notifications")} className={iconBtn} aria-label="Integuza">
          <Bell className="h-4 w-4" />
          {me && unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950 text-slate-100">
          {/* header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/brand/billy-face.jpg" alt="BILLY FASTER TRANSFER" className="h-8 w-8 rounded-full border border-emerald-500 object-cover" />
              <div className="leading-tight">
                <p className="text-sm font-black text-white">BILLY FASTER TRANSFER</p>
                {me ? (
                  <p className="flex items-center gap-1 text-[11px] text-slate-400">
                    {me.displayName}
                    {me.isAdmin ? <ShieldCheck className="h-3 w-3 text-emerald-400" /> : null}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">Injira canke wiyandikishe</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {me ? (
                <button onClick={logout} className="flex items-center gap-1 rounded-full border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-300">
                  <LogOut className="h-3.5 w-3.5" /> Sohoka
                </button>
              ) : null}
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-300 hover:bg-slate-800" aria-label="Funga">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!me ? (
            <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8">
              <AuthForms onAuthed={() => mutateMe()} />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                {tab === "feed" ? (
                  <FeedPanel me={me} />
                ) : tab === "chat" ? (
                  <div className="h-full">
                    <ChatPanel activeUser={activeChatUser} setActiveUser={setActiveChatUser} isAdmin={!!me.isAdmin} />
                  </div>
                ) : tab === "friends" ? (
                  <FriendsPanel
                    onOpenChat={(u) => {
                      setActiveChatUser(u)
                      setTab("chat")
                    }}
                  />
                ) : (
                  <NotificationsPanel />
                )}
              </div>

              {/* bottom tab bar (hidden while inside a chat thread for full-screen chat) */}
              {!(tab === "chat" && activeChatUser) ? (
                <div className="flex border-t border-slate-800 bg-slate-950">
                  <button onClick={() => setTab("feed")} className={tabBtn("feed", tab === "feed")}>
                    <Images className="h-4 w-4" /> Amafoto
                  </button>
                  <button onClick={() => setTab("chat")} className={tabBtn("chat", tab === "chat")}>
                    <MessageCircle className="h-4 w-4" /> Chat
                  </button>
                  <button onClick={() => setTab("friends")} className={tabBtn("friends", tab === "friends")}>
                    <Users className="h-4 w-4" /> Abagenzi
                  </button>
                  <button onClick={() => setTab("notifications")} className={`${tabBtn("notifications", tab === "notifications")} relative`}>
                    <Bell className="h-4 w-4" /> Integuza
                    {unread > 0 ? <span className="absolute right-4 top-2 h-2 w-2 rounded-full bg-red-500" /> : null}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </>
  )
}
