"use client"

import useSWR from "swr"
import { socialFetcher } from "@/components/social/types"
import { isOwnerPhone } from "@/lib/owner"

// The round logo in the header doubles as the owner's entry point to the admin
// panel. Only the owner phone can open it; for everyone else pressing it does
// nothing at all.
export function AdminProfileLink() {
  const { data } = useSWR("/api/auth/me", socialFetcher)
  const isOwner = isOwnerPhone(data?.user?.phone)

  const cls =
    "w-12 h-12 rounded-full border-2 border-red-500 overflow-hidden shadow-md bg-slate-800 flex-shrink-0 block transition hover:border-red-300"

  const logo = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/iwacu-pay-logo.jpg" alt="IWACU PAY" className="w-full h-full object-cover" />
  )

  if (isOwner) {
    return (
      <a href="/admin" aria-label="Kwinjira nk'umuyobozi (Admin)" className={cls}>
        {logo}
      </a>
    )
  }

  // Non-owners: inert. Pressing it does nothing.
  return (
    <div className={cls} aria-hidden="true">
      {logo}
    </div>
  )
}
