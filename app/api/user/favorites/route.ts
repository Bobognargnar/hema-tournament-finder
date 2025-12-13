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

// GET - Fetch user's favorites
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
    // Fetch favorites from Supabase - format: ?user_id=eq.<UUID>&select=tournament
    const url = `${apiBaseUrl}/rest/v1/user_favourites?user_id=eq.${userId}&select=tournament`
    console.log("Fetching favorites from URL:", url)

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
      console.error("Failed to fetch favorites:", response.status, errorText)
      throw new Error(`Failed to fetch favorites: ${response.status}`)
    }

    const favorites = await response.json()
    const favouriteTournamentIds = favorites.map((f: { tournament: number }) => f.tournament)

    console.log(`Fetched ${favouriteTournamentIds.length} favorites for user ${userId}`)

    return NextResponse.json(
      {
        success: true,
        user: {
          name: "User",
          favouriteTournamentIds: favouriteTournamentIds,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch favorites." }, { status: 500 })
  }
}

// POST - Add or remove a favorite
export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]

  if (!token) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 })
  }

  const userId = getUserIdFromToken(token)
  if (!userId) {
    return NextResponse.json({ success: false, message: "Invalid token." }, { status: 401 })
  }

  const { tournamentId, action } = await request.json()

  if (!tournamentId || !action) {
    return NextResponse.json({ success: false, message: "Tournament ID and action are required." }, { status: 400 })
  }

  if (action !== "add" && action !== "remove") {
    return NextResponse.json({ success: false, message: "Invalid action. Use 'add' or 'remove'." }, { status: 400 })
  }

  const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
  const apiKey = process.env.API_KEY

  if (!apiBaseUrl || !apiKey) {
    console.error("API configuration missing")
    return NextResponse.json({ success: false, message: "API configuration error." }, { status: 500 })
  }

  try {
    if (action === "add") {
      // Insert new favorite
      const response = await fetch(`${apiBaseUrl}/rest/v1/user_favourites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
          "Authorization": `Bearer ${token}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          user_id: userId,
          tournament: tournamentId,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error("Failed to add favorite:", response.status, errorText)

        // Check if it's a duplicate error (already favorited)
        if (response.status === 409 || errorText.includes("duplicate")) {
          return NextResponse.json({ success: false, message: "Tournament already in favorites." }, { status: 409 })
        }
        throw new Error(`Failed to add favorite: ${response.status}`)
      }

      console.log(`User ${userId} added tournament ${tournamentId} to favorites`)

    } else if (action === "remove") {
      // Delete favorite - format: ?user_id=eq.<UUID>&tournament=eq.<ID>
      const deleteUrl = `${apiBaseUrl}/rest/v1/user_favourites?user_id=eq.${userId}&tournament=eq.${tournamentId}`
      console.log("Deleting favorite at URL:", deleteUrl)

      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error("Failed to remove favorite:", response.status, errorText)
        throw new Error(`Failed to remove favorite: ${response.status}`)
      }

      console.log(`User ${userId} removed tournament ${tournamentId} from favorites`)
    }

    // Fetch updated favorites list
    const fetchUrl = `${apiBaseUrl}/rest/v1/user_favourites?user_id=eq.${userId}&select=tournament`

    const favoritesResponse = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${token}`,
      },
    })

    let favouriteTournamentIds: number[] = []
    if (favoritesResponse.ok) {
      const favorites = await favoritesResponse.json()
      favouriteTournamentIds = favorites.map((f: { tournament: number }) => f.tournament)
    }

    return NextResponse.json(
      {
        success: true,
        message: `Tournament ${tournamentId} ${action === "add" ? "added to" : "removed from"} favorites.`,
        favouriteTournamentIds: favouriteTournamentIds,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Error updating favorites:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update favorites."
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
  }
}
