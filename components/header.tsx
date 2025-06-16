"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path)

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl">
      <nav className="w-full p-2 rounded-full glass-panel">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-bold text-lg text-white/90 pl-4">
            NFT-BSA
          </Link>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Link
              href="/"
              className={`nav-link ${isActive("/") && pathname === "/" ? "nav-link-active text-white/90" : ""}`}
            >
              Home
            </Link>
            <Link href="/wallet" className={`nav-link ${isActive("/wallet") ? "nav-link-active text-white/90" : ""}`}>
              Wallet
            </Link>
            <Link
              href="/account"
              className={`nav-link ${isActive("/account") && pathname === "/account" ? "nav-link-active text-white/90" : ""}`}
            >
              Gallery
            </Link>
            <Link
              href="/contract-preview"
              className={`nav-link ${isActive("/contract-preview") ? "nav-link-active text-white/90" : ""}`}
            >
              Preview
            </Link>
            <Link href="/docs" className={`nav-link ${isActive("/docs") ? "nav-link-active text-white/90" : ""}`}>
              Docs
            </Link>
            <Link
              href="/community"
              className={`nav-link ${isActive("/community") ? "nav-link-active text-white/90" : ""}`}
            >
              Community
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
