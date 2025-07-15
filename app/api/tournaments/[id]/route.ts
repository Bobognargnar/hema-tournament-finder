import { NextResponse } from "next/server"
import type { Tournament } from "@/types/tournament"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const baseUrl = process.env.API_BASE_URL

  if (!baseUrl) {
    console.warn("API_BASE_URL not found")
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
  }

  try {
    const response = await fetch(`${baseUrl}/rest/v1/tournaments?id=eq.${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_API_KEY || "",
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const tournaments: Tournament[] = await response.json()
    if (tournaments.length === 0) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    return NextResponse.json(tournaments[0])
  } catch (error) {
    console.error("Failed to fetch tournament from API:", error)
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
  }
}
