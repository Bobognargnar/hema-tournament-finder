import type { Tournament } from "@/types/tournament"

export interface StagedTournament {
  id: number
  name: string
  location: string
  date: string
  disciplines: { name: string; type: "Male" | "Female" | "Open" }[]
  description: string
  registrationLink: string
  venueDetails: string
  contactEmail: string
  rulesLink: string
  coordinates: [number, number] | null
  createdAt: string
  submittedBy: string
  image: string
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
    console.log("Fetched tournaments count:", tournaments.length)
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
        console.log("User not authenticated for staged tournaments")
        return []
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const tournaments: StagedTournament[] = await response.json()
    console.log("Fetched staged tournaments count:", tournaments.length)
    return tournaments
  } catch (error) {
    console.error("Failed to fetch staged tournaments:", error)
    return []
  }
}
