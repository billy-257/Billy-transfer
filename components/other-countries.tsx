"use client"

import { useState } from "react"
import { Globe, ChevronDown } from "lucide-react"
import type { Country } from "@/lib/content-types"

type Props = {
  label: string
  countries: Country[]
}

export function OtherCountries({ label, countries }: Props) {
  const [openCode, setOpenCode] = useState<string | null>(null)

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
      <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
        <Globe className="h-5 w-5 text-emerald-400" />
        <span>{label}</span>
      </h4>
      <div className="space-y-2">
        {countries.map((c) => {
          const open = openCode === c.code
          return (
            <div key={c.code} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <button
                onClick={() => setOpenCode(open ? null : c.code)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {c.flag}
                  </span>
                  <span className="text-sm font-bold text-white">{c.name}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400 tabular-nums">
                    10 AED = {c.ratePer10Aed.toLocaleString()} {c.code}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </span>
              </button>
              {open ? (
                <div className="border-t border-slate-800 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold text-slate-400">Uburyo bwo kurungika:</p>
                  <div className="flex flex-wrap gap-2">
                    {c.methods.map((m) => (
                      <span
                        key={m}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
