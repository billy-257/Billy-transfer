import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { VisitTracker } from "@/components/visit-tracker"
import { SplashScreen } from "@/components/splash-screen"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "RUNGIKA NA BILLY - Kurungika Amafaranga",
  description:
    "Rungika amafaranga ava Dubai (AED/USD) aja mu Burundi no mu bindi bihugu vya Afrika mu buryo bwihuse kandi bwizewe.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://billytransfer.com"),
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RUNGIKA NA BILLY" },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#0b1120",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="rn" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="bg-background font-sans text-foreground antialiased">
        <SplashScreen />
        {children}
        <VisitTracker />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
