import { getRateSettings } from "@/lib/rates"
import { getSiteContent } from "@/lib/content"
import { HomePageClient } from "@/components/home-page-client"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [rates, content] = await Promise.all([
    getRateSettings(),
    getSiteContent(),
  ])

  return (
    <HomePageClient
      rates={rates}
      content={content}
    />
  )
}
