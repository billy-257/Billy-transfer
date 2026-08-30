import { Users } from "lucide-react"
import type { VisitStats } from "@/lib/admin-data"

function timeAgo(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d
  const diff = Date.now() - date.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "ubu nyene"
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} d`
}

export function VisitorsRoom({ stats }: { stats: VisitStats }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Uyu munsi", value: stats.today },
          { label: "Iyi ndwi", value: stats.last7 },
          { label: "Bose", value: stats.total },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
            <p className="text-2xl font-black text-emerald-400 tabular-nums">{s.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
          <Users className="h-4 w-4 text-emerald-400" />
          Abaje vuba (Recent)
        </h4>
        {stats.recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Nta muntu araza.</p>
        ) : (
          <div className="space-y-1.5">
            {stats.recent.map((v) => (
              <div key={v.id} className="flex items-center justify-between border-b border-slate-800/60 py-1.5 text-xs last:border-0">
                <span className="text-slate-300">
                  {[v.city, v.country].filter(Boolean).join(", ") || "Ahatazwi"}
                  <span className="ml-2 text-slate-500">{v.path}</span>
                </span>
                <span className="text-slate-500">{timeAgo(v.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
