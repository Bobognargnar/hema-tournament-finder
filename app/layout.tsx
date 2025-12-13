import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
