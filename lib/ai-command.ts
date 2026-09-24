import type { SiteContent, Country, FeeTier } from "@/lib/content-types"
import type { RateData } from "@/lib/rates"

/**
 * A free, offline natural-language command engine for the admin assistant.
 * It maps plain Kirundi/English commands to structured actions that mutate the
 * site content + rate settings. No external AI API is used, so it is fast and
 * permanently free.
 */

export type TextField =
  | "brandName"
  | "tagline"
  | "agentName"
  | "phone"
  | "callLabel"
  | "whatsappNumber"
  | "whatsappLabel"
  | "whatsappGroupUrl"
  | "groupLabel"
  | "heroBadge"
  | "heroTitle"
  | "heroSubtitle"
  | "otherCountriesLabel"
  | "footerTitle"
  | "footerNote"

export type ListField = "burundiBanks" | "burundiMobile" | "marquee"

export type Action =
  | { kind: "setRate"; field: "usdMobileRate" | "usdBankRate"; value: number }
  | { kind: "setCountryRate"; code: string; value: number }
  | { kind: "setText"; field: TextField; value: string }
  | { kind: "listAdd"; field: ListField; value: string }
  | { kind: "listRemove"; field: ListField; value: string }
  | { kind: "addCountry"; country: Country }
  | { kind: "removeCountry"; code: string }
  | { kind: "addFee"; tier: FeeTier }
  | { kind: "removeFee"; maxAed: number }

export type Interpretation = { type: "action"; action: Action } | { type: "reply"; reply: string }

export type ApplyResult = {
  rates?: RateData
  content?: SiteContent
  summary: string
  revert: Action | null
}

// Labels for text fields, used in summaries / help.
const TEXT_FIELDS: { field: TextField; syns: string[]; label: string }[] = [
  { field: "whatsappNumber", syns: ["whatsapp number", "numero ya whatsapp", "whatsapp nimero"], label: "numero ya WhatsApp" },
  { field: "whatsappGroupUrl", syns: ["group link", "whatsapp group", "link ya group", "group url"], label: "link ya group" },
  { field: "whatsappLabel", syns: ["whatsapp label"], label: "WhatsApp label" },
  { field: "groupLabel", syns: ["group label"], label: "group label" },
  { field: "heroSubtitle", syns: ["hero subtitle", "subtitle"], label: "hero subtitle" },
  { field: "heroTitle", syns: ["hero title", "title", "umutwe"], label: "hero title" },
  { field: "heroBadge", syns: ["hero badge", "badge"], label: "hero badge" },
  { field: "callLabel", syns: ["call label"], label: "call label" },
  { field: "footerTitle", syns: ["footer title"], label: "footer title" },
  { field: "footerNote", syns: ["footer note", "footer"], label: "footer note" },
  { field: "otherCountriesLabel", syns: ["other countries label"], label: "other countries label" },
  { field: "agentName", syns: ["agent name", "agent", "izina ry'umukozi", "umukozi"], label: "izina ry'umukozi" },
  { field: "brandName", syns: ["brand name", "brand", "izina ry'ikigo", "izina rya kompanyi"], label: "izina ry'ikigo" },
  { field: "tagline", syns: ["tagline", "slogan"], label: "tagline" },
  { field: "phone", syns: ["phone number", "phone", "numero", "nimero", "telefone", "telephone"], label: "numero ya telefone" },
]

const ADD_VERB = /\b(add|ongera|ongeramwo|kongera|kongeramwo|shiramwo|shiraho|injiza)\b/
const REMOVE_VERB = /\b(remove|delete|kuraho|kura|siba|gukura|hanagura)\b/
const CONNECTIVE = /^[\s:=,-]*(?:to |kuri |ni |be |=)?\s*/i

function firstNumber(str: string): number | null {
  const m = str.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

function allNumbers(str: string): number[] {
  const m = str.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/g)
  return m ? m.map(Number) : []
}

// Text that follows the first occurrence of `marker` (case-insensitive),
// with any leading connective ("to", "kuri", ":", "=") stripped.
function valueAfter(command: string, lower: string, marker: string): string {
  const idx = lower.indexOf(marker)
  if (idx === -1) return ""
  return command.slice(idx + marker.length).replace(CONNECTIVE, "").trim()
}

