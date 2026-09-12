import "server-only"
import { db } from "@/lib/db"
import { rateSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export type RateData = {
  aedRates: Record<string, number>
  usdMobileRate: number
  usdBankRate: number
  margin: number
}

// Bank rate is fixed: it must always be 5920 BIF per USD, no matter what other
// rates the admin changes. This is the single source of truth for the bank rate.
export const FIXED_BANK_RATE = 5920

const DEFAULTS: RateData = {
  aedRates: {},
  usdMobileRate: 5980,
  usdBankRate: FIXED_BANK_RATE,
  margin: 0.99,
}

export async function getRateSettings(): Promise<RateData> {
  try {
    const rows = await db.select().from(rateSettings).where(eq(rateSettings.id, 1)).limit(1)
    if (rows.length === 0) return DEFAULTS
    const r = rows[0]
    return {
      aedRates: r.aedRates ?? {},
      usdMobileRate: Number(r.usdMobileRate),
      // Always force the bank rate to the fixed value, ignoring any stored value.
      usdBankRate: FIXED_BANK_RATE,
      margin: Number(r.margin),
    }
  } catch (err) {
    console.log("[v0] getRateSettings failed, using defaults:", (err as Error).message)
    return DEFAULTS
  }
}
