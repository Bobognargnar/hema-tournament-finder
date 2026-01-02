import { NextResponse } from "next/server"

// Helper function to decode JWT and extract user ID
function getUserIdFromToken(token: string): string | null {
  try {
    // JWT tokens are base64 encoded: header.payload.signature
    const payload = token.split('.')[1]
    const decodedPayload = JSON.parse(atob(payload))
    return decodedPayload.sub || null // 'sub' contains the user ID in Supabase JWTs
  } catch (error) {
    console.error("Failed to decode token:", error)
    return null
  }
}

// GET - Fetch tournament IDs owned by the authenticated user
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]

  if (!token) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 })
  }

  const userId = getUserIdFromToken(token)
  if (!userId) {
    return NextResponse.json({ success: false, message: "Invalid token." }, { status: 401 })
  }

  const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
  const apiKey = process.env.API_KEY

  if (!apiBaseUrl || !apiKey) {
    console.error("API configuration missing")
    return NextResponse.json({ success: false, message: "API configuration error." }, { status: 500 })
  }

  try {
    // Fetch owned tournaments from Supabase tournament_owners table
    const url = `${apiBaseUrl}/rest/v1/tournament_owners?user_id=eq.${userId}&select=tournament_id`
    console.log("Fetching owned tournaments from URL:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("Failed to fetch owned tournaments:", response.status, errorText)
      throw new Error(`Failed to fetch owned tournaments: ${response.status}`)
    }

    const ownedTournaments = await response.json()
    const ownedTournamentIds = ownedTournaments.map((o: { tournament_id: number }) => o.tournament_id)

    console.log(`Fetched ${ownedTournamentIds.length} owned tournaments for user ${userId}`)

    return NextResponse.json(
      {
        success: true,
        ownedTournamentIds: ownedTournamentIds,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching owned tournaments:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch owned tournaments." }, { status: 500 })
  }
}

