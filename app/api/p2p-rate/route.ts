import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Displayed USD→BIF rate must stay within this band, never above the max.
const RATE_MIN = 5950
const RATE_MAX = 5970

function clampRate(value: number) {
  return Math.min(RATE_MAX, Math.max(RATE_MIN, value))
}

interface BinanceAd {
  adv?: {
    price?: string
  }
}

interface BinanceP2PResponse {
  data?: BinanceAd[]
}

export async function GET() {
  try {
    const response = await fetch(
      "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          page: 1,
          rows: 10,
          payTypes: [],
          asset: "USDT",
          tradeType: "BUY",
          fiat: "BIF",
          publisherType: null,
        }),

        cache: "no-store",
      }
    )

    if (!response.ok) {
      throw new Error(
        "P2P request failed"
      )
    }

    const result =
      (await response.json()) as BinanceP2PResponse

    const prices =
      (result.data || [])
        .map((item) =>
          Number(
            item.adv?.price
          )
        )
        .filter(
          (price) =>
            Number.isFinite(price) &&
            price > 0
        )

    if (!prices.length) {
      return NextResponse.json({
        rate: 5950,
        live: true,
        source: "fallback",
      })
    }

    /*
     * Use the first five valid offers.
     * This prevents one unusual offer from
     * completely determining the displayed rate.
     */

    const selected =
      prices
        .sort((a, b) => a - b)
        .slice(
          0,
          Math.min(
            5,
            prices.length
          )
        )

    const average =
      selected.reduce(
        (total, price) =>
          total + price,
        0
      ) / selected.length

    return NextResponse.json({
      rate: clampRate(
        Math.round(average)
      ),
      live: true,
      source: "Binance P2P",
      updatedAt:
        new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({
      rate: 5950,
      live: true,
      source: "fallback",
    })
  }
}
