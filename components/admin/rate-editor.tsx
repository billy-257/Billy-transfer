"use client"

import { useActionState } from "react"
import { CheckCircle2, Save, Smartphone, Building2, Lock } from "lucide-react"
import { saveRates, type SaveState } from "@/app/admin/actions"

type Props = {
  usdMobileRate: number
  usdBankRate: number
  marginPercent: number
}

export function RateEditor({ usdMobileRate, usdBankRate, marginPercent }: Props) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveRates, {})

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-white">
            <Smartphone className="h-4 w-4 text-emerald-400" />
            Igiciro Lumicash/Enoti (BIF kuri 1 USD)
          </label>
          <input
            name="usdMobileRate"
            type="number"
            step="1"
            defaultValue={usdMobileRate}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg font-bold text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-white">
            <Building2 className="h-4 w-4 text-sky-400" />
            Igiciro Banki (BIF kuri 1 USD)
          </label>
          <input
            name="usdBankRate"
            type="number"
            step="1"
            defaultValue={usdBankRate}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg font-bold text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <label className="mb-1.5 block text-sm font-bold text-white">Margin (%)</label>
        <p className="mb-2 text-xs text-slate-400">Igabanya rishirwa mu giciro (hidden margin).</p>
        <input
          name="marginPercent"
          type="number"
          step="0.1"
          defaultValue={marginPercent}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg font-bold text-white focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.success ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Ibiciro vyabitswe neza!
        </p>
      ) : null}

      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <label htmlFor="rates-password" className="mb-1.5 flex items-center gap-2 text-sm font-bold text-white">
          <Lock className="h-4 w-4 text-emerald-400" />
          Emeza n&apos;ijambo ry&apos;ibanga
        </label>
        <input
          id="rates-password"
          name="password"
          type="password"
          required
          autoComplete="off"
          placeholder="Ijambo ry'ibanga"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-bold text-white focus:border-emerald-500 focus:outline-none"
        />
      </section>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {pending ? "Turimo kubika..." : "Bika (Save)"}
      </button>
    </form>
  )
}
