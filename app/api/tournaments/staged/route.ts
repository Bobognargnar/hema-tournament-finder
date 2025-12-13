import { type NextRequest, NextResponse } from "next/server"

interface StagedTournament {
  id: number
  name: string
  location: string
  date: string
  disciplines: { name: string; type: "Male" | "Female" | "Open" }[]
  description: string
  registration_link: string
  venue_details: string
  contact_email: string
  rules_link: string
  coordinates: [number, number] | null
  created_at: string
  submitted_by: string
}

// GET - Fetch user's staged tournaments from Supabase (requires auth)
export async function GET(request: NextRequest) {
  // Get the authorization header from the client request
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const userToken = authHeader.substring(7)
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
    const url = `${apiBaseUrl}/rest/v1/staged_tournaments`
    console.log("Fetching staged tournaments from URL:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": apiKey,
        "Accept": "application/json",
        "Authorization": `Bearer ${userToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("Failed to fetch staged tournaments:", response.status, errorText)
      return NextResponse.json(
        { error: `Failed to fetch staged tournaments: ${response.status}` },
        { status: response.status }
      )
    }

    const responseText = await response.text()
    console.log("Raw Supabase response:", responseText)
    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))
    
    const stagedTournaments: StagedTournament[] = responseText ? JSON.parse(responseText) : []
    console.log(`Parsed ${stagedTournaments.length} staged tournaments`)

    // Transform to match frontend format
    const transformed = stagedTournaments.map((t) => ({
      id: t.id,
      name: t.name,
      location: t.location || "",
      date: t.date || "",
      disciplines: t.disciplines || [],
      description: t.description || "",
      registrationLink: t.registration_link || "",
      venueDetails: t.venue_details || "",
      contactEmail: t.contact_email || "",
      rulesLink: t.rules_link || "",
      coordinates: t.coordinates,
      createdAt: t.created_at,
      submittedBy: t.submitted_by || "",
      image: "/placeholder.svg",
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("Error fetching staged tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch staged tournaments" }, { status: 500 })
  }
}
