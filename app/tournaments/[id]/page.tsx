"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MapPin, LinkIcon, Mail, BookOpen, Loader2 } from "lucide-react"
import { fetchTournamentById, getTournamentTypeColor } from "@/services/tournament-api"
import type { Tournament, DisciplineDetail } from "@/types/tournament"
import { OpenLayersMap } from "@/components/openlayers-map"
import { useRouter } from "next/navigation"

interface TournamentDetailPageProps {
  params: {
    id: string
  }
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const router = useRouter()
  const tournamentId = Number.parseInt(params.id)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTournament = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchTournamentById(tournamentId)
        if (data) {
          setTournament(data)
        } else {
          setError("Tournament not found.")
        }
      } catch (err) {
        console.error("Failed to fetch tournament:", err)
        setError("Failed to load tournament details.")
      } finally {
        setLoading(false)
      }
    }

    if (!isNaN(tournamentId)) {
      loadTournament()
    } else {
      setLoading(false)
      setError("Invalid tournament ID.")
    }
  }, [tournamentId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleBackClick = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <header className="bg-white shadow-sm border-b mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Tournaments</span>
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Tournament Details</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-lg text-gray-700">Loading tournament details...</span>
          </div>
        )}

        {error && (
          <Card className="border-red-400 bg-red-50 text-red-800">
            <CardContent className="p-6 text-center">
              <p className="font-semibold text-lg mb-2">Error:</p>
              <p>{error}</p>
              <Button onClick={handleBackClick} className="mt-4 bg-transparent" variant="outline">
                Go back to list
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && tournament && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">{tournament.name}</CardTitle>
                <div className="flex items-center gap-2 text-gray-600 text-lg">
                  <MapPin className="w-5 h-5" />
                  <span>{tournament.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-lg">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDate(tournament.date)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {tournament.disciplines.map((discipline: DisciplineDetail, index: number) => (
                    <Badge
                      key={`${discipline.name}-${discipline.type}-${index}`}
                      className={`px-3 py-1 text-base ${getTournamentTypeColor(discipline.type)}`}
                    >
                      {discipline.name} ({discipline.type})
                    </Badge>
                  ))}
                </div>

                <div>
                  <h3 className="font-semibold text-xl mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{tournament.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-xl mb-2">Venue Details</h3>
                  <p className="text-gray-700">{tournament.venueDetails}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournament.registrationLink && (
                    <div>
                      <h3 className="font-semibold text-xl mb-2">Registration</h3>
                      <Button asChild>
                        <a href={tournament.registrationLink} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Register Now
                        </a>
                      </Button>
                    </div>
                  )}
                  {tournament.rulesLink && (
                    <div>
                      <h3 className="font-semibold text-xl mb-2">Rules</h3>
                      <Button asChild variant="outline">
                        <a href={tournament.rulesLink} target="_blank" rel="noopener noreferrer">
                          <BookOpen className="w-4 h-4 mr-2" />
                          View Rules
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {tournament.contactEmail && (
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Contact</h3>
                    <a
                      href={`mailto:${tournament.contactEmail}`}
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Mail className="w-4 h-4" />
                      {tournament.contactEmail}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OpenLayers Map for Tournament Location */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Tournament Location on Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full rounded-lg overflow-hidden">
                  <OpenLayersMap tournaments={[tournament]} initialZoom={12} />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
