import { getRateSettings } from "@/lib/rates"
import { getSiteContent } from "@/lib/content"
import { SiteHeader } from "@/components/site-header"
import { MarqueeBanner } from "@/components/marquee-banner"
import { ClientInbox } from "@/components/client-inbox"
import { MoneyExpressCalculator } from "@/components/money-express-calculator"
import { HeroSection } from "@/components/hero-section"
import { PaymentMethods } from "@/components/payment-methods"
import { OtherCountries } from "@/components/other-countries"
import { WhatsappCta } from "@/components/whatsapp-cta"
import { ContactFooter } from "@/components/contact-footer"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [rates, content] = await Promise.all([getRateSettings(), getSiteContent()])

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-slate-100">
      <MarqueeBanner items={content.marquee} />
      <SiteHeader
        brandName={content.brandName}
        tagline={content.tagline}
        phone={content.phone}
        callLabel={content.callLabel}
      />

      <main className="mx-auto mt-6 max-w-4xl space-y-8 px-4">
        {/* Collapsible Messaging Panel ("Kurungika Message") */}
        <ClientInbox agentName={content.agentName} />

        {/* First Calculator: AED to Burundi */}
        <MoneyExpressCalculator
          title="USHAKA KURUNGIKA AMAHERA AVA DUBAI AJA MU BURUNDI"
          usdMobileRate={rates.usdMobileRate}
          usdBankRate={rates.usdBankRate}
          fees={content.fees}
        />

        {/* Second Calculator: Burundi to Dubai (1,168,200 BIF = 700 AED) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-base md:text-lg font-black text-green-400 tracking-wide uppercase">
              USHAKA GUTORA AMAFERANGA AVA MU BURUNDI AZA DUBAI
            </h3>
            <p className="text-xs text-slate-400 mt-1">Andika amafaranga yo mu Burundi (BIF) urebe uko ungana hano Dubai (AED).</p>
          </div>
          <MoneyExpressCalculator
            title=""
            usdMobileRate={rates.usdMobileRate}
            usdBankRate={rates.usdBankRate}
            fees={content.fees}
          />
        </div>

        {/* Hero Section */}
        <HeroSection badge={content.heroBadge} title={content.heroTitle} subtitle={content.heroSubtitle} />

        {/* Country-Specific Calculator Panels */}
        <OtherCountries label={content.otherCountriesLabel} countries={content.countries} />

        {/* Payment Methods */}
        <PaymentMethods mobile={content.burundiMobile} banks={content.burundiBanks} />

        {/* WhatsApp CTA */}
        <WhatsappCta whatsappNumber={content.whatsappNumber} />

        {/* Contact Footer */}
        <ContactFooter
          title={content.footerTitle}
          note={content.footerNote}
          phone={content.phone}
          callLabel={content.callLabel}
          whatsappNumber={content.whatsappNumber}
          whatsappLabel={content.whatsappLabel}
          whatsappGroupUrl={content.whatsappGroupUrl}
          groupLabel={content.groupLabel}
        />
      </main>
    </div>
  )
}
