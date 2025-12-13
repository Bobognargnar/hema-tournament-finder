"use client"
import { fetchTournaments } from "@/lib/tournaments"
import { TournamentFinderClient } from "@/components/tournament-finder-client"
import { useEffect, useState } from "react" // Import useEffect and useState

interface UserData {
  name: string
  favouriteTournamentIds: number[]
}

export default function TournamentFinderPage() {
  const [initialTournaments, setInitialTournaments] = useState([])
  const [loadingTournaments, setLoadingTournaments] = useState(true)

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const data = await fetchTournaments()
        setInitialTournaments(data)
        console.log("app/page.tsx: Initial tournaments fetched:", data.length, "tournaments")
      } catch (error) {
        console.error("app/page.tsx: Error fetching initial tournaments:", error)
      } finally {
        setLoadingTournaments(false)
      }
    }
    loadTournaments()
  }, [])

  // Default to central Europe for an unzoomed world view
  const initialMapCenter: [number, number] = [10, 54] // Longitude, Latitude for central Europe
  const initialMapZoom: number = 3 // A low zoom level for a world view

  console.log(
    "app/page.tsx: Rendering TournamentFinderClient with initialMapCenter:",
    initialMapCenter,
    "and initialMapZoom:",
    initialMapZoom,
  )

  if (loadingTournaments) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading initial tournament data...</p>
      </div>
    )
  }

  return (
    <TournamentFinderClient
      initialTournaments={initialTournaments}
      initialMapCenter={initialMapCenter}
      initialMapZoom={initialMapZoom}
    />
  )
}
