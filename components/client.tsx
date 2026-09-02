"use client"

import React, { useEffect, useState } from "react"
import {
  ArrowRightLeft,
  PhoneCall,
  MessageSquare,
  Share2,
  Smartphone,
  Building2,
  ShieldCheck,
  Users,
} from "lucide-react"
import { ClientChat } from "@/components/client-chat"
import { FeedbackSection } from "@/components/feedback-section"

interface Country {
  name: string
  code?: string
  flag?: string
}

interface HomePageClientProps {
  rates: {
    usdMobileRate?: number
    usdBankRate?: number
    [key: string]: unknown
  }

  content: {
    marquee?: string[]
    brandName?: string
    tagline?: string
    phone?: string
    callLabel?: string
    agentName?: string

    heroBadge?: string
    heroTitle?: string
    heroSubtitle?: string

    fees?: unknown

    burundiMobile?: string[]
    burundiBanks?: string[]

    otherCountriesLabel?: string
    countries?: Country[]

    whatsappNumber?: string
    whatsappLabel?: string

    footerTitle?: string
    footerNote?: string
    whatsappGroupUrl?: string
    groupLabel?: string

    [key: string]: unknown
  }
}

const DEFAULT_COUNTRIES: Required<Country>[] = [
  { name: "Uganda", code: "UGX", flag: "🇺🇬" },
  { name: "Tanzania", code: "TSH", flag: "🇹🇿" },
  { name: "Kenya", code: "KSH", flag: "🇰🇪" },
  { name: "Rwanda", code: "RWF", flag: "🇷🇼" },
  { name: "DR Congo", code: "CDF", flag: "🇨🇩" },
]

const COUNTRY_RATES: Record<string, number> = {
  UGX: 10170,
  TSH: 7026,
  KSH: 341,
  RWF: 3935,
  CDF: 6716,
}

type FeeRow = { maxAed: number; fee: number }

const FALLBACK_FEES: FeeRow[] = [
  { maxAed: 99, fee: 3 },
  { maxAed: 500, fee: 3 },
  { maxAed: 1000, fee: 5 },
  { maxAed: 2000, fee: 7 },
  { maxAed: 3000, fee: 10 },
  { maxAed: 5000, fee: 25 },
  { maxAed: 7000, fee: 35 },
  { maxAed: 10000, fee: 60 },
]

