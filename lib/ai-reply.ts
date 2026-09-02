import "server-only"
import { generateText } from "ai"
import { getRateSettings } from "@/lib/rates"
import { getSiteContent } from "@/lib/content"
import type { ChatMessage } from "@/lib/db/schema"

const USD_TO_AED = 3.67
// Fast, cheap, strong multilingual model via Vercel AI Gateway (zero-config auth).
const MODEL = "google/gemini-2.5-flash"
// Hard cap on how long we wait for the model before falling back.
const MODEL_TIMEOUT_MS = 18_000

// Remembers the last model failure so the admin panel can show why replies fall back.
let lastAiError: { message: string; at: string } | null = null
export function getLastAiError() {
  return lastAiError
}

type Ctx = {
  brand: string
  agent: string
  usdMobile: number
  usdBank: number
  aedMobile: number
  aedBank: number
  fees: { maxAed: number; fee: number }[]
  countries: { name: string; code: string; ratePer10Aed: number; methods: string[] }[]
  whatsapp: string
}

async function loadContext(): Promise<Ctx> {
  const [rates, content] = await Promise.all([getRateSettings(), getSiteContent()])
  return {
    brand: content.brandName,
    agent: content.agentName || "Billy",
    usdMobile: Math.round(rates.usdMobileRate),
    usdBank: Math.round(rates.usdBankRate),
    aedMobile: Math.round(rates.usdMobileRate / USD_TO_AED),
    aedBank: Math.round(rates.usdBankRate / USD_TO_AED),
    fees: content.fees.slice().sort((a, b) => a.maxAed - b.maxAed),
    countries: content.countries,
    whatsapp: content.whatsappNumber ?? "",
  }
}

function feeFor(ctx: Ctx, aed: number) {
  const tier = ctx.fees.find((t) => aed <= t.maxAed) ?? ctx.fees[ctx.fees.length - 1]
  return tier?.fee ?? 0
}