function detectTextField(lower: string): { field: TextField; syn: string } | null {
  let best: { field: TextField; syn: string } | null = null
  for (const t of TEXT_FIELDS) {
    for (const syn of t.syns) {
      if (lower.includes(syn) && (!best || syn.length > best.syn.length)) {
        best = { field: t.field, syn }
      }
    }
  }
  return best
}

function findCountry(content: SiteContent, lower: string): Country | null {
  return (
    content.countries.find(
      (c) => lower.includes(c.name.toLowerCase()) || lower.includes(c.code.toLowerCase()),
    ) ?? null
  )
}

export function interpret(command: string, ctx: { rates: RateData; content: SiteContent }): Interpretation {
  const original = command.trim()
  const lower = original.toLowerCase()
  const { content } = ctx

  if (!lower) return { type: "reply", reply: helpText(ctx) }

  // ---- Help ----
  if (/\b(help|ufasha|nfasha|ushobora iki|ndashobora|menu)\b/.test(lower) || lower === "?") {
    return { type: "reply", reply: helpText(ctx) }
  }

  const hasAdd = ADD_VERB.test(lower)
  const hasRemove = REMOVE_VERB.test(lower)

  // ---- Add / Remove on lists, countries, fees ----
  if (hasAdd || hasRemove) {
    // Country
    if (/country|igihugu|gihugu/.test(lower)) {
      const kw = /country/.test(lower) ? "country" : /igihugu/.test(lower) ? "igihugu" : "gihugu"
      if (hasRemove) {
        const c = findCountry(content, lower)
        if (!c) return { type: "reply", reply: "Sinaronse ico gihugu. Andika izina canke code (nk'UGX)." }
        return { type: "action", action: { kind: "removeCountry", code: c.code } }
      }
      return parseAddCountry(original, lower, kw)
    }
    // Fee tier
    if (/\bfee|frais|commission\b/.test(lower)) {
      const nums = allNumbers(lower)
      if (hasRemove) {
        if (!nums.length) return { type: "reply", reply: "Mbwira urugero rwa frais ushaka gukuraho, nk'900." }
        return { type: "action", action: { kind: "removeFee", maxAed: nums[0] } }
      }
      if (nums.length < 2)
        return { type: "reply", reply: "Frais isaba ibiharuro 2: urugero n'igiciro. Nk'\"add fee 1500 = 6\"." }
      return { type: "action", action: { kind: "addFee", tier: { maxAed: nums[0], fee: nums[1] } } }
    }
    // Marquee / announcement
    if (/announcement|marquee|itangazo|amatangazo|umurongo|amakuru/.test(lower)) {
      const kw = ["announcement", "marquee", "itangazo", "amatangazo", "umurongo", "amakuru"].find((k) => lower.includes(k))!
      if (hasRemove) {
        const val = valueAfter(original, lower, kw)
        return { type: "action", action: { kind: "listRemove", field: "marquee", value: val } }
      }
      const val = valueAfter(original, lower, kw)
      if (!val) return { type: "reply", reply: "Andika itangazo ushaka kongeramwo." }
      return { type: "action", action: { kind: "listAdd", field: "marquee", value: val } }
    }
    // Bank (Burundi banks list)
    if (/\bbank|banki\b/.test(lower)) {
      const kw = lower.includes("banki") ? "banki" : "bank"
      const val = valueAfter(original, lower, kw)
      if (hasRemove) return { type: "action", action: { kind: "listRemove", field: "burundiBanks", value: val } }
      if (!val) return { type: "reply", reply: "Andika izina rya banki ushaka kongeramwo." }
      return { type: "action", action: { kind: "listAdd", field: "burundiBanks", value: val } }
    }
    // Mobile money operator
    if (/mobile|momo/.test(lower)) {
      const kw = lower.includes("mobile") ? "mobile" : "momo"
      const val = valueAfter(original, lower, kw)
      if (hasRemove) return { type: "action", action: { kind: "listRemove", field: "burundiMobile", value: val } }
      if (!val) return { type: "reply", reply: "Andika izina rya mobile money ushaka kongeramwo." }
      return { type: "action", action: { kind: "listAdd", field: "burundiMobile", value: val } }
    }
  }

  // ---- Set a text field ----
  const textHit = detectTextField(lower)
  if (textHit) {
    const val = valueAfter(original, lower, textHit.syn)
    if (val) return { type: "action", action: { kind: "setText", field: textHit.field, value: val } }
  }

  // ---- Set a rate (mobile / bank / country) ----
  const num = firstNumber(lower)
  if (num !== null) {
    // Country-specific rate?
    const c = findCountry(content, lower)
    const isBank = /\bbank|banki\b/.test(lower)
    const isRateWord = /rate|igiciro|idorari|dollar|dolari|amafaranga|exchange|kuvunja/.test(lower)
    if (c && !isBank) {
      return { type: "action", action: { kind: "setCountryRate", code: c.code, value: num } }
    }
    if (isBank) return { type: "action", action: { kind: "setRate", field: "usdBankRate", value: num } }
    if (isRateWord) return { type: "action", action: { kind: "setRate", field: "usdMobileRate", value: num } }
  }

  // ---- Queries ----
  if (/rate|igiciro|amafaranga|dollar|idorari/.test(lower)) {
    return {
      type: "reply",
      reply: `Ibiciro ubu: Lumicash/Mobile = ${ctx.rates.usdMobileRate.toLocaleString("en-US")} BIF, Banki = ${ctx.rates.usdBankRate.toLocaleString("en-US")} BIF kuri 1 USD. Kugira uhindure andika nk'"igiciro 6030".`,
    }
  }
  if (/countr|ibihugu|igihugu/.test(lower)) {
    const list = content.countries.map((c) => `${c.flag} ${c.name} (${c.code}) = ${c.ratePer10Aed}/10 AED`).join("\n")
    return { type: "reply", reply: `Ibihugu tumaze kwakira:\n${list}` }
  }
  if (/bank|banki/.test(lower)) {
    return { type: "reply", reply: `Amabanki: ${content.burundiBanks.join(", ")}` }
  }

  return {
    type: "reply",
    reply: `Sinatahuye neza ico ushaka. ${helpText(ctx)}`,
  }
}

