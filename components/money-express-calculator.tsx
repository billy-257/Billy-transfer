"use client"

import { useMemo, useState } from "react"
import { Calculator, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useLiveRate } from "@/lib/use-live-rate"
import { feeForAed, type FeeTier } from "@/lib/content-types"

const AED_PER_USD = 3.6725

type PayoutMethod = "mobile" | "bank"

type Props = {
  usdMobileRate: number
  usdBankRate: number
  fees: FeeTier[]
}

function money(n: number, digits = 0) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function MoneyExpressCalculator({ usdMobileRate, usdBankRate, fees }: Props) {
  const [method, setMethod] = useState<PayoutMethod>("mobile")

  const anchorUsdRate = method === "mobile" ? usdMobileRate : usdBankRate
  const { rate: liveUsdRate, direction } = useLiveRate(anchorUsdRate)

  const bifPerUsd = liveUsdRate
  const bifPerAed = bifPerUsd / AED_PER_USD

  // Panel 1: BIF in -> AED out
  const [bifIn, setBifIn] = useState("1000000")
  // Panel 2: AED in -> BIF out
  const [aedIn, setAedIn] = useState("100")

  const bifInNum = Number(bifIn) > 0 ? Number(bifIn) : 0
  const aedFromBif = bifInNum / bifPerAed

  const aedInNum = Number(aedIn) > 0 ? Number(aedIn) : 0
  const bifFromAed = aedInNum * bifPerAed

  const feeForBifPanel = useMemo(() => feeForAed(aedFromBif, fees), [aedFromBif, fees])
  const feeForAedPanel = useMemo(() => feeForAed(aedInNum, fees), [aedInNum, fees])

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
      {/* Big live USD -> BIF rate */}
      <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-950 p-5 text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/80">P2P Live &middot; Idorari 1 (USD)</p>
        </div>
        <p className="mt-1 flex items-center justify-center gap-2 text-4xl font-black leading-none text-emerald-400 tabular-nums md:text-5xl">
          {money(bifPerUsd)}
          <span className="text-2xl md:text-3xl">BIF</span>
          {direction === "up" ? (
            <TrendingUp className="h-6 w-6 text-emerald-400" />
          ) : direction === "down" ? (
            <TrendingDown className="h-6 w-6 text-red-400" />
          ) : (
            <Minus className="h-6 w-6 text-slate-500" />
          )}
        </p>
        <p className="mt-2 text-xs font-medium text-slate-400">Idorari 1 = {AED_PER_USD} AED</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <Calculator className="h-5 w-5 text-emerald-400" />
          <span>Iharura Ry&apos;Amafaranga</span>
        </h3>
        <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 tabular-nums">
          1 AED = {money(bifPerAed, 2)} BIF
        </span>
      </div>

      {/* Method toggle */}
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
        <button
          onClick={() => setMethod("mobile")}
          className={`flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold transition ${
            method === "mobile" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Lumicash / Enoti
        </button>
        <button
          onClick={() => setMethod("bank")}
          className={`flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold transition ${
            method === "bank" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Izindi Banki
        </button>
      </div>

      {/* Two parallel panels */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Panel 1: BIF -> AED */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <label htmlFor="bif-in" className="mb-1.5 block text-xs font-semibold text-slate-400">
            Andika amafaranga muri BIF
          </label>
          <div className="relative">
            <input
              id="bif-in"
              type="number"
              inputMode="decimal"
              min={0}
              value={bifIn}
              onChange={(e) => setBifIn(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-lg font-bold text-white focus:border-emerald-500 focus:outline-none"
              placeholder="0"
            />
            <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-500">BIF</span>
          </div>
          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs font-medium text-emerald-300/80">Angana na AED</p>
            <p className="text-2xl font-black text-emerald-400 tabular-nums">{money(aedFromBif, 2)} AED</p>
          </div>
          <dl className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <dt>Amafaranga</dt>
              <dd className="tabular-nums text-slate-300">{money(aedFromBif, 2)} AED</dd>
            </div>
            <div className="flex justify-between text-slate-400">
              <dt>Amahera y&apos;serivisi (Fee)</dt>
              <dd className="tabular-nums text-slate-300">{money(feeForBifPanel, 2)} AED</dd>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1 font-bold text-white">
              <dt>Amafaranga yose urihira</dt>
              <dd className="tabular-nums">{money(aedFromBif + feeForBifPanel, 2)} AED</dd>
            </div>
          </dl>
        </div>

        {/* Panel 2: AED -> BIF */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <label htmlFor="aed-in" className="mb-1.5 block text-xs font-semibold text-slate-400">
            Andika amafaranga muri AED
          </label>
          <div className="relative">
            <input
              id="aed-in"
              type="number"
              inputMode="decimal"
              min={0}
              value={aedIn}
              onChange={(e) => setAedIn(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-lg font-bold text-white focus:border-emerald-500 focus:outline-none"
              placeholder="0"
            />
            <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-500">AED</span>
          </div>
          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs font-medium text-emerald-300/80">Angana na BIF</p>
            <p className="text-2xl font-black text-emerald-400 tabular-nums">{money(bifFromAed)} BIF</p>
          </div>
          <dl className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <dt>Amafaranga</dt>
              <dd className="tabular-nums text-slate-300">{money(aedInNum, 2)} AED</dd>
            </div>
            <div className="flex justify-between text-slate-400">
              <dt>Amahera y&apos;serivisi (Fee)</dt>
              <dd className="tabular-nums text-slate-300">{money(feeForAedPanel, 2)} AED</dd>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1 font-bold text-white">
              <dt>Amafaranga yose urihira</dt>
              <dd className="tabular-nums">{money(aedInNum + feeForAedPanel, 2)} AED</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
