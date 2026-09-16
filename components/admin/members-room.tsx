"use client"

import useSWR from "swr"
import { useState } from "react"
import { Phone, MessageCircle, MapPin, Trash2, Users, Search } from "lucide-react"

type Member = {
  id: number
  name: string
  phone: string
  town: string
  photo: string | null
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

// Normalizes a phone number to digits (with country code) for tel/wa links.
function waNumber(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "")
  return digits.startsWith("00") ? digits.slice(2) : digits
}

export function MembersRoom() {
  const { data, isLoading, mutate } = useSWR<{ ok: boolean; members: Member[] }>("/api/members", fetcher, {
    refreshInterval: 15_000,
  })
  const [q, setQ] = useState("")

  const members = data?.members ?? []
  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(q.toLowerCase()) ||
      m.town.toLowerCase().includes(q.toLowerCase()) ||
      m.phone.includes(q),
  )

  async function remove(id: number) {
    if (!confirm("Ukuraho uyu munywanyi?")) return
    await fetch(`/api/members?id=${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <Users className="h-5 w-5 text-emerald-400" />
          Abanywanyi banditse
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
            {members.length}
          </span>
        </h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rondera izina, komine, nimero..."
            className="w-56 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500">Turimo kuzana...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
          <Users className="h-8 w-8" />
          <p className="text-sm">Nta munywanyi yanditse kuri ubu.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3"
            >
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo || "/placeholder.svg"} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-black text-slate-400">
                    {initials(m.name)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{m.name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                  <MapPin className="h-3 w-3" /> {m.town}
                </p>
                <p className="truncate text-xs font-medium text-slate-300 tabular-nums">{m.phone}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                <a
                  href={`tel:${m.phone}`}
                  aria-label={`Hamagara ${m.name}`}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-emerald-400 transition hover:bg-emerald-500/20"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <a
                  href={`https://wa.me/${waNumber(m.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp ${m.name}`}
                  className="rounded-lg border border-green-500/40 bg-green-500/10 p-2 text-green-400 transition hover:bg-green-500/20"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                <button
                  onClick={() => remove(m.id)}
                  aria-label={`Kuraho ${m.name}`}
                  className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-400 transition hover:border-red-500/50 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
