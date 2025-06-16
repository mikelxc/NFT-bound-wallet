import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import Background from "@/components/background"
import Header from "@/components/header"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "NFT-Bound Smart Account",
  description: "Your Smart Account IS an NFT. Trade wallets like never before.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("min-h-screen font-sans antialiased", inter.variable, jetbrainsMono.variable)}>
        <Background />
        <Header />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  )
}
