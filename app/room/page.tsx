import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import { CommunityRoom } from "@/components/community-room"

export const metadata = {
  title: "Aho kuganirira — RUNGIKA NA BILLY",
  description: "Ikibanza co kuganiriramwo: ganira n'abandi banywanyi ku bijanye na serivisi.",
}

export default function RoomPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            aria-label="Subira ku rupapuro rw'itangiriro"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-400">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wide text-emerald-400">Aho kuganirira</h1>
              <p className="text-[11px] text-slate-400">Ganira n&apos;abandi banywanyi bose</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4">
        <CommunityRoom variant="page" />
      </main>
    </div>
  )
}
