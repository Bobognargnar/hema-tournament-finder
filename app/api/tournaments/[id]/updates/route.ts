import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export interface TournamentUpdate {
  id: number
  tournament_id: number
  message: string
  created_at: string
}

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

// GET - Fetch updates for a specific tournament
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

  if (!apiBaseUrl || !apiKey) {
    console.error("API configuration missing")
    return NextResponse.json({ error: "API configuration error" }, { status: 500 })
  }

  try {
    // Fetch updates from Supabase, ordered by created_at descending (newest first)
    const url = `${apiBaseUrl}/rest/v1/tournament_updates?tournament_id=eq.${tournamentId}&order=created_at.desc`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("Failed to fetch tournament updates:", response.status, errorText)
      return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 })
    }

    const updates: TournamentUpdate[] = await response.json()
    
    console.log(`Fetched ${updates.length} updates for tournament ${tournamentId}`)
    return NextResponse.json(updates)
  } catch (error) {
    console.error("Error fetching tournament updates:", error)
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 })
  }
}

// POST - Create a new update for a tournament (requires ownership or admin)
export async function POST(
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
        return NextResponse.json({ error: "You do not have permission to add updates to this tournament" }, { status: 403 })
      }
    }

    // Parse request body
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Insert new update - use user's token for Supabase RLS policies
    const insertUrl = `${apiBaseUrl}/rest/v1/tournament_updates`
    const insertResponse = await fetch(insertUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${token}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        tournament_id: tournamentId,
        message: message.trim(),
      }),
    })

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text().catch(() => "")
      console.error("Failed to create update:", insertResponse.status, errorText)
      return NextResponse.json({ error: "Failed to create update" }, { status: 500 })
    }

    const newUpdate = await insertResponse.json()
    console.log(`Created new update for tournament ${tournamentId}`)
    return NextResponse.json({ success: true, update: newUpdate[0] })
  } catch (error) {
    console.error("Error creating tournament update:", error)
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 })
  }
}

