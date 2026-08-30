import { MessageSquare } from "lucide-react"

function displayNumber(raw: string) {
  const d = raw.replace(/[^\d]/g, "")
  if (d.startsWith("971")) return `+971 ${d.slice(3).replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3")}`
  return `+${d}`
}

type Props = { whatsappNumber: string }

export function WhatsappCta({ whatsappNumber }: Props) {
  const raw = whatsappNumber.replace(/[^\d]/g, "")
  return (
    <section className="space-y-4 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-slate-900 to-slate-950 p-8 text-center shadow-2xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
        <MessageSquare className="h-4 w-4" />
        <span>Yandikire kuri WhatsApp</span>
      </div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Numero ya WhatsApp Y&apos;Uwurungika</h4>
      <div className="py-2">
        <a
          href={`https://wa.me/${raw}`}
          target="_blank"
          rel="noreferrer"
          className="text-3xl font-black tracking-wider text-emerald-400 drop-shadow-md hover:underline md:text-5xl"
        >
          {displayNumber(whatsappNumber)}
        </a>
      </div>
      <div className="flex justify-center pt-2">
        <a
          href={`https://wa.me/${raw}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl transition hover:bg-emerald-500"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Fungura WhatsApp</span>
        </a>
      </div>
    </section>
  )
}