export function HomePageClient({
  rates,
  content,
}: HomePageClientProps) {
  /*
   * =========================================================
   * SETTINGS
   * =========================================================
   */

  const fallbackP2PRate = Number(
    rates.usdMobileRate || 5982
  )

  const USD_TO_AED = 3.67

  const phone = content.phone || "0552256963"

  const whatsappNumber =
    content.whatsappNumber || "+971 55 225 6963"

  const whatsappRaw = whatsappNumber.replace(/\D/g, "")

  /*
   * =========================================================
   * LIVE P2P RATE
   * =========================================================
   */

  const [p2pRate, setP2pRate] =
    useState<number>(fallbackP2PRate)

  const [p2pLoading, setP2pLoading] =
    useState(true)

  const [p2pUpdated, setP2pUpdated] =
    useState<Date | null>(null)

  const [rateDirection, setRateDirection] =
    useState<"up" | "down" | "same">("same")

  useEffect(() => {
    let cancelled = false

    async function fetchP2PRate() {
      try {
        const response = await fetch(
          "/api/p2p-rate",
          {
            method: "GET",
            cache: "no-store",
          }
        )

        if (!response.ok) {
          throw new Error("P2P rate request failed")
        }

        const data = await response.json()

        if (
          !cancelled &&
          typeof data.rate === "number" &&
          data.rate > 0
        ) {
          setP2pRate((previous) => {
            if (data.rate > previous) {
              setRateDirection("up")
            } else if (data.rate < previous) {
              setRateDirection("down")
            } else {
              setRateDirection("same")
            }

            return data.rate
          })

          setP2pUpdated(new Date())
        }
      } catch {
        if (!cancelled) {
          setP2pRate(fallbackP2PRate)
        }
      } finally {
        if (!cancelled) {
          setP2pLoading(false)
        }
      }
    }

    fetchP2PRate()

    // Update the displayed P2P rate every minute.
    const interval = window.setInterval(
      fetchP2PRate,
      60_000
    )

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [fallbackP2PRate])

  /*
   * =========================================================
   * AED → BIF CALCULATOR
   * =========================================================
   */

  // Examples start at 1 AED.
  const [aedAmount, setAedAmount] =
    useState<number | "">(1)

  const [bifAmount, setBifAmount] =
    useState<number | "">(Math.round(fallbackP2PRate / USD_TO_AED))

  // Tracks whether the visitor has edited the AED/BIF example.
  const [aedTouched, setAedTouched] =
    useState(false)

  const bifPerAed =
    p2pRate / USD_TO_AED

  // Keep the 1 AED example in sync with the live rate until the user edits it.
  // Exact conversion (no hidden margin) so the numbers match the displayed rate.
  useEffect(() => {
    if (!aedTouched && bifPerAed > 0) {
      setAedAmount(1)
      setBifAmount(Math.round(1 * bifPerAed))
    }
  }, [bifPerAed, aedTouched])

  function handleAedChange(
    value: number | ""
  ) {
    setAedTouched(true)
    setAedAmount(value)

    if (value === "" || isNaN(value)) {
      setBifAmount("")
      return
    }

    setBifAmount(
      Math.round(
        value * bifPerAed
      )
    )
  }

  function handleBifChange(
    value: number | ""
  ) {
    setAedTouched(true)
    setBifAmount(value)

    if (
      value === "" ||
      isNaN(value) ||
      bifPerAed === 0
    ) {
      setAedAmount("")
      return
    }

    setAedAmount(
      Number(
        (
          value / bifPerAed
        ).toFixed(2)
      )
    )
  }

  /*
   * =========================================================
   * BIF → AED CALCULATOR
   * =========================================================
   */

  // Keep this as the existing Burundi → Dubai rate.
  const burundiToDubaiRate = 1668.86

  // Example starts at 1 AED (its BIF equivalent).
  const [inputBifAmount, setInputBifAmount] =
    useState<number | "">(Math.round(burundiToDubaiRate * 1.01))

  const [outputAedAmount, setOutputAedAmount] =
    useState<number | "">(1)

  function handleInputBifChange(
    value: number | ""
  ) {
    setInputBifAmount(value)

    if (
      value === "" ||
      isNaN(value) ||
      !burundiToDubaiRate
    ) {
      setOutputAedAmount("")
      return
    }

    const effectiveRate =
      burundiToDubaiRate * 1.01

    const result =
      value / effectiveRate

    setOutputAedAmount(
      Number(result.toFixed(2))
    )
  }

  /*
   * =========================================================
   * OTHER COUNTRY CALCULATORS
   * =========================================================
   */

  // Every country example starts at 1 AED.
  const [countryAmounts, setCountryAmounts] =
    useState<Record<string, number | "">>({
      UGX: 1,
      TSH: 1,
      KSH: 1,
      RWF: 1,
      CDF: 1,
    })

  const countries =
    content.countries &&
    content.countries.length > 0
      ? content.countries.map(
          (country, index) => ({
            name:
              country.name ||
              DEFAULT_COUNTRIES[index]?.name ||
              "Country",

            code:
              country.code ||
              DEFAULT_COUNTRIES[index]?.code ||
              `C${index}`,

            flag:
              country.flag ||
              DEFAULT_COUNTRIES[index]?.flag ||
              "🌍",
          })
        )
      : DEFAULT_COUNTRIES

  function getCountryPayout(
    currency: string,
    amount: number | ""
  ) {
    if (
      amount === "" ||
      isNaN(amount)
    ) {
      return "0"
    }

    const rate10AED =
      COUNTRY_RATES[currency] || 1000

    const ratePerAED =
      rate10AED / 10

    return Math.round(
      amount *
        ratePerAED *
        0.99
    ).toLocaleString()
  }

  /*
   * =========================================================
   * SHARE APP
   * =========================================================
   */

  async function handleShareApp() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "RUNGIKA NA BILLY",
          text:
            "Uburyo bwiza bwo kohereza amafaranga hagati ya Dubai n’Afurika!",
          url: window.location.href,
        })
      } catch {
        // User cancelled sharing.
      }

      return
    }

    try {
      await navigator.clipboard.writeText(
        window.location.href
      )

      alert(
        "Link y'app yanduwe muri clipboard!"
      )
    } catch {
      alert(
        "Ntivyashoboye gukopa link."
      )
    }
  }

  /*
   * =========================================================
   * PAYMENT METHODS
   * =========================================================
   */

  const mobilePaymentMethods =
    content.burundiMobile &&
    content.burundiMobile.length > 0
      ? content.burundiMobile
      : [
          "Lumicash",
          "Bancobu Enoti",
        ]

  const burundiBanks =
    content.burundiBanks &&
    content.burundiBanks.length > 0
      ? content.burundiBanks
      : [
          "Bancobu Courant",
          "BCB Bank",
          "CRDB Bank",
          "Ecobank",
          "IBB Bank",
          "BBCI",
          "BGF",
          "KCB",
          "FinBank",
        ]

  const [transferType, setTransferType] =
    useState<"mobile" | "bank">(
      "mobile"
    )

  /*
   * =========================================================
   * DISPLAY
   * =========================================================
   */

  const displayedP2PRate =
    Math.round(
      p2pRate
    ).toLocaleString()

  // Frais (fee) tiers, charged separately in AED. Falls back to defaults.
  const feeTiers: FeeRow[] = (
    Array.isArray(content.fees) ? (content.fees as FeeRow[]) : []
  )
    .map((t) => ({ maxAed: Number(t?.maxAed), fee: Number(t?.fee) }))
    .filter((t) => Number.isFinite(t.maxAed) && Number.isFinite(t.fee))
    .sort((a, b) => a.maxAed - b.maxAed)

  const fees = feeTiers.length > 0 ? feeTiers : FALLBACK_FEES

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">

      {/* =====================================================
          MARQUEE
      ===================================================== */}

      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-2.5 overflow-hidden shadow-lg border-b border-red-700">
        <div className="whitespace-nowrap animate-marquee flex items-center space-x-8 text-sm md:text-base font-black tracking-wide">
          {(content.marquee?.length
            ? content.marquee
            : [
                "⚡ ERURUKANA OHA! RUNGUZA AMAFARANGA YAWEYA INTAGUZA (1 - 10 MIN) ⚡",
                "OHEREZA AMAFARANGA MURI AFRIKA N'I DUBAI CUMPANGA!",
              ]
          ).map(
            (item, index) => (
              <React.Fragment
                key={index}
              >
                <span>
                  {item}
                </span>
                <span>
                  •
                </span>
              </React.Fragment>
            )
          )}
        </div>
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center border-b border-slate-800 gap-4">

        <div className="flex items-center space-x-3">

          <a
            href="/admin"
            aria-label="Kwinjira nk'umuyobozi (Admin)"
            className="w-12 h-12 rounded-full border-2 border-red-500 overflow-hidden shadow-md bg-slate-800 flex-shrink-0 block transition hover:border-red-300"
          >
            <img
              src="/billy-owner.png"
              alt="Uwurungika"
              className="w-full h-full object-cover object-top"
            />
          </a>

          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              {content.brandName ||
                "RUNGIKA NA BILLY"}
            </h1>

            <p className="text-xs text-slate-400">
              {content.tagline ||
                "Uburyo ushobora kuvugana n'uwurungika"}
            </p>
          </div>

        </div>

        <button
          onClick={handleShareApp}
          className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-full text-xs text-slate-300 transition shadow"
        >
          <Share2 className="w-3.5 h-3.5 text-green-400" />
          <span>
            Share App
          </span>
        </button>

      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-8">

        {/* ===================================================
            CONTACT
        =================================================== */}

        <div className="grid md:grid-cols-2 gap-4">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center">

            <div className="flex items-center space-x-3">

              <PhoneCall className="w-5 h-5 text-blue-400" />

              <div>
                <p className="text-xs text-slate-400">
                  {content.callLabel ||
                    "Botim / DuPay / Direct:"}
                </p>

                <p className="text-sm font-bold text-white">
                  {phone}
                </p>
              </div>

            </div>

          </div>

          <a
            href={`https://wa.me/${whatsappRaw}`}
            target="_blank"
            rel="noreferrer"
            className="bg-green-600 hover:bg-green-500 transition rounded-2xl p-4 flex items-center justify-center space-x-2 text-white font-bold shadow-lg"
          >
            <MessageSquare className="w-5 h-5" />

            <span>
              {content.whatsappLabel ||
                "Ushaka kuvugana n'uwurungika"}
            </span>
          </a>

        </div>

        {/* ===================================================
            LIVE P2P RATE
        =================================================== */}

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-7 shadow-xl">

          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-950/30 p-6 text-center">

            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-black tracking-[0.18em] uppercase">
              IDORARI 1 (USD)

              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>
            </div>

            <div
              className={`mt-2 text-5xl md:text-6xl font-black transition-all ${
                rateDirection === "up"
                  ? "text-emerald-300"
                  : rateDirection === "down"
                  ? "text-red-300"
                  : "text-emerald-400"
              }`}
            >
              {displayedP2PRate}
              <span className="text-2xl md:text-3xl ml-2">
                BIF
              </span>
            </div>

            <p className="mt-3 text-slate-400 font-bold">
              Idorari 1 ={" "}
              <span className="text-white">
                {USD_TO_AED.toFixed(2)} AED
              </span>
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">

              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-emerald-400 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE P2P
              </span>

              <span className="text-slate-500">
                {p2pLoading
                  ? "Updating..."
                  : p2pUpdated
                  ? `Updated ${p2pUpdated.toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}`
                  : "Live rate"}
              </span>

            </div>

          </div>

        </section>

        {/* ===================================================
            PAYMENT TYPE
        =================================================== */}

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-xl">

          <div className="grid grid-cols-2 bg-slate-950 border border-slate-800 rounded-2xl p-1">

            <button
              onClick={() =>
                setTransferType(
                  "mobile"
                )
              }
              className={`rounded-xl py-4 px-3 font-black transition flex items-center justify-center gap-2 ${
                transferType === "mobile"
                  ? "bg-emerald-500 text-slate-950 shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-5 h-5" />
              Lumicash / Bancobu
            </button>

            <button
              onClick={() =>
                setTransferType(
                  "bank"
                )
              }
              className={`rounded-xl py-4 px-3 font-black transition flex items-center justify-center gap-2 ${
                transferType === "bank"
                  ? "bg-emerald-500 text-slate-950 shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-5 h-5" />
              Izindi Banki
            </button>

          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">

            {(transferType === "mobile"
              ? mobilePaymentMethods
              : burundiBanks
            ).map(
              (method) => (
                <span
                  key={method}
                  className="text-xs bg-slate-950 border border-slate-800 rounded-full px-3 py-1.5 text-slate-400"
                >
                  {method}
                </span>
              )
            )}

          </div>

        </section>

        {/* ===================================================
            DUBAI → BURUNDI
        =================================================== */}

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">

          <h3 className="text-base md:text-lg font-black text-red-400 tracking-wide uppercase mb-1">
            USHAKA KURUNGIKA AMAHERA AVA DUBAI AJA MU BURUNDI
          </h3>

          <p className="text-xs text-slate-400 mb-5">
            Leta amafaranga yawe uyohereze Burundi ubwo nyene.
          </p>

          <div className="flex items-center gap-2 text-sm font-black text-slate-300 mb-4">
            AED
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            BIF
          </div>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Andika muri AED
              </label>

              <input
                type="number"
                value={aedAmount}
                onChange={(event) =>
                  handleAedChange(
                    event.target.value === ""
                      ? ""
                      : Number(
                          event.target.value
                        )
                  )
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-lg font-bold text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Muri BIF
              </label>

              <input
                type="number"
                value={bifAmount}
                onChange={(event) =>
                  handleBifChange(
                    event.target.value === ""
                      ? ""
                      : Number(
                          event.target.value
                        )
                  )
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-lg font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>

        </section>

        {/* ===================================================
            FRAIS / FEES
        =================================================== */}

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">

          <h3 className="text-base md:text-lg font-black text-amber-400 tracking-wide uppercase mb-1">
            AMAFRAIS (FEES)
          </h3>

          <p className="text-xs text-slate-400 mb-5 leading-5">
            Igiciro c&apos;idorari kigaragara ni co nyako. Frais ikatwa ukwayo mu AED
            ukurikije uko wohereza kwinshi.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {fees.map((tier, index) => {
              const previous = index > 0 ? fees[index - 1].maxAed : 0
              return (
                <div
                  key={`${tier.maxAed}-${index}`}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5"
                >
                  <p className="text-[11px] text-slate-400">
                    {previous > 0
                      ? `${previous.toLocaleString()} - ${tier.maxAed.toLocaleString()} AED`
                      : `≤ ${tier.maxAed.toLocaleString()} AED`}
                  </p>
                  <p className="text-sm font-black text-amber-400">
                    {tier.fee.toLocaleString()} AED
                  </p>
                </div>
              )
            })}
          </div>

        </section>

        {/* ===================================================
            BURUNDI → DUBAI
        =================================================== */}

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">

          <h3 className="text-base md:text-lg font-black text-green-400 tracking-wide uppercase mb-1">
            USHAKA GUTORA AMAFERANGA AVA MU BURUNDI AZA DUBAI
          </h3>

          <p className="text-xs text-slate-400 mb-5">
            Example: {Math.round(burundiToDubaiRate * 1.01).toLocaleString()} BIF = 1 AED
          </p>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                BIF Amount
              </label>

              <input
                type="number"
                value={inputBifAmount}
                onChange={(event) =>
                  handleInputBifChange(
                    event.target.value === ""
                      ? ""
                      : Number(
                          event.target.value
                        )
                  )
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-lg font-bold text-white focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                AED Amount
              </label>

              <input
                type="text"
                readOnly
                value={
                  outputAedAmount !== ""
                    ? Number(
                        outputAedAmount
                      ).toLocaleString()
                    : "0"
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-lg font-bold text-green-400"
              />
            </div>

          </div>

        </section>

        {/* ===================================================
            OTHER COUNTRIES
        =================================================== */}

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">

          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wide">
              {content.otherCountriesLabel ||
                "Ibindi Bihugu (Other Countries)"}
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

            {countries.map(
              (country) => {
                const currentValue =
                  countryAmounts[
                    country.code
                  ] ?? ""

                const payout =
                  getCountryPayout(
                    country.code,
                    currentValue
                  )

                return (
                  <div
                    key={country.code}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3"
                  >

                    <div className="flex justify-between items-center text-sm font-bold text-white">
                      <span>
                        {country.flag}{" "}
                        {country.name}
                      </span>

                      <span className="text-red-400 text-xs">
                        {country.code}
                      </span>
                    </div>

                    <input
                      type="number"
                      value={currentValue}
                      onChange={(event) =>
                        setCountryAmounts(
                          (previous) => ({
                            ...previous,
                            [country.code]:
                              event.target.value === ""
                                ? ""
                                : Number(
                                    event.target.value
                                  ),
                          })
                        )
                      }
                      placeholder="AED"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />

                    <div className="text-xs text-green-400 font-bold">
                      Azabona:{" "}
                      {payout}{" "}
                      {country.code}
                    </div>

                  </div>
                )
              }
            )}

          </div>

        </section>

        {/* ===================================================
            HERO / OLD CONTENT
        =================================================== */}

        {(content.heroBadge ||
          content.heroTitle ||
          content.heroSubtitle) && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">

            {content.heroBadge && (
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-400 mb-3">
                <ShieldCheck className="w-4 h-4" />
                {content.heroBadge}
              </div>
            )}

            {content.heroTitle && (
              <h2 className="text-2xl md:text-3xl font-black text-white">
                {content.heroTitle}
              </h2>
            )}

            {content.heroSubtitle && (
              <p className="text-sm text-slate-400 mt-3 leading-6">
                {content.heroSubtitle}
              </p>
            )}

          </section>
        )}

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="border-t border-slate-800 pt-8 pb-8">

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

            <div className="flex items-start gap-3">

              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>

              <div>
                <h3 className="font-black text-white">
                  {content.footerTitle ||
                    "RUNGIKA NA BILLY"}
                </h3>

                <p className="text-xs text-slate-400 mt-2 leading-5">
                  {content.footerNote ||
                    "Murashobora kutwandikira igihe cose kugira ngo tubafashe."}
                </p>
              </div>

            </div>

            <div className="mt-5 grid sm:grid-cols-2 gap-3">

              <a
                href={`tel:${phone.replace(
                  /\s/g,
                  ""
                )}`}
                className="rounded-xl border border-slate-700 bg-slate-950 p-3 flex items-center justify-center gap-2 text-sm font-bold hover:border-slate-500"
              >
                <PhoneCall className="w-4 h-4 text-blue-400" />
                Hamagara
              </a>

              <a
                href={`https://wa.me/${whatsappRaw}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-green-600 p-3 flex items-center justify-center gap-2 text-sm font-bold hover:bg-green-500"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </a>

            </div>

            {content.whatsappGroupUrl && (
              <a
                href={
                  content.whatsappGroupUrl
                }
                target="_blank"
                rel="noreferrer"
                className="block mt-3 text-center rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs font-bold text-slate-300 hover:text-white"
              >
                {content.groupLabel ||
                  "Join WhatsApp Group"}
              </a>
            )}

          </div>

        </footer>

        {/* ===================================================
            FEEDBACK (public comments, very last section)
        =================================================== */}

        <FeedbackSection />

      </main>

      {/* =====================================================
          FLOATING CHAT (real, connected to admin inbox)
      ===================================================== */}

      <ClientChat agentName={content.agentName || "Billy"} />

    </div>
  )
}
