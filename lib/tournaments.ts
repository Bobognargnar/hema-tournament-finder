import type { Tournament, TournamentType, TournamentUpdate } from "@/types/tournament"

interface RawUpdate {
  id: number
  tournament_id: number
  message: string
  created_at: string
}

// Server-side fetch: Fetch all tournaments directly from Supabase (for SSR)
export const fetchTournamentsServer = async (): Promise<Tournament[]> => {
  const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
  const apiKey = process.env.API_KEY

  if (!apiBaseUrl || !apiKey) {
    console.error("API configuration missing for server-side fetch")
    return []
  }

  try {
    // Fetch tournaments and updates in parallel
    const [tournamentsResponse, updatesResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/rest/v1/tournaments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
          "Authorization": `Bearer ${apiKey}`,
        },
        // Revalidate every 60 seconds for ISR
        next: { revalidate: 60 },
      }),
      fetch(`${apiBaseUrl}/rest/v1/tournament_updates?order=created_at.desc`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
          "Authorization": `Bearer ${apiKey}`,
        },
        next: { revalidate: 60 },
      }),
    ])

    if (!tournamentsResponse.ok) {
      console.error("Failed to fetch tournaments (server):", tournamentsResponse.status)
      return []
    }

    const rawTournaments = await tournamentsResponse.json()

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
        latestUpdate: latestUpdatesMap.get(tournamentId) || null,
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
  disciplines: { name: string; type: TournamentType }[]
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

// Fetch tournament IDs owned by the authenticated user
// Returns array of tournament IDs that the user can edit
export const fetchOwnedTournaments = async (token: string): Promise<number[]> => {
  try {
    const response = await fetch("/api/user/owned-tournaments", {
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

    const data = await response.json()
    return data.ownedTournamentIds || []
  } catch (error) {
    console.error("Failed to fetch owned tournaments:", error)
    return []
  }
}

