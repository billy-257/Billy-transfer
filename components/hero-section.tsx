import { Clock } from "lucide-react"

type Props = {
  badge: string
  title: string
  subtitle: string
}

export function HeroSection({ badge, title, subtitle }: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
        <Clock className="h-4 w-4 animate-pulse" />
        <span className="text-balance">{badge}</span>
      </div>
      <h2 className="text-balance text-xl font-extrabold leading-tight text-white md:text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-pretty text-sm text-slate-400">{subtitle}</p>
    </section>
  )
}
