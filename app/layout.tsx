import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'

export const metadata: Metadata = {
  title: 'Hema Tournaments Finder',
  description: 'Find HEMA tournaments anywhere in the world'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="bg-gray-800 text-gray-300 py-4 text-center text-sm">
          <div className="max-w-7xl mx-auto px-4">
            <p className="mb-2">
              Created by <span className="text-white font-medium">Fabrizio La Rosa</span>
              {" • "}
              <a 
                href="mailto:fbr.larosa@gmail.com" 
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                fbr.larosa@gmail.com
              </a>
            </p>
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <Link href="/privacy-policy" className="hover:text-blue-400 hover:underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/cookie-policy" className="hover:text-blue-400 hover:underline">
                Cookie Policy
              </Link>
            </div>
          </div>
        </footer>
        <CookieConsent />
      </body>
    </html>
  )
}
