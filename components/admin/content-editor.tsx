"use client"

import { useActionState, useState } from "react"
import { CheckCircle2, Plus, Save, Trash2, Lock } from "lucide-react"
import { saveContent, type SaveState } from "@/app/admin/actions"
import type { SiteContent, FeeTier, Country } from "@/lib/content-types"

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <h4 className="mb-3 text-sm font-bold text-white">{title}</h4>
      {children}
    </section>
  )
}

function Text({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={inputCls} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
    </label>
  )
}

export function ContentEditor({ content }: { content: SiteContent }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveContent, {})
  const [c, setC] = useState<SiteContent>(content)

  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => setC((prev) => ({ ...prev, [key]: value }))

  // List helpers
  const updateStrList = (key: "marquee" | "burundiMobile" | "burundiBanks", i: number, v: string) =>
    set(key, c[key].map((x, idx) => (idx === i ? v : x)) as string[])
  const addStr = (key: "marquee" | "burundiMobile" | "burundiBanks") => set(key, [...c[key], ""] as string[])
  const delStr = (key: "marquee" | "burundiMobile" | "burundiBanks", i: number) =>
    set(key, c[key].filter((_, idx) => idx !== i) as string[])

  const updateFee = (i: number, field: keyof FeeTier, v: number) =>
    set("fees", c.fees.map((f, idx) => (idx === i ? { ...f, [field]: v } : f)))
  const addFee = () => set("fees", [...c.fees, { maxAed: 0, fee: 0 }])
  const delFee = (i: number) => set("fees", c.fees.filter((_, idx) => idx !== i))

  const updateCountry = (i: number, field: keyof Country, v: string | number | string[]) =>
    set("countries", c.countries.map((co, idx) => (idx === i ? { ...co, [field]: v } : co)))
  const addCountry = () =>
    set("countries", [...c.countries, { code: "", name: "", flag: "", ratePer10Aed: 0, methods: [] }])
  const delCountry = (i: number) => set("countries", c.countries.filter((_, idx) => idx !== i))

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="payload" value={JSON.stringify(c)} />

      <Section title="Amazina n'aderesse">
        <div className="grid gap-3 sm:grid-cols-2">
          <Text label="Izina rya sosiyete" value={c.brandName} onChange={(v) => set("brandName", v)} />
          <Text label="Insobanuro ngufi" value={c.tagline} onChange={(v) => set("tagline", v)} />
          <Text label="Izina ry'uwurungika" value={c.agentName} onChange={(v) => set("agentName", v)} />
          <Text label="Numero (Botim/DuPay)" value={c.phone} onChange={(v) => set("phone", v)} />
          <Text label="Icandiko ca telefone" value={c.callLabel} onChange={(v) => set("callLabel", v)} />
          <Text label="WhatsApp (971...)" value={c.whatsappNumber} onChange={(v) => set("whatsappNumber", v)} />
          <Text label="Icandiko ca WhatsApp" value={c.whatsappLabel} onChange={(v) => set("whatsappLabel", v)} />
          <Text label="Link ya group" value={c.whatsappGroupUrl} onChange={(v) => set("whatsappGroupUrl", v)} />
          <Text label="Icandiko ca group" value={c.groupLabel} onChange={(v) => set("groupLabel", v)} />
        </div>
      </Section>

      <Section title="Amagambo yo hejuru (Marquee)">
        <div className="space-y-2">
          {c.marquee.map((m, i) => (
            <div key={i} className="flex gap-2">
              <textarea value={m} onChange={(e) => updateStrList("marquee", i, e.target.value)} rows={2} className={inputCls} />
              <button type="button" onClick={() => delStr("marquee", i)} className="text-red-400 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addStr("marquee")} className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <Plus className="h-4 w-4" /> Ongeraho
          </button>
        </div>
      </Section>

      <Section title="Hero (Amagambo manini)">
        <div className="space-y-3">
          <Text label="Badge" value={c.heroBadge} onChange={(v) => set("heroBadge", v)} />
          <Text label="Umutwe" value={c.heroTitle} onChange={(v) => set("heroTitle", v)} textarea />
          <Text label="Insiguro" value={c.heroSubtitle} onChange={(v) => set("heroSubtitle", v)} />
        </div>
      </Section>

      <Section title="Amahera y'serivisi (Fees)">
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-semibold text-slate-400">
            <span>Kugeza kuri (AED)</span>
            <span>Fee (AED)</span>
            <span />
          </div>
          {c.fees.map((f, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <input type="number" value={f.maxAed} onChange={(e) => updateFee(i, "maxAed", Number(e.target.value))} className={inputCls} />
              <input type="number" value={f.fee} onChange={(e) => updateFee(i, "fee", Number(e.target.value))} className={inputCls} />
              <button type="button" onClick={() => delFee(i)} className="text-red-400 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addFee} className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <Plus className="h-4 w-4" /> Ongeraho fee
          </button>
        </div>
      </Section>

      <Section title="Lumicash / Enoti / Mobile">
        <div className="space-y-2">
          {c.burundiMobile.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input value={m} onChange={(e) => updateStrList("burundiMobile", i, e.target.value)} className={inputCls} />
              <button type="button" onClick={() => delStr("burundiMobile", i)} className="text-red-400 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addStr("burundiMobile")} className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <Plus className="h-4 w-4" /> Ongeraho
          </button>
        </div>
      </Section>

      <Section title="Banki zo mu Burundi">
        <div className="space-y-2">
          {c.burundiBanks.map((b, i) => (
            <div key={i} className="flex gap-2">
              <input value={b} onChange={(e) => updateStrList("burundiBanks", i, e.target.value)} className={inputCls} />
              <button type="button" onClick={() => delStr("burundiBanks", i)} className="text-red-400 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addStr("burundiBanks")} className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <Plus className="h-4 w-4" /> Ongeraho banki
          </button>
        </div>
      </Section>

      <Section title="Ibindi bihugu (Countries)">
        <Text label="Icandiko ca buto" value={c.otherCountriesLabel} onChange={(v) => set("otherCountriesLabel", v)} />
        <div className="mt-3 space-y-4">
          {c.countries.map((co, i) => (
            <div key={i} className="rounded-xl border border-slate-800 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input placeholder="Izina" value={co.name} onChange={(e) => updateCountry(i, "name", e.target.value)} className={inputCls} />
                <input placeholder="Code (UGX...)" value={co.code} onChange={(e) => updateCountry(i, "code", e.target.value)} className={inputCls} />
                <input placeholder="Flag emoji" value={co.flag} onChange={(e) => updateCountry(i, "flag", e.target.value)} className={inputCls} />
                <input type="number" placeholder="10 AED = ?" value={co.ratePer10Aed} onChange={(e) => updateCountry(i, "ratePer10Aed", Number(e.target.value))} className={inputCls} />
              </div>
              <input
                placeholder="Uburyo (bitandukanijwe na virigule: MTN, Airtel)"
                value={co.methods.join(", ")}
                onChange={(e) => updateCountry(i, "methods", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                className={`${inputCls} mt-2`}
              />
              <button type="button" onClick={() => delCountry(i)} className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-400">
                <Trash2 className="h-4 w-4" /> Kuraho iki gihugu
              </button>
            </div>
          ))}
          <button type="button" onClick={addCountry} className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <Plus className="h-4 w-4" /> Ongeraho igihugu
          </button>
        </div>
      </Section>

      <Section title="Footer">
        <div className="space-y-3">
          <Text label="Umutwe" value={c.footerTitle} onChange={(v) => set("footerTitle", v)} />
          <Text label="Insiguro" value={c.footerNote} onChange={(v) => set("footerNote", v)} />
        </div>
      </Section>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.success ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Vyabitswe neza!
        </p>
      ) : null}

      <Section title="Emeza n'ijambo ry'ibanga">
        <p className="mb-3 flex items-center gap-2 text-xs text-slate-400">
          <Lock className="h-4 w-4 text-emerald-400" />
          Andika ijambo ry&apos;ibanga buri gihe ushaka guhindura.
        </p>
        <input name="password" type="password" required autoComplete="off" placeholder="Ijambo ry'ibanga" className={inputCls} />
      </Section>

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
