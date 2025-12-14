"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted")
    setShowBanner(false)
  }

  const rejectCookies = () => {
    localStorage.setItem("cookieConsent", "rejected")
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-center sm:text-left">
          <p>
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{" "}
            <Link href="/cookie-policy" className="text-blue-400 hover:underline">
              Learn more
            </Link>
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={rejectCookies}
            className="bg-transparent border-gray-500 text-white hover:bg-gray-800"
          >
            Reject
          </Button>
          <Button
            size="sm"
            onClick={acceptCookies}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}

