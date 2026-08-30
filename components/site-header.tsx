import Image from "next/image"
import Link from "next/link"
import { PhoneCall } from "lucide-react"

type Props = {
  brandName: string
  tagline: string
  phone: string
  callLabel: string
}

export function SiteHeader({ brandName, tagline, phone, callLabel }: Props) {
  return (
    <header className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-4 py-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          aria-label="Kwinjira nk'umuyobozi (Admin)"
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500 bg-slate-800 transition hover:border-emerald-400"
        >
          <Image
            src="/1000107113.jpg"
            alt={brandName}
            width={48}
            height={48}
            className="h-full w-full object-cover object-top"
            priority
          />
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-wide text-white">{brandName}</h1>
          <p className="text-xs text-slate-400">{tagline}</p>
        </div>
      </div>
      <a
        href={`tel:${phone}`}
        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 transition hover:border-slate-500"
      >
        <PhoneCall className="h-4 w-4 text-emerald-400" />
        <div className="text-left">
          <p className="text-[10px] text-slate-400">{callLabel}</p>
          <p className="text-sm font-bold text-white">{phone}</p>
        </div>
      </a>
    </header>
  )
}
