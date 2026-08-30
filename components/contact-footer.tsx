import { PhoneCall, MessageSquare, Users } from "lucide-react"

type Props = {
  title: string
  note: string
  phone: string
  callLabel: string
  whatsappNumber: string
  whatsappLabel: string
  whatsappGroupUrl: string
  groupLabel: string
}

export function ContactFooter({
  title,
  note,
  phone,
  callLabel,
  whatsappNumber,
  whatsappLabel,
  whatsappGroupUrl,
  groupLabel,
}: Props) {
  const raw = whatsappNumber.replace(/[^\d]/g, "")
  return (
    <footer className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <div className="mb-4 text-center">
        <h3 className="text-base font-bold text-white text-balance">{title}</h3>
        <p className="mt-1 text-xs text-slate-400">{note}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <a
          href={`tel:${phone}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-bold text-white transition hover:border-emerald-500"
        >
          <PhoneCall className="h-4 w-4 text-emerald-400" />
          <span>{callLabel}</span>
        </a>
        <a
          href={`https://wa.me/${raw}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{whatsappLabel}</span>
        </a>
        <a
          href={whatsappGroupUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-bold text-white transition hover:border-emerald-500"
        >
          <Users className="h-4 w-4 text-emerald-400" />
          <span>{groupLabel}</span>
        </a>
      </div>
    </footer>
  )
}
