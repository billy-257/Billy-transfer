"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Home, MessageCircle, Users, Bell, Settings, X, ShieldCheck } from "lucide-react"
import { socialFetcher, type SocialUser } from "@/components/social/types"
import { AuthForms } from "@/components/social/auth-forms"
import { FeedPanel } from "@/components/social/feed-panel"
import { FriendsPanel } from "@/components/social/friends-panel"
import { ChatPanel } from "@/components/social/chat-panel"
import { NotificationsPanel } from "@/components/social/notifications-panel"
import { SettingsPanel } from "@/components/social/settings-panel"

type Tab = "feed" | "chat" | "friends" | "notifications" | "settings"

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white shadow">
      {count > 9 ? "9+" : count}
    </span>
  )
}

export function SocialHub() {
  const { data: meData, mutate: mutateMe } = useSWR("/api/auth/me", socialFetcher)
  const me: SocialUser | null = meData?.user ?? null

  const { data: notifData } = useSWR(me ? "/api/notifications" : null, socialFetcher, { refreshInterval: 20000 })
  const unreadNotifs: number = notifData?.unread ?? 0

  const { data: dmData } = useSWR(me ? "/api/dm/unread" : null, socialFetcher, { refreshInterval: 15000 })
  const unreadMessages: number = dmData?.unread ?? 0

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("feed")
  const [activeChatUser, setActiveChatUser] = useState<SocialUser | null>(null)

  // Keep the logged-in user's "last seen" fresh while the app is open.
  useEffect(() => {
    if (!me) return
    const ping = () => {
      fetch("/api/presence/social", { method: "POST" }).catch(() => {})
    }
    ping()
    const id = window.setInterval(ping, 30000)
    return () => window.clearInterval(id)
  }, [me])

  function openTo(t: Tab) {
    setTab(t)
    setOpen(true)
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    mutateMe({ user: null }, { revalidate: false })
    setOpen(false)
  }

  // Big, Facebook-style top navigation icons.
  const navBtn =
    "relative flex h-11 w-11 items-center justify-center rounded-2xl text-slate-300 transition hover:bg-slate-800 hover:text-white"

  const tabBtn = (active: boolean) =>
    `relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold transition ${active ? "text-emerald-400" : "text-slate-400"}`

  return (
    <>
      {/* ===== Facebook-style top navigation ===== */}
      <nav className="flex items-center gap-0.5 rounded-2xl border border-slate-800 bg-slate-900/80 px-1.5 py-1 shadow-lg backdrop-blur">
        <button onClick={() => openTo("feed")} className={navBtn} aria-label="Amafoto (Home)">
          <Home className="h-6 w-6" />
        </button>
        <button onClick={() => openTo("friends")} className={navBtn} aria-label="Abagenzi">
          <Users className="h-6 w-6" />
        </button>
        <button onClick={() => openTo("chat")} className={navBtn} aria-label="Ubutumwa (Messenger)">
          <MessageCircle className="h-6 w-6" />
          {me ? <Badge count={unreadMessages} /> : null}
        </button>
        <button onClick={() => openTo("notifications")} className={navBtn} aria-label="Integuza">
          <Bell className="h-6 w-6" />
          {me ? <Badge count={unreadNotifs} /> : null}
        </button>
        <button onClick={() => openTo("settings")} className={navBtn} aria-label="Igenamiterere (Settings)">
          <Settings className="h-6 w-6" />
        </button>
      </nav>

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
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-300 hover:bg-slate-800" aria-label="Funga">
              <X className="h-5 w-5" />
            </button>
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
                ) : tab === "notifications" ? (
                  <NotificationsPanel />
                ) : (
                  <SettingsPanel me={me} onSaved={() => mutateMe()} onLogout={logout} />
                )}
              </div>

              {/* bottom tab bar (hidden while inside a chat thread for full-screen chat) */}
              {!(tab === "chat" && activeChatUser) ? (
                <div className="flex border-t border-slate-800 bg-slate-950">
                  <button onClick={() => setTab("feed")} className={tabBtn(tab === "feed")}>
                    <Home className="h-5 w-5" /> Amafoto
                  </button>
                  <button onClick={() => setTab("friends")} className={tabBtn(tab === "friends")}>
                    <Users className="h-5 w-5" /> Abagenzi
                  </button>
                  <button onClick={() => setTab("chat")} className={tabBtn(tab === "chat")}>
                    <MessageCircle className="h-5 w-5" /> Chat
                    <Badge count={unreadMessages} />
                  </button>
                  <button onClick={() => setTab("notifications")} className={tabBtn(tab === "notifications")}>
                    <Bell className="h-5 w-5" /> Integuza
                    <Badge count={unreadNotifs} />
                  </button>
                  <button onClick={() => setTab("settings")} className={tabBtn(tab === "settings")}>
                    <Settings className="h-5 w-5" /> Genamiterere
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
