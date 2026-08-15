import type { Metadata, Viewport } from "next"
import { Outfit, Mukta_Malar } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"]
})

const muktaMalar = Mukta_Malar({
  variable: "--font-tamil",
  weight: ["400", "500", "600", "700"],
  subsets: ["tamil", "latin"]
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
}

export const metadata: Metadata = {
  title: "டீ கடை — Tea Kadai | Vintage Tamil Melodies",
  description: "Old songs. Hot tea. Good memories. Revisit timeless Tamil melodies of the Ilaiyaraaja and A.R. Rahman era in a vintage tea stall atmosphere."
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ta" className={`${outfit.variable} ${muktaMalar.variable}`}>
      <body className="relative min-h-dvh overflow-x-hidden antialiased bg-tea-charcoal text-tea-cream selection:bg-tea-accent selection:text-tea-charcoal">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
