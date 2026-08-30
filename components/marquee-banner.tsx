type Props = { items: string[] }

export function MarqueeBanner({ items }: Props) {
  const text = items.join("     \u2022     ")
  return (
    <div className="overflow-hidden border-b border-emerald-700 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 py-2.5 text-slate-950">
      <div className="animate-marquee whitespace-nowrap text-sm font-black tracking-wide">
        <span className="mx-8">{text}</span>
        <span className="mx-8" aria-hidden="true">
          {text}
        </span>
      </div>
    </div>
  )
}
