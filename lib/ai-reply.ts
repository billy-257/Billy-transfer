import "server-only"
import { generateText } from "ai"
import { getRateSettings } from "@/lib/rates"
import { getSiteContent } from "@/lib/content"
import type { ChatMessage } from "@/lib/db/schema"

const USD_TO_AED = 3.67
// Fast, cheap, strong multilingual model via Vercel AI Gateway (zero-config auth).
const MODEL = "google/gemini-2.5-flash"

// Builds a Kirundi system prompt describing the service + the live rate at chat time.
async function buildSystemPrompt(clientName?: string | null) {
  const [rates, content] = await Promise.all([getRateSettings(), getSiteContent()])

  const usdMobile = Math.round(rates.usdMobileRate)
  const usdBank = Math.round(rates.usdBankRate)
  const aedMobile = Math.round(rates.usdMobileRate / USD_TO_AED)
  const aedBank = Math.round(rates.usdBankRate / USD_TO_AED)

  const feeLines = content.fees
    .slice()
    .sort((a, b) => a.maxAed - b.maxAed)
    .map((t) => `- gushika kuri ${t.maxAed} AED: frais ${t.fee} AED`)
    .join("\n")

  const countryLines = content.countries
    .map((c) => `- ${c.name} (${c.code}): ~${c.ratePer10Aed} kuri 10 AED, ${c.methods.join(", ")}`)
    .join("\n")

  const now = new Date().toLocaleString("en-GB", { timeZone: "Africa/Bujumbura", dateStyle: "medium", timeStyle: "short" })

  return `Uri umufasha (assistant) wa "${content.brandName}", serivisi yo kurungika no gutora amafaranga hagati ya Dubai (UAE) n'Uburundi n'ibindi bihugu vy'Afrika y'Uburasirazuba.

INDIMI: Wama wishura mu KIRUNDI gusa, mu buryo bworoshe, bushize amanga kandi bufise ikaze. Niba umukiriya yandika mu rundi rurimi, umwishure mu Kirundi ariko woshobora gukoresha amajambo make y'ico rurimi ari ngombwa.

IGIKORWA CACU:
- Turrungika amafaranga ava Dubai (AED) tuyashira mu Burundi (BIF) canke mu bindi bihugu.
- Igiciro c'uyu musi (${now}, isaha y'i Bujumbura):
  * Kuri mobile/numéro isanzwe: 1 USD = ${usdMobile} BIF (canke ~1 AED = ${aedMobile} BIF)
  * Kuri banki: 1 USD = ${usdBank} BIF (canke ~1 AED = ${aedBank} BIF)
- Igiciro c'idorari kigaragara ni co nyako; FRAIS ikatwa ukwayo mu AED:
${feeLines}
- Ibindi bihugu dushobora kurungikamwo:
${countryLines}

UBURYO BWO KWISHURA:
1. Wishure ku kibazo c'umukiriya mu buryo bwuzuye ariko bugufi (nk'imvugo 2-5).
2. Iyo bavuga ivy'igiciro/kurungika, wabwira igiciro c'uyu musi kandi usigure ko frais ari ukwayo.
3. Mu nyuma y'inyishu, wongereko ikibazo kimwe c'ubushake: umubaze uko yumva serivisi yacu (feels), canke ico dushobora kunoza.
4. Ntukigire ivyo utazi. Iyo ari ikibazo gikomeye (nka kwemeza kwohereza amafaranga), umubwire ko ${content.agentName || "uwurungika"} aza kwihutira kumwishura kuri WhatsApp.
5. Ntuzevuge amazina ya AI/model. Wivugane nk'umuntu wa "${content.brandName}".

${clientName ? `Izina ry'umukiriya: ${clientName}.` : ""}`
}

// Generates a Kirundi assistant reply from the recent thread. Returns null on failure.
export async function generateKirundiReply(
  thread: ChatMessage[],
  clientName?: string | null,
): Promise<string | null> {
  try {
    const system = await buildSystemPrompt(clientName)
    const history = thread
      .slice(-10)
      .map((m) => `${m.sender === "client" ? "Umukiriya" : "Serivisi"}: ${m.body}`)
      .join("\n")

    const { text } = await generateText({
      model: MODEL,
      system,
      prompt: `Iki ni ikiganiro kigezweho hagati y'umukiriya na serivisi:\n\n${history}\n\nAndika inyishu ya "${clientName || "umukiriya"}" mu Kirundi ubu nonaha.`,
    })
    const reply = text.trim()
    return reply.length ? reply.slice(0, 1500) : null
  } catch (err) {
    console.log("[v0] generateKirundiReply failed:", (err as Error).message)
    return null
  }
}
