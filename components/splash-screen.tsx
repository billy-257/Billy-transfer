"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

// Opening animation shown once per app session with the brand promise:
// "AMAHERA YAWE INSHINGANO ZACU" (Your money, our responsibility).
const SESSION_KEY = "billy_splash_shown"

export function SplashScreen() {
  const [show, setShow] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    // Only show once per browser session so it never nags on every navigation.
    const already = typeof window !== "undefined" ? window.sessionStorage.getItem(SESSION_KEY) : "1"
    if (already) return

    try {
      window.sessionStorage.setItem(SESSION_KEY, "1")
    } catch {
      // ignore
    }

    setShow(true)
    // Lock scroll while the splash plays.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    timers.current.push(setTimeout(() => setLeaving(true), 3000))
    timers.current.push(
      setTimeout(() => {
        setShow(false)
        document.body.style.overflow = prevOverflow
      }, 3400),
    )

    return () => {
      timers.current.forEach(clearTimeout)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  if (!show) return null

  const words = ["AMAHERA", "YAWE", "INSHINGANO", "ZACU"]

  return (
    <div
      className={`splash-root fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950 px-6 text-center ${
        leaving ? "pointer-events-none" : ""
      }`}
      role="dialog"
      aria-label="Billy Fast Transfer"
    >
      {/* glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 35%, rgba(16,185,129,0.22), transparent 70%), radial-gradient(50% 40% at 50% 80%, rgba(239,68,68,0.14), transparent 70%)",
        }}
      />

      {/* logo with pulsing rings */}
      <div className="relative mb-8 flex items-center justify-center">
        <span aria-hidden className="splash-ring absolute h-40 w-40 rounded-full border border-emerald-400/40" />
        <span
          aria-hidden
          className="splash-ring absolute h-40 w-40 rounded-full border border-emerald-400/30"
          style={{ animationDelay: "0.5s" }}
        />
        <div className="splash-logo relative h-32 w-32 overflow-hidden rounded-full shadow-2xl shadow-emerald-500/30 ring-2 ring-emerald-400/40">
          <Image
            src="/brand/iwacu-pay-logo.jpg"
            alt="IWACU PAY - Faster Transfer"
            fill
            priority
            sizes="128px"
            className="object-cover"
          />
        </div>
      </div>

      {/* animated promise words */}
      <h1 className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
        {words.map((w, i) => (
          <span
            key={w}
            className={`splash-word ${w === "YAWE" || w === "ZACU" ? "text-emerald-400" : "text-white"}`}
            style={{ animationDelay: `${0.5 + i * 0.28}s` }}
          >
            {w}
          </span>
        ))}
      </h1>

      <p
        className="splash-word relative mt-4 text-sm font-medium text-slate-400"
        style={{ animationDelay: "1.9s" }}
      >
        BILLY FAST TRANSFER
      </p>
    </div>
  )
}
