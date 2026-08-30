import { isAuthenticated } from "@/lib/admin-auth"
import { getRateSettings } from "@/lib/rates"
import { getSiteContent } from "@/lib/content"
import { getVisitStats } from "@/lib/admin-data"
import { LoginForm } from "@/components/admin/login-form"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  if (!(await isAuthenticated())) {
    return <LoginForm />
  }

  const [settings, content, visitStats] = await Promise.all([
    getRateSettings(),
    getSiteContent(),
    getVisitStats(),
  ])
  const marginPercent = Math.round((1 - settings.margin) * 1000) / 10

  return (
    <AdminDashboard
      usdMobileRate={settings.usdMobileRate}
      usdBankRate={settings.usdBankRate}
      marginPercent={marginPercent}
      content={content}
      visitStats={visitStats}
    />
  )
}
