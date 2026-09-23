import { getRateSettings } from "@/lib/rates"
import { getSiteContent } from "@/lib/content"
import { HomePageClient } from "@/components/client"
import { AuthGate } from "@/components/social/auth-gate"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [rates, content] = await Promise.all([
    getRateSettings(),
    getSiteContent(),
  ])

  return (
    <AuthGate>
      <HomePageClient
        rates={rates}
        content={content}
      />
    </AuthGate>
  )
}