// Builds the customer-care system prompt with the live rate at chat time.
function buildSystemPrompt(ctx: Ctx, clientName?: string | null) {
  const now = new Date().toLocaleString("en-GB", {
    timeZone: "Africa/Bujumbura",
    dateStyle: "medium",
    timeStyle: "short",
  })
  const feeLines = ctx.fees.map((t) => `- gushika kuri ${t.maxAed} AED: frais ${t.fee} AED`).join("\n")
  const countryLines = ctx.countries
    .map((c) => `- ${c.name} (${c.code}): ~${c.ratePer10Aed} ${c.code} kuri 10 AED; uburyo: ${c.methods.join(", ")}`)
    .join("\n")

  return `Uri umukozi wo kwakira abakiriya (customer care) wa "${ctx.brand}" — serivisi yo kurungika no gutora amafaranga hagati ya Dubai (UAE) n'Uburundi n'ibindi bihugu vy'Afrika y'Uburasirazuba. Umuyobozi ni ${ctx.agent}.

ULURIMI: Wishura mu KIRUNDI gusa, mu buryo bworoshe kandi bw'ikaze (nk'uko abarundi bavugana). Iyo umukiriya yandika mu Gifaransa, Icongereza canke Igiswahili, umwishure mu Kirundi ariko ushobora gushiramwo amajambo make y'ururimi rwiwe kugira atahure.

AMAKURU Y'UYU MUSI (${now}, isaha y'i Bujumbura):
- Igiciro kuri mobile money / numéro (Lumicash, Ecocash...): 1 USD = ${ctx.usdMobile} BIF  (1 AED = ${ctx.aedMobile} BIF)
- Igiciro kuri konti ya banki: 1 USD = ${ctx.usdBank} BIF  (1 AED = ${ctx.aedBank} BIF)
- 1 USD = 3.67 AED. Igiciro kigaragara ni co nyako, nta kintu gihishijwe.
- FRAIS ikatwa UKWAYO mu AED (ntiyongerwa ku giciro):
${feeLines}
- Ibindi bihugu turungikamwo:
${countryLines}
- WhatsApp ya ${ctx.agent}: ${ctx.whatsapp || "iri ku rupapuro rw'itangiriro"}
- Amafaranga ashika vuba: kuri mobile money mu minota mikeyi; kuri banki bishobora gutwara akanya gato kurenzaho.

AMATEGEKO YO KWISHURA:
1. Soma ikiganiro cose, wishure NEZA NEZA ico umukiriya abajije canke avuze muri ubwo butumwa bwiwe bwa nyuma. Ntusubire kuvuga ivyo wari wamaze kuvuga.
2. Iyo umukiriya avuze igitigiri (nka "200 AED", "ijana", "300"), kora ibiharuro: BIF = AED x ${ctx.aedMobile} (mobile) canke x ${ctx.aedBank} (banki); vuga na frais ihuye n'ico gitigiri, be n'igiteranyo (AED + frais). Erekana ibiharuro neza.
3. Iyo ari indamutso gusa ("Bite", "Mahoro", "Sawa", "Ok"), wishure mu kugufi cane (imvugo 1-2) hanyuma umubaze ico ashaka gufashwa. NTUHORE utangura na "Muraho [izina]!" mu butumwa bwose — vuga izina rimwe gusa mu ntango y'ikiganiro.
4. Iyo umukiriya yemeje ko ashaka kurungika canke gutora, umusigurire intambwe: kwandikira ${ctx.agent} kuri WhatsApp, kumuha izina + numéro/konti y'uwakira, igitigiri; hanyuma umubwire ko ${ctx.agent} agiye kumwitaba ubwiwe.
5. Iyo ari ikibazo utazi neza (ikibazo ku mafaranga yamaze kurungikwa, ikosa, gutinda), saba imbabazi mu kugufi, umubwire ko ${ctx.agent} agiye kumwitaba ubwiwe kuri WhatsApp, kandi umusabe amakuru akenewe (izina, igitigiri, isaha).
6. Ntukigire ivyo utazi, ntuzemeze igiciro kitari ico hejuru.
7. Inyishu ibe ngufi kandi yumvikana (imvugo 2-6). Koresha imirongo mikeyi, ntukoreshe imitwe minini canke inyuguti ziremereye nyinshi.
8. Rimwe na rimwe gusa (ntibibe mu butumwa bwose) — cane cane iyo umukiriya arangije canke ashimye — umubaze uko yumva serivisi yacu canke ico dushobora kunoza.
9. Ntuzevuge ko uri AI canke model. Wivugane nk'umukozi wa "${ctx.brand}".
${clientName ? `\nIzina ry'umukiriya: ${clientName}.` : ""}`
}

