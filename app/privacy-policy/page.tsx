"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/privacy-policy.md")
      .then((res) => res.text())
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load privacy policy:", err)
        setLoading(false)
      })
  }, [])

  // Simple markdown to HTML conversion
  const renderMarkdown = (md: string) => {
    return md
      .split("\n")
      .map((line, index) => {
        // Headers
        if (line.startsWith("# ")) {
          return (
            <h1 key={index} className="text-3xl font-bold mb-6 mt-8 first:mt-0">
              {line.substring(2)}
            </h1>
          )
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={index} className="text-2xl font-semibold mb-4 mt-6">
              {line.substring(3)}
            </h2>
          )
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={index} className="text-xl font-semibold mb-3 mt-4">
              {line.substring(4)}
            </h3>
          )
        }
        // Bold text with content after
        if (line.startsWith("**") && line.includes("**")) {
          const parts = line.split("**")
          if (parts.length >= 3) {
            return (
              <p key={index} className="mb-2">
                <strong>{parts[1]}</strong>
                {parts[2]}
              </p>
            )
          }
        }
        // List items
        if (line.startsWith("- ")) {
          const text = line.substring(2)
          // Handle bold in list items
          if (text.startsWith("**")) {
            const match = text.match(/\*\*(.+?)\*\*:?\s*(.*)/)
            if (match) {
              return (
                <li key={index} className="ml-6 mb-1 list-disc">
                  <strong>{match[1]}</strong>
                  {match[2] ? `: ${match[2]}` : ""}
                </li>
              )
            }
          }
          return (
            <li key={index} className="ml-6 mb-1 list-disc">
              {text}
            </li>
          )
        }
        // Links in text [text](/url)
        if (line.includes("[") && line.includes("](/")) {
          const parts = line.split(/\[([^\]]+)\]\(([^)]+)\)/)
          return (
            <p key={index} className="mb-2">
              {parts.map((part, i) => {
                if (i % 3 === 1) {
                  // Link text
                  const url = parts[i + 1]
                  return (
                    <Link key={i} href={url} className="text-blue-600 hover:underline">
                      {part}
                    </Link>
                  )
                }
                if (i % 3 === 2) {
                  // URL - skip, already handled
                  return null
                }
                return part
              })}
            </p>
          )
        }
        // Empty lines
        if (line.trim() === "") {
          return <br key={index} />
        }
        // Regular paragraphs
        return (
          <p key={index} className="mb-2">
            {line}
          </p>
        )
      })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="prose prose-gray max-w-none">{renderMarkdown(content)}</div>
          )}
        </div>
      </div>
    </div>
  )
}