function parseAddCountry(original: string, lower: string, kw: string): Interpretation {
  const afterKw = original.slice(lower.indexOf(kw) + kw.length)
  const afterLower = afterKw.toLowerCase()
  // Cut the name at the first structural marker.
  const markerMatch = afterLower.match(/\b(code|rate|igiciro|flag|ibendera|methods|uburyo|via|per)\b/)
  const namePart = (markerMatch ? afterKw.slice(0, markerMatch.index) : afterKw).replace(CONNECTIVE, "").trim()
  const name = namePart.replace(/[,:-]+$/, "").trim()

  const codeMatch = original.match(/code\s+([A-Za-z]{2,5})/i) ?? original.match(/\b([A-Z]{2,5})\b/)
  const code = codeMatch ? codeMatch[1].toUpperCase() : ""

  const rateMatch = afterLower.match(/(?:rate|igiciro|per\s*10[^\d]*)\s*([\d,]+)/)
  const rate = rateMatch ? Number(rateMatch[1].replace(/,/g, "")) : firstNumber(afterLower)

  const flagMatch = original.match(/\p{Extended_Pictographic}/u)
  const flag = flagMatch ? flagMatch[0] : "🌍"

  let methods: string[] = []
  const methMatch = afterLower.match(/\b(methods|uburyo|via)\b/)
  if (methMatch) {
    methods = afterKw
      .slice((methMatch.index ?? 0) + methMatch[0].length)
      .split(/[,]| na | and /i)
      .map((s) => s.replace(CONNECTIVE, "").trim())
      .filter(Boolean)
  }

  if (!name) return { type: "reply", reply: "Mbwira izina ry'igihugu." }
  if (!code || rate === null || rate === undefined || Number.isNaN(rate)) {
    return {
      type: "reply",
      reply: `Kugira nongeremwo "${name}" nkeneye code (nk'ZMW) n'igiciro kuri 10 AED. Urugero: add country ${name} code ZMW rate 400.`,
    }
  }
  return {
    type: "action",
    action: { kind: "addCountry", country: { code, name, flag, ratePer10Aed: rate, methods } },
  }
}

