import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Tournament } from "@/types/tournament"

// GET - Fetch single tournament by ID from Supabase
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tournamentId = parseInt(id, 10)

  if (isNaN(tournamentId)) {
    return NextResponse.json({ error: "Invalid tournament ID" }, { status: 400 })
  }

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
    console.log(`Fetching tournament ${tournamentId} from Supabase...`)

    const response = await fetch(`${apiBaseUrl}/rest/v1/tournaments?id=eq.${tournamentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("Failed to fetch tournament:", response.status, errorText)
      return NextResponse.json(
        { error: `Failed to fetch tournament: ${response.status}` },
        { status: response.status }
      )
    }

    const rawTournaments = await response.json()

    if (rawTournaments.length === 0) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    // Transform snake_case to camelCase
    const t = rawTournaments[0] as Record<string, unknown>
    
    // Database stores as [lat, lon], OpenLayers needs [lon, lat]
    const rawCoords = t.coordinates as [number, number] | null
    const coords = rawCoords ? [rawCoords[1], rawCoords[0]] as [number, number] : null
    
    const tournament: Tournament = {
      id: t.id as number,
      name: t.name as string,
      location: t.location as string,
      date: t.date as string,
      dateTo: (t.date_to as string) || (t.date as string), // Default to start date if not set
      disciplines: t.disciplines as Tournament["disciplines"],
      image: (t.image as string) || "/placeholder.svg",
      coordinates: coords as [number, number],
      description: t.description as string,
      registrationLink: t.registration_link as string,
      venueDetails: t.venue_details as string,
      contactEmail: t.contact_email as string,
      rulesLink: t.rules_link as string,
      submittedBy: (t.submitted_by as string) || "",
    }

    console.log(`Fetched tournament: ${tournament.name}`)
    return NextResponse.json(tournament)
  } catch (error) {
    console.error("Error fetching tournament:", error)
    return NextResponse.json({ error: "Failed to fetch tournament" }, { status: 500 })
  }
}
