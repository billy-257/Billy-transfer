import { Smartphone, Building2, CheckCircle2 } from "lucide-react"

type Props = {
  mobile: string[]
  banks: string[]
}

export function PaymentMethods({ mobile, banks }: Props) {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-white">
          <Smartphone className="h-5 w-5 text-emerald-400" />
          <span>Lumicash / Bancobu Enoti</span>
        </h4>
        <div className="space-y-2">
          {mobile.map((m) => (
            <div
              key={m}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3"
            >
              <span className="text-sm font-bold text-slate-200">{m}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-white">
          <Building2 className="h-5 w-5 text-sky-400" />
          <span>Izindi Banki zo mu Burundi</span>
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {banks.map((b) => (
            <div key={b} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-slate-300">
              {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
