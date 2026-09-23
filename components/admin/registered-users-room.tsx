"use client"

import useSWR from "swr"
import { useState } from "react"
import { Phone, MessageCircle, MapPin, UserCheck, Search, ShieldCheck } from "lucide-react"

type RegUser = {
  id: number
  displayName: string
  username: string
  phone: string
  location: string | null
  avatarUrl: string | null
  isAdmin: boolean
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function waNumber(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "")
  return digits.startsWith("00") ? digits.slice(2) : digits
}

export function RegisteredUsersRoom() {
  const { data, isLoading } = useSWR<{ ok: boolean; users: RegUser[] }>("/api/admin/users", fetcher, {
    refreshInterval: 15_000,
  })
  const [q, setQ] = useState("")

  const all = data?.users ?? []
  const filtered = all.filter(
    (u) =>
      u.displayName.toLowerCase().includes(q.toLowerCase()) ||
      u.username.toLowerCase().includes(q.toLowerCase()) ||
      (u.location ?? "").toLowerCase().includes(q.toLowerCase()) ||
      u.phone.includes(q),
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <UserCheck className="h-5 w-5 text-emerald-400" />
          Abiyandikishe
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
            {all.length}
          </span>
        </h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rondera izina, username, aho aba, nimero..."
            className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500">Turimo kuzana...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
          <UserCheck className="h-8 w-8" />
          <p className="text-sm">Nta muntu yiyandikishije kuri ubu.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatarUrl || "/placeholder.svg"} alt={u.displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-black text-slate-400">
                    {u.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-sm font-bold text-white">
                  {u.displayName}
                  {u.isAdmin ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> : null}
                </p>
                <p className="truncate text-xs text-slate-500">@{u.username}</p>
                {u.location ? (
                  <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                    <MapPin className="h-3 w-3" /> {u.location}
                  </p>
                ) : null}
                <p className="truncate text-xs font-medium text-slate-300 tabular-nums">{u.phone}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                <a
                  href={`tel:${u.phone}`}
                  aria-label={`Hamagara ${u.displayName}`}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-emerald-400 transition hover:bg-emerald-500/20"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <a
                  href={`https://wa.me/${waNumber(u.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp ${u.displayName}`}
                  className="rounded-lg border border-green-500/40 bg-green-500/10 p-2 text-green-400 transition hover:bg-green-500/20"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
