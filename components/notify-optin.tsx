"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, BellRing, X } from "lucide-react"
import { enablePush, pushSupported } from "@/lib/push-client"

const CID_KEY = "billy_client_id"
const DISMISS_KEY = "billy_notify_dismissed"

function getClientId() {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem(CID_KEY)
  if (!id) {
    id = "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(CID_KEY, id)
  }
  return id
}

export function NotifyOptin() {
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<"idle" | "on" | "error">("idle")
  const [msg, setMsg] = useState("")
  const clientId = useRef("")

  useEffect(() => {
    clientId.current = getClientId()
    if (!pushSupported()) return
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1"
    const granted = typeof Notification !== "undefined" && Notification.permission === "granted"
    // Show the opt-in unless already granted or previously dismissed.
    if (!granted && !dismissed) setShow(true)
    if (granted) setStatus("on")
  }, [])

  async function turnOn() {
    setMsg("")
    const res = await enablePush("client", clientId.current)
    if (res.ok) {
      setStatus("on")
      setMsg("Wemeye! Uzoronka integuza ku biciro bishasha n'amatangazo.")
    } else {
      setStatus("error")
      setMsg(res.error || "Ntibishoboye.")
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1")
    setShow(false)
  }

  if (!show || status === "on") return null

  return (
    <section className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-950 p-4">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
        <BellRing className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">Emera integuza kuri telefone</p>
        <p className="text-xs text-slate-400">
          {msg || "Uzomenyeshwa ako kanya igihe ibiciro bihindutse canke hari itangazo rishasha."}
        </p>
      </div>
      <button
        onClick={turnOn}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
      >
        <Bell className="h-3.5 w-3.5" /> Emera
      </button>
      <button
        onClick={dismiss}
        aria-label="Hagarika"
        className="flex-shrink-0 rounded-full p-1.5 text-slate-500 transition hover:text-slate-300"
      >
        <X className="h-4 w-4" />
      </button>
    </section>
  )
}
