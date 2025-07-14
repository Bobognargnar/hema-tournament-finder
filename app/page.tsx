"use client"
import { fetchTournaments } from "@/api/tournaments" // Updated import path
import { TournamentFinderClient } from "@/components/tournament-finder-client"

interface UserData {
  name: string
  favouriteTournamentIds: number[]
}

export default async function TournamentFinderPage() {
  // Fetch initial tournaments data on the server
  const initialTournaments = await fetchTournaments()

  // Default to central Europe for an unzoomed world view
  const initialMapCenter: [number, number] = [10, 54] // Longitude, Latitude for central Europe
  const initialMapZoom: number = 3 // A low zoom level for a world view

  return (
    <TournamentFinderClient
      initialTournaments={initialTournaments}
      initialMapCenter={initialMapCenter}
      initialMapZoom={initialMapZoom} // Pass the initial zoom
    />
  )
}

// TournamentFinder component moved to TournamentFinderClient.tsx
