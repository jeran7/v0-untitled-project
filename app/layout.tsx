import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SubscriptionBlocker } from "@/components/subscription-blocker"
import { AuthFixer } from "@/components/auth-fixer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Track and analyze your trading performance",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SubscriptionBlocker />
          <AuthFixer />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
