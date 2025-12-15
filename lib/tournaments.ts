import type { Tournament } from "@/types/tournament"

// Server-side fetch: Fetch all tournaments directly from Supabase (for SSR)
export const fetchTournamentsServer = async (): Promise<Tournament[]> => {
  const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
  const apiKey = process.env.API_KEY

  if (!apiBaseUrl || !apiKey) {
    console.error("API configuration missing for server-side fetch")
    return []
  }

  try {
    const response = await fetch(`${apiBaseUrl}/rest/v1/tournaments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
      },
      // Revalidate every 60 seconds for ISR
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      console.error("Failed to fetch tournaments (server):", response.status)
      return []
    }

    const rawTournaments = await response.json()

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
        dateTo: t.date_to || t.date,
        disciplines: t.disciplines,
        image: t.image || "/placeholder.svg",
        logo_url: t.logo_url || null,
        coordinates: coords,
        description: t.description,
        registrationLink: t.registration_link,
        venueDetails: t.venue_details,
        contactEmail: t.contact_email,
        rulesLink: t.rules_link,
      }
    })

    console.log(`[Server] Fetched ${tournaments.length} tournaments`)
    return tournaments
  } catch (error) {
    console.error("Error fetching tournaments (server):", error)
    return []
  }
}

export interface StagedTournament {
  id: number
  name: string
  location: string
  date: string
  dateTo: string
  disciplines: { name: string; type: "Male" | "Female" | "Open" | "Other" }[]
  description: string
  registrationLink: string
  venueDetails: string
  contactEmail: string
  rulesLink: string
  coordinates: [number, number] | null
  createdAt: string
  submittedBy: string
  image: string
  logo_url?: string | null
}

// Fetch all tournaments via server-side API route
export const fetchTournaments = async (): Promise<Tournament[]> => {
  try {
    const response = await fetch("/api/tournaments", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const tournaments: Tournament[] = await response.json()
    return tournaments
  } catch (error) {
    console.error("Failed to fetch tournaments:", error)
    return []
  }
}

// Fetch single tournament by ID via server-side API route
export const fetchTournamentById = async (id: number): Promise<Tournament | undefined> => {
  try {
    const response = await fetch(`/api/tournaments/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return undefined
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const tournament: Tournament = await response.json()
    return tournament
  } catch (error) {
    console.error(`Failed to fetch tournament ${id}:`, error)
    return undefined
  }
}

// Fetch user's staged (user-submitted) tournaments via server-side API route
// Requires auth token to filter by user's own submissions
export const fetchStagedTournaments = async (token: string): Promise<StagedTournament[]> => {
  try {
    const response = await fetch("/api/tournaments/staged", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return []
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const tournaments: StagedTournament[] = await response.json()
    return tournaments
  } catch (error) {
    console.error("Failed to fetch staged tournaments:", error)
    return []
  }
}

