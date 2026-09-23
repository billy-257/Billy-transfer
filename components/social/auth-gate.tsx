"use client"

import useSWR from "swr"
import { Loader2 } from "lucide-react"
import { socialFetcher, type SocialUser } from "@/components/social/types"
import { AuthForms } from "@/components/social/auth-forms"

// Gates the whole app behind login: the auth screen shows before any
// content, and children render only once a user is signed in.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading, mutate } = useSWR("/api/auth/me", socialFetcher)
  const me: SocialUser | null = data?.user ?? null

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (!me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/iwacu-pay-logo.jpg"
            alt="IWACU PAY"
            className="h-24 w-24 rounded-full border-2 border-emerald-500 object-cover shadow-lg"
          />
          <h1 className="mt-4 text-xl font-black text-white">IWACU PAY</h1>
          <p className="mt-1 max-w-xs text-sm text-slate-400">
            Injira canke wiyandikishe kugira uronke serivisi zose.
          </p>
        </div>
        <AuthForms onAuthed={() => mutate()} />
      </div>
    )
  }

  return <>{children}</>
}
