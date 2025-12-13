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
      <body className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="bg-gray-800 text-gray-300 py-4 text-center text-sm">
          <p>
            Created by <span className="text-white font-medium">Fabrizio La Rosa</span>
            {" • "}
            <a 
              href="mailto:fbr.larosa@gmail.com" 
              className="text-blue-400 hover:text-blue-300 hover:underline"
            >
              fbr.larosa@gmail.com
            </a>
          </p>
        </footer>
      </body>
    </html>
  )
}