// Applies an action to the current state and returns the new state + a revert.
export function applyAction(action: Action, rates: RateData, content: SiteContent): ApplyResult {
  switch (action.kind) {
    case "setRate": {
      const label = action.field === "usdBankRate" ? "igiciro ca banki" : "igiciro ca Lumicash/Mobile"
      const prev = rates[action.field]
      return {
        rates: { ...rates, [action.field]: action.value },
        summary: `Nahinduye ${label}: ${prev.toLocaleString("en-US")} → ${action.value.toLocaleString("en-US")} BIF.`,
        revert: { kind: "setRate", field: action.field, value: prev },
      }
    }
    case "setCountryRate": {
      const idx = content.countries.findIndex((c) => c.code === action.code)
      if (idx === -1) return { summary: "Sinaronse ico gihugu.", revert: null }
      const prev = content.countries[idx].ratePer10Aed
      const countries = content.countries.map((c, i) => (i === idx ? { ...c, ratePer10Aed: action.value } : c))
      return {
        content: { ...content, countries },
        summary: `Nahinduye igiciro ca ${content.countries[idx].name}: ${prev} → ${action.value} kuri 10 AED.`,
        revert: { kind: "setCountryRate", code: action.code, value: prev },
      }
    }
    case "setText": {
      const prev = String(content[action.field] ?? "")
      return {
        content: { ...content, [action.field]: action.value },
        summary: `Nahinduye "${action.field}": "${action.value}".`,
        revert: { kind: "setText", field: action.field, value: prev },
      }
    }
    case "listAdd": {
      const list = [...(content[action.field] as string[]), action.value]
      return {
        content: { ...content, [action.field]: list },
        summary: `Nongeyemwo "${action.value}".`,
        revert: { kind: "listRemove", field: action.field, value: action.value },
      }
    }
    case "listRemove": {
      const current = content[action.field] as string[]
      const target = action.value.toLowerCase()
      const removed = current.find((x) => x.toLowerCase() === target || x.toLowerCase().includes(target))
      if (!removed) return { summary: `Sinaronse "${action.value}".`, revert: null }
      const list = current.filter((x) => x !== removed)
      return {
        content: { ...content, [action.field]: list },
        summary: `Nakuyeho "${removed}".`,
        revert: { kind: "listAdd", field: action.field, value: removed },
      }
    }
    case "addCountry": {
      const countries = [...content.countries, action.country]
      return {
        content: { ...content, countries },
        summary: `Nongeyemwo igihugu ${action.country.flag} ${action.country.name} (${action.country.code}) kuri ${action.country.ratePer10Aed}/10 AED.`,
        revert: { kind: "removeCountry", code: action.country.code },
      }
    }
    case "removeCountry": {
      const idx = content.countries.findIndex((c) => c.code === action.code)
      if (idx === -1) return { summary: "Sinaronse ico gihugu.", revert: null }
      const removed = content.countries[idx]
      const countries = content.countries.filter((_, i) => i !== idx)
      return {
        content: { ...content, countries },
        summary: `Nakuyeho igihugu ${removed.name} (${removed.code}).`,
        revert: { kind: "addCountry", country: removed },
      }
    }
    case "addFee": {
      const fees = [...content.fees, action.tier].sort((a, b) => a.maxAed - b.maxAed)
      return {
        content: { ...content, fees },
        summary: `Nongeyemwo frais: gushika ${action.tier.maxAed} AED → ${action.tier.fee} AED.`,
        revert: { kind: "removeFee", maxAed: action.tier.maxAed },
      }
    }
    case "removeFee": {
      const idx = content.fees.findIndex((f) => f.maxAed === action.maxAed)
      if (idx === -1) return { summary: `Sinaronse frais ya ${action.maxAed}.`, revert: null }
      const removed = content.fees[idx]
      const fees = content.fees.filter((_, i) => i !== idx)
      return {
        content: { ...content, fees },
        summary: `Nakuyeho frais ya ${removed.maxAed} AED.`,
        revert: { kind: "addFee", tier: removed },
      }
    }
  }
}

function helpText(ctx: { rates: RateData; content: SiteContent }): string {
  return [
    "Ndashobora guhindura app ubu nyene (ku buntu, ntawurihira). Andika nk'ibi:",
    "• igiciro 6030  →  guhindura igiciro ca Lumicash/Mobile",
    "• igiciro ca banki 5900  →  guhindura igiciro ca banki",
    "• add country Zambia code ZMW rate 400  →  kongeramwo igihugu",
    "• Uganda rate 10500  →  guhindura igiciro c'igihugu",
    "• add bank BancABC   /   remove bank KCB",
    "• add mobile Ecocash",
    "• add fee 1500 = 6   /   remove fee 900",
    "• add announcement Turakora 24/7",
    "• change tagline to Twohereza amafaranga vuba",
    "• change phone to 0552256963",
    `Ubu igiciro ni ${ctx.rates.usdMobileRate.toLocaleString("en-US")} BIF (Mobile).`,
  ].join("\n")
}
