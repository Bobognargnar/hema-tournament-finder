import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Tournament } from "@/types/tournament"

// Helper function to decode JWT and extract user ID and admin status
function decodeToken(token: string): { userId: string | null; isAdmin: boolean } {
  try {
    const payload = token.split('.')[1]
    const decodedPayload = JSON.parse(atob(payload))
    return {
      userId: decodedPayload.sub || null,
      isAdmin: decodedPayload.app_metadata?.role === "admin" || false,
    }
  } catch (error) {
    console.error("Failed to decode token:", error)
    return { userId: null, isAdmin: false }
  }
}

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
      logo_url: (t.logo_url as string) || null,
      coordinates: coords as [number, number],
      description: t.description as string,
      registrationLink: t.registration_link as string,
      venueDetails: t.venue_details as string,
      contactEmail: t.contact_email as string,
      rulesLink: t.rules_link as string,
    }

    console.log(`Fetched tournament: ${tournament.name}`)
    return NextResponse.json(tournament)
  } catch (error) {
    console.error("Error fetching tournament:", error)
    return NextResponse.json({ error: "Failed to fetch tournament" }, { status: 500 })
  }
}

// PATCH - Update tournament (requires authentication and ownership/admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tournamentId = parseInt(id, 10)

  if (isNaN(tournamentId)) {
    return NextResponse.json({ error: "Invalid tournament ID" }, { status: 400 })
  }

  // Check authentication
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]

  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const { userId, isAdmin } = decodeToken(token)
  if (!userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
  const apiKey = process.env.API_KEY

  if (!apiBaseUrl || !apiKey) {
    console.error("API configuration missing")
    return NextResponse.json({ error: "API configuration error" }, { status: 500 })
  }

  try {
    // Check if user owns this tournament (unless admin)
    if (!isAdmin) {
      const ownershipUrl = `${apiBaseUrl}/rest/v1/tournament_owners?user_id=eq.${userId}&tournament_id=eq.${tournamentId}`
      const ownershipResponse = await fetch(ownershipUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!ownershipResponse.ok) {
        console.error("Failed to check ownership:", ownershipResponse.status)
        return NextResponse.json({ error: "Failed to verify ownership" }, { status: 500 })
      }

      const ownershipData = await ownershipResponse.json()
      if (ownershipData.length === 0) {
        return NextResponse.json({ error: "You do not have permission to edit this tournament" }, { status: 403 })
      }
    }

    // Parse request body
    const body = await request.json()
    const { location, coordinates, description, venueDetails, rulesLink, contactEmail, disciplines } = body

    // Build update object (only include fields that are provided)
    const updateData: Record<string, unknown> = {}
    
    if (location !== undefined) {
      updateData.location = location
    }
    
    if (coordinates !== undefined && Array.isArray(coordinates) && coordinates.length === 2) {
      // Frontend sends [lon, lat], database expects [lat, lon]
      updateData.coordinates = [coordinates[1], coordinates[0]]
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (venueDetails !== undefined) {
      updateData.venue_details = venueDetails
    }

    if (rulesLink !== undefined) {
      updateData.rules_link = rulesLink
    }

    if (contactEmail !== undefined) {
      updateData.contact_email = contactEmail
    }

    if (disciplines !== undefined && Array.isArray(disciplines)) {
      updateData.disciplines = disciplines
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Update tournament in Supabase - use user's token for RLS policies
    const updateUrl = `${apiBaseUrl}/rest/v1/tournaments?id=eq.${tournamentId}`
    const updateResponse = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${token}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(updateData),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text().catch(() => "")
      console.error("Failed to update tournament:", updateResponse.status, errorText)
      return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 })
    }

    console.log(`Tournament ${tournamentId} updated successfully`)
    return NextResponse.json({ success: true, message: "Tournament updated successfully" })
  } catch (error) {
    console.error("Error updating tournament:", error)
    return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 })
  }
}
