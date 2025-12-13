import type { Tournament } from "@/types/tournament"

export const fetchTournaments = async (): Promise<Tournament[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL

  if (!baseUrl) {
    console.warn("API_BASE_URL not found")
    return []
  }

  try {
    const response = await fetch(`${baseUrl}/rest/v1/tournaments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.API_KEY || "",
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const tournaments: Tournament[] = await response.json()
    return tournaments
  } catch (error) {
    console.error("Failed to fetch tournaments from API:", error)
    console.warn("Falling back to mock data")
    return []
  }
}

export const fetchTournamentById = async (id: number): Promise<Tournament | undefined> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL

  if (!baseUrl) {
    console.warn("API_BASE_URL not found")
    return undefined
  }

  try {
    const response = await fetch(`${baseUrl}/rest/v1/tournaments?id=eq.${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.API_KEY || "",
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const tournament: Tournament[] = await response.json()
    return tournament[0]
  } catch (error) {
    console.error("Failed to fetch tournaments from API:", error)
    console.warn("Falling back to mock data")
    return undefined
  }
}
