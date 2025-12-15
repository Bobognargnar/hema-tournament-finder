import { fetchTournamentsServer } from "@/lib/tournaments"
import { TournamentFinderClient } from "@/components/tournament-finder-client"

// Server Component - fetches tournaments at build/request time for SEO
export default async function TournamentFinderPage() {
  // Fetch tournaments on the server
  const initialTournaments = await fetchTournamentsServer()
  
  console.log("app/page.tsx: Server-side fetched", initialTournaments.length, "tournaments")

  // Default to central Europe for an unzoomed world view
  const initialMapCenter: [number, number] = [10, 50] // Longitude, Latitude for central Europe
  const initialMapZoom: number = 4 // A low zoom level for a world view

  return (
    <TournamentFinderClient
      initialTournaments={initialTournaments}
      initialMapCenter={initialMapCenter}
      initialMapZoom={initialMapZoom}
    />
  )
}
