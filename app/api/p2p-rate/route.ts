import { NextResponse } from "next/server"
import { getRateSettings } from "@/lib/rates"

export const dynamic = "force-dynamic"

/*
 * The displayed USD→BIF rate is controlled 100% from the admin panel and stored
 * in the database. It is NOT hardcoded here and is NOT pulled from any external
 * market, so it can only be changed from the app (Admin → Ibiciro), never by
 * editing code / GitHub.
 */
export async function GET() {
  try {
    const { usdMobileRate } = await getRateSettings()
    return NextResponse.json({
      rate: usdMobileRate,
      live: true,
      source: "admin",
      updatedAt: new Date().toISOString(),
    })
  } catch {
    // If the database is briefly unreachable, fall back to the built-in default.
    return NextResponse.json({
      rate: 5980,
      live: false,
      source: "fallback",
    })
  }
}
