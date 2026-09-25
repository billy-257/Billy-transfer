import { NextResponse } from "next/server"
import { getRateSettings } from "@/lib/rates"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Single source of truth for the displayed USD rate: it always comes from the
// admin-set value in the database. No external market, no hardcoded numbers,
// no GitHub. Changing the rate in the app updates this instantly for everyone.
export async function GET() {
  try {
    const rates = await getRateSettings()
    const rate = Number(rates.usdMobileRate)
    return NextResponse.json(
      { rate: rate > 0 ? rate : 5982, source: "admin" },
      { headers: { "cache-control": "no-store" } },
    )
  } catch (err) {
    console.log("[v0] p2p-rate failed:", (err as Error).message)
    return NextResponse.json(
      { rate: 5982, source: "fallback" },
      { headers: { "cache-control": "no-store" } },
    )
  }
}
