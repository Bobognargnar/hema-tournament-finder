import { NextResponse } from "next/server"
import type { Tournament } from "@/types/tournament"

// GET - Fetch all tournaments from Supabase
export async function GET() {
  const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
  const apiKey = process.env.API_KEY

  if (!apiBaseUrl) {
    console.error("API_BASE_URL not configured")
    return NextResponse.json({ error: "API configuration error" }, { status: 500 })
  }

  if (!apiKey) {
    console.error("API_KEY not configured")
    return NextResponse.json({ error: "API configuration error" }, { status: 500 })
  }

  try {
    console.log("Fetching tournaments from Supabase...")
    
    const response = await fetch(`${apiBaseUrl}/rest/v1/tournaments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("Failed to fetch tournaments:", response.status, errorText)
      return NextResponse.json(
        { error: `Failed to fetch tournaments: ${response.status}` },
        { status: response.status }
      )
    }

    const rawTournaments = await response.json()
    console.log(`Fetched ${rawTournaments.length} tournaments from Supabase`)

    // Transform snake_case to camelCase
    const tournaments: Tournament[] = rawTournaments.map((t: Record<string, unknown>) => {
      // Database stores as [lat, lon], OpenLayers needs [lon, lat]
      const rawCoords = t.coordinates as [number, number] | null
      const coords = rawCoords ? [rawCoords[1], rawCoords[0]] as [number, number] : null
      
      return {
        id: t.id,
        name: t.name,
        location: t.location,
        date: t.date,
        disciplines: t.disciplines,
        image: t.image || "/placeholder.svg",
        coordinates: coords,
        description: t.description,
        registrationLink: t.registration_link,
        venueDetails: t.venue_details,
        contactEmail: t.contact_email,
        rulesLink: t.rules_link,
        submittedBy: t.submitted_by || "",
      }
    })

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 })
  }
}