// Keyword-based Kirundi reply with real numbers, used only if the model is unavailable.
export async function fallbackKirundiReply(
  clientName?: string | null,
  lastClientMessage?: string,
  thread: ChatMessage[] = [],
): Promise<string> {
  let ctx: Ctx | null = null
  try {
    ctx = await loadContext()
  } catch {
    /* keep going without numbers */
  }
  const msg = (lastClientMessage ?? "").toLowerCase()
  const isFirst = thread.filter((m) => m.sender === "admin").length === 0
  const hello = isFirst ? `Muraho${clientName ? ` ${clientName}` : ""}! ` : ""
  const ask = " Hari ikindi wokenera?"

  if (!ctx) return `${hello}Twakiriye ubutumwa bwanyu. Turaza kubishura vuba kuri WhatsApp.`

  // Amount mentioned -> compute.
  const num = msg.replace(/[.,](?=\d{3}\b)/g, "").match(/(\d+(?:\.\d+)?)/)
  const amount = num ? Number(num[1]) : null
  const mentionsRate = /igiciro|rate|dorari|dollar|usd|aed|bif|kingahe|angahe|price|prix/.test(msg)
  const mentionsFee = /frais|fee|fees|ikatwa|commission/.test(msg)
  const mentionsTime = /igihe|iminota|vuba|ryari|quand|when|time|bitinda|gutinda/.test(msg)
  const mentionsSend = /kurungika|rungika|kohereza|ohereza|gutora|envoyer|send|transfer/.test(msg)

  if (amount && amount > 0 && amount < 1_000_000 && (mentionsSend || mentionsRate || mentionsFee || /aed/.test(msg))) {
    const bifMobile = Math.round(amount * ctx.aedMobile)
    const bifBank = Math.round(amount * ctx.aedBank)
    const fee = feeFor(ctx, amount)
    return `${hello}Kuri ${amount} AED uyu musi:\n- Mobile money: ${bifMobile.toLocaleString()} BIF (1 AED = ${ctx.aedMobile} BIF)\n- Banki: ${bifBank.toLocaleString()} BIF (1 AED = ${ctx.aedBank} BIF)\nFrais: ${fee} AED (ikatwa ukwayo), igiteranyo utanga: ${amount + fee} AED. Kugira turungike, andikira ${ctx.agent} kuri WhatsApp umuhe izina na numéro y'uwakira.${ask}`
  }
  if (mentionsFee) {
    const lines = ctx.fees.map((t) => `- gushika ${t.maxAed} AED: ${t.fee} AED`).join("\n")
    return `${hello}Frais ikatwa ukwayo mu AED, ukurikije igitigiri:\n${lines}\nIgiciro c'idorari ntigihinduka kubera frais.${ask}`
  }
  if (mentionsRate) {
    return `${hello}Igiciro c'uyu musi: 1 USD = ${ctx.usdMobile} BIF kuri mobile money (1 AED = ${ctx.aedMobile} BIF); kuri banki 1 USD = ${ctx.usdBank} BIF (1 AED = ${ctx.aedBank} BIF). Frais ikatwa ukwayo.${ask}`
  }
  if (mentionsTime) {
    return `${hello}Kuri mobile money amafaranga ashika mu minota mikeyi; kuri banki bishobora gutwara akanya gato kurenzaho.${ask}`
  }
  if (mentionsSend) {
    return `${hello}Ego turarungika. Mbwira igitigiri ushaka kurungika (mu AED) na ho agiye (mobile money canke banki), ndaguha igiciro n'igiteranyo. Hanyuma ${ctx.agent} akwitaba kuri WhatsApp kugira turangize.`
  }
  if (/^(bite|mahoro|amahoro|sawa|ok|oya|ego|yego|muraho|hello|hi|salut|bonjour)\b/.test(msg.trim())) {
    return `${hello}Mahoro! Ndagufasha gute uyu musi — kurungika, gutora, canke kumenya igiciro?`
  }
  return `${hello}Twakiriye ubutumwa bwanyu. Igiciro c'uyu musi: 1 AED = ${ctx.aedMobile} BIF (mobile money). ${ctx.agent} agiye kukwitaba ubwiwe kuri WhatsApp vuba.${ask}`
}

// Generates the customer-care reply from the recent thread. Returns null on failure.
export async function generateKirundiReply(
  thread: ChatMessage[],
  clientName?: string | null,
): Promise<string | null> {
  try {
    const ctx = await loadContext()
    const system = buildSystemPrompt(ctx, clientName)
    const history = thread.slice(-16).map((m) => ({
      role: m.sender === "client" ? ("user" as const) : ("assistant" as const),
      content: m.body,
    }))

    const { text } = await generateText({
      model: MODEL,
      system,
      messages: history,
      timeout: MODEL_TIMEOUT_MS,
    })
    const reply = text.trim()
    if (!reply.length) return null
    lastAiError = null
    return reply.slice(0, 1500)
  } catch (err) {
    const message = (err as Error).message ?? String(err)
    lastAiError = { message: message.slice(0, 300), at: new Date().toISOString() }
    console.log("[v0] generateKirundiReply failed:", message)
    return null
  }
}

// Quick health check used by the admin panel.
export async function checkAiHealth(): Promise<{ ok: boolean; error?: string; sample?: string }> {
  try {
    const { text } = await generateText({
      model: MODEL,
      prompt: "Vuga 'Ego' gusa.",
      timeout: 12_000,
    })
    return { ok: true, sample: text.trim().slice(0, 40) }
  } catch (err) {
    return { ok: false, error: ((err as Error).message ?? String(err)).slice(0, 300) }
  }
}
