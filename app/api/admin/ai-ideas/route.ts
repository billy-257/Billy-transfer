import { NextResponse } from "next/server"
import { generateText } from "ai"
import { isAuthenticated } from "@/lib/admin-auth"
import { getSiteContent } from "@/lib/content"

export const runtime = "nodejs"
export const maxDuration = 60

const MODEL = "google/gemini-2.5-flash"

type Idea = {
  title: string
  summaryKirundi: string
  features: string[]
  questions: string[]
  buildPrompt: string
}

// Admin describes a wish (any language) -> AI returns a clear plan + a ready-to-paste build prompt.
export async function POST(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ ok: false }, { status: 401 })
  try {
    const { request } = await req.json()
    const wish = typeof request === "string" ? request.trim().slice(0, 2000) : ""
    if (wish.length < 3) return NextResponse.json({ ok: false, error: "Andika ico ushaka" }, { status: 400 })

    const content = await getSiteContent()
    const system = `You are the product engineer for "${content.brandName}", a Next.js web app for sending money between Dubai (AED) and Burundi (BIF) and other East African countries. The app already has: a public homepage (live USD/AED to BIF rates, calculators, fees table, other countries, payment methods, footer, public customer feedback section), an in-app chat with an AI customer-care auto-reply in Kirundi, and a password-protected admin panel (inbox with online status and delete, rates editor, content editor, visitors and WhatsApp leads, this AI ideas tab). Stack: Next.js App Router, Tailwind, Neon Postgres via Drizzle, Vercel AI Gateway.

The owner (Billy) will describe what he wants, often in Kirundi, French or informal English. Your job:
1. Understand the real intent and turn it into a concrete, buildable feature.
2. Return STRICT JSON only (no markdown fences) with this shape:
{
  "title": "short feature name in English",
  "summaryKirundi": "2-4 simple Kirundi sentences explaining to Billy what will be built and how it will work",
  "features": ["3-7 concrete bullet points in English of what exactly changes in the app"],
  "questions": ["0-3 short questions in Kirundi ONLY if a decision is truly needed; otherwise empty array"],
  "buildPrompt": "a complete, precise English instruction addressed to the developer AI (v0) to implement this in the existing app, mentioning the relevant existing pieces (homepage, admin tab, chat, database) so it can be built immediately without more questions. Include sensible defaults for anything Billy did not specify."
}`

    const { text } = await generateText({
      model: MODEL,
      system,
      prompt: `Billy's request:\n"""${wish}"""`,
      timeout: 40_000,
    })

    let idea: Idea | null = null
    try {
      const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
      const parsed = JSON.parse(cleaned)
      idea = {
        title: String(parsed.title ?? "Feature"),
        summaryKirundi: String(parsed.summaryKirundi ?? ""),
        features: Array.isArray(parsed.features) ? parsed.features.map(String) : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions.map(String) : [],
        buildPrompt: String(parsed.buildPrompt ?? ""),
      }
    } catch {
      idea = { title: "Feature", summaryKirundi: "", features: [], questions: [], buildPrompt: text.trim() }
    }
    return NextResponse.json({ ok: true, idea })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: ((err as Error).message ?? "Habaye ikibazo").slice(0, 300) },
      { status: 500 },
    )
  }
}
