"use client"

import { useEffect, useRef, useState } from "react"
import { Zap, ShieldCheck, HeartHandshake } from "lucide-react"

type Slide = {
  image: string
  alt: string
  icon: typeof Zap
  title: string
  text: string
}

const SLIDES: Slide[] = [
  {
    image: "/showcase/sending-money.png",
    alt: "Umuntu ariko arungika amafaranga ava Dubai akoresheje telefone",
    icon: Zap,
    title: "Rungika mu maseconde",
    text: "Ava Dubai (AED/USD) aja mu Burundi ningoga cane, ukoresheje telefone yawe gusa.",
  },
  {
    image: "/showcase/receiving-money.png",
    alt: "Umukenyezi ariko arakira amafaranga kuri telefone mu Burundi",
    icon: ShieldCheck,
    title: "Amahera yawe arinzwe",
    text: "Buri kurungika kwizewe kandi kurindiwe. Uraronka integuza igihe amahera ashitse.",
  },
  {
    image: "/showcase/family-support.png",
    alt: "Umuryango w'abarundi bakinye baraba amafaranga baronse kuri telefone",
    icon: HeartHandshake,
    title: "Ushigikira abo ukunda",
    text: "Fasha umuryango wawe n'abagenzi bawe aho bari hose, mu Burundi no mu bindi bihugu vya Afrika.",
  },
]

export function FeatureShowcase() {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} aria-label="Ico app ikora" className="py-2">
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Billy Fast Transfer</p>
        <h2 className="mt-2 text-balance text-2xl font-black text-white sm:text-3xl">
          Amahera yawe, inshingano zacu
        </h2>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-slate-400">
          Twegereza amahera yawe abo ukunda mu buryo bwihuse, bworoshe kandi bwizewe.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {SLIDES.map((s, i) => {
          const Icon = s.icon
          return (
            <article
              key={s.title}
              className={`group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-lg ${
                visible ? "reveal" : "opacity-0"
              }`}
              style={visible ? { animationDelay: `${i * 0.15}s` } : undefined}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image || "/placeholder.svg"}
                  alt={s.alt}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"
                />
                <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/90 shadow-lg backdrop-blur">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="text-lg font-black text-white text-balance">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{s.text}</p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
