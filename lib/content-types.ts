export type FeeTier = { maxAed: number; fee: number }

export type Country = {
  code: string
  name: string
  flag: string
  ratePer10Aed: number
  methods: string[]
}

export type SiteContent = {
  brandName: string
  tagline: string
  agentName: string
  phone: string
  callLabel: string
  whatsappNumber: string
  whatsappLabel: string
  whatsappGroupUrl: string
  groupLabel: string
  marquee: string[]
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  fees: FeeTier[]
  burundiMobile: string[]
  burundiBanks: string[]
  otherCountriesLabel: string
  countries: Country[]
  footerTitle: string
  footerNote: string
}

export const DEFAULT_CONTENT: SiteContent = {
  brandName: "RUNGIKA NA BILLY",
  tagline: "Uburyo ushobora kuvugana n'uwurungika",
  agentName: "BRUCE",
  phone: "0552256963",
  callLabel: "Botim / DuPay / Direct",
  whatsappNumber: "971552256963",
  whatsappLabel: "Ushaka kuvugana n'uwurungika",
  whatsappGroupUrl: "https://chat.whatsapp.com/ETYuTFqXQIhFhd2sDo4ZfV",
  groupLabel: "Ushaka kwinjira muri group",
  marquee: [
    "ABANTU BASHIRA AMAFARANGA KURI BANK . DUSHIRA AMAFARANGA KURI BANK ZOSE ZOMUBURUNDI KUGICIRO CA 5930 KURI DOLLAR KUBWIMPAMVU ZAMAFARANGA BAGENDA BARAKATA BITANDUKANYE NABASHIRA KUMA NUMÉRO ASANZWE. BANDANYA UMANUKA URABE IZINDI SERIVISI ZACU NIZO MUBINDI BIHUGU ATARI UBURUNDI",
  ],
  heroBadge: "IGICIRO CA BANK 5930 BIF =1 USD",
  heroTitle:
    "KUBWIMPAMVU ZAMA FRAIS BAKATA AMAFARANGA IYO AJA KURI BANK TUVUNJA IDORARI RIMWE KUMAFARANGA 5930",
  heroSubtitle: "Rungika amafaranga ukoresheje uburyo bwihuse kandi bwizewe.",
  fees: [
    { maxAed: 99, fee: 3 },
    { maxAed: 500, fee: 3 },
    { maxAed: 1000, fee: 5 },
    { maxAed: 2000, fee: 7 },
    { maxAed: 3000, fee: 10 },
    { maxAed: 5000, fee: 25 },
    { maxAed: 7000, fee: 35 },
    { maxAed: 10000, fee: 60 },
  ],
  burundiMobile: ["Lumicash", "Bancobu Enoti", "Ecocash"],
  burundiBanks: ["Bancobu Courant", "BCB Bank", "CRDB Bank", "Ecobank", "IBB Bank", "BBCI", "BGF", "KCB", "FinBank"],
  otherCountriesLabel: "Ushaka kurungika mu bindi bihugu",
  countries: [
    { code: "UGX", name: "Uganda", flag: "🇺🇬", ratePer10Aed: 10170, methods: ["MTN Mobile Money", "Airtel Money"] },
    {
      code: "TSH",
      name: "Tanzaniya",
      flag: "🇹🇿",
      ratePer10Aed: 7026,
      methods: ["M-Pesa (Vodacom)", "Mixx by Yas (Tigo)", "Airtel Money", "HaloPesa"],
    },
    { code: "KSH", name: "Kenya", flag: "🇰🇪", ratePer10Aed: 341, methods: ["M-Pesa (Safaricom)", "Airtel Money"] },
    { code: "RWF", name: "u Rwanda", flag: "🇷🇼", ratePer10Aed: 3935, methods: ["MTN MoMo", "Airtel Money"] },
    {
      code: "CDF",
      name: "Repubulika Iharanira Demokarasi ya Kongo",
      flag: "🇨🇩",
      ratePer10Aed: 6716,
      methods: ["M-Pesa (Vodacom)", "Orange Money", "Airtel Money"],
    },
  ],
  footerTitle: "Uburyo ushobora kuvugana n'uwurungika",
  footerNote: "(Yemewe kuri WhatsApp, Botim na DuPay)",
}

// Returns the fee (in AED) for a given AED send amount.
export function feeForAed(aed: number, fees: FeeTier[]): number {
  if (!aed || aed <= 0) return 0
  const sorted = [...fees].sort((a, b) => a.maxAed - b.maxAed)
  for (const tier of sorted) {
    if (aed <= tier.maxAed) return tier.fee
  }
  // Above the highest tier: use the last tier's fee.
  return sorted.length ? sorted[sorted.length - 1].fee : 0
}
