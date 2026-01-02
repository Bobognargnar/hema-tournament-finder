import { NextResponse } from "next/server"
import type { Tournament, TournamentUpdate } from "@/types/tournament"

interface RawUpdate {
  id: number
  tournament_id: number
  message: string
  created_at: string
}

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
    
    // Fetch tournaments and updates in parallel
    const [tournamentsResponse, updatesResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/rest/v1/tournaments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
          "Authorization": `Bearer ${apiKey}`,
        },
      }),
      fetch(`${apiBaseUrl}/rest/v1/tournament_updates?order=created_at.desc`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
          "Authorization": `Bearer ${apiKey}`,
        },
      }),
    ])

    if (!tournamentsResponse.ok) {
      const errorText = await tournamentsResponse.text().catch(() => "")
      console.error("Failed to fetch tournaments:", tournamentsResponse.status, errorText)
      return NextResponse.json(
        { error: `Failed to fetch tournaments: ${tournamentsResponse.status}` },
        { status: tournamentsResponse.status }
      )
    }

    const rawTournaments = await tournamentsResponse.json()
    console.log(`Fetched ${rawTournaments.length} tournaments from Supabase`)

    // Process updates - create a map of tournament_id to latest update
    let latestUpdatesMap: Map<number, TournamentUpdate> = new Map()
    if (updatesResponse.ok) {
      const rawUpdates: RawUpdate[] = await updatesResponse.json()
      // Since updates are ordered by created_at desc, the first one for each tournament is the latest
      for (const update of rawUpdates) {
        if (!latestUpdatesMap.has(update.tournament_id)) {
          latestUpdatesMap.set(update.tournament_id, {
            id: update.id,
            message: update.message,
            created_at: update.created_at,
          })
        }
      }
      console.log(`Fetched updates for ${latestUpdatesMap.size} tournaments`)
    }

    // Transform snake_case to camelCase
    const tournaments: Tournament[] = rawTournaments.map((t: Record<string, unknown>) => {
      // Database stores as [lat, lon], OpenLayers needs [lon, lat]
      const rawCoords = t.coordinates as [number, number] | null
      const coords = rawCoords ? [rawCoords[1], rawCoords[0]] as [number, number] : null
      const tournamentId = t.id as number
      
      return {
        id: tournamentId,
        name: t.name,
        location: t.location,
        date: t.date,
        dateTo: t.date_to || t.date, // Default to start date if not set
        disciplines: t.disciplines,
        image: t.image || "/placeholder.svg",
        logo_url: t.logo_url || null,
        coordinates: coords,
        description: t.description,
        registrationLink: t.registration_link,
        venueDetails: t.venue_details,
        contactEmail: t.contact_email,
        rulesLink: t.rules_link,
        latestUpdate: latestUpdatesMap.get(tournamentId) || null,
      }
    })

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 })
  }
}
