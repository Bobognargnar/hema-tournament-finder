"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, MapPin, LinkIcon, Mail, BookOpen, Loader2, X } from "lucide-react"
import { fetchTournamentById } from "@/lib/tournaments"
import type { Tournament, DisciplineDetail } from "@/types/tournament"
import { OpenLayersMap } from "@/components/OpenLayersMap"
import { useRouter } from "next/navigation"

interface TournamentDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const tournamentId = Number.parseInt(resolvedParams.id)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)

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

  // Ensure URL has a protocol prefix
  const formatUrl = (url: string) => {
    if (!url) return url
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }
    return `https://${url}`
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
                <div className="flex items-start gap-4">
                  {tournament.logo_url && (
                    <img
                      src={tournament.logo_url}
                      alt={`${tournament.name} logo`}
                      className="w-60 h-60 object-contain rounded-md bg-gray-100 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setShowImageModal(true)}
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold">{tournament.name}</CardTitle>
                    <div className="flex items-center gap-2 text-gray-600 text-lg mt-2">
                      <MapPin className="w-5 h-5" />
                      <span>{tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-lg">
                      <Calendar className="w-5 h-5" />
                      <span>
                        {formatDate(tournament.date)}
                        {tournament.dateTo && tournament.dateTo !== tournament.date && (
                          <> - {formatDate(tournament.dateTo)}</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {tournament.disciplines && tournament.disciplines.length > 0 ? (
                    [...tournament.disciplines]
                      .sort((a, b) => {
                        // Sort by type order: Open, Male, Female, Other
                        const typeOrder = { Open: 0, Male: 1, Female: 2, Other: 3 }
                        const typeA = typeOrder[a.type as keyof typeof typeOrder] ?? 4
                        const typeB = typeOrder[b.type as keyof typeof typeOrder] ?? 4
                        if (typeA !== typeB) return typeA - typeB
                        // Within same type, sort alphabetically by name
                        return a.name.localeCompare(b.name)
                      })
                      .map((discipline: DisciplineDetail, index: number) => {
                        const colorStyle = {
                          Male: { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' },
                          Female: { backgroundColor: '#fce7f3', color: '#9d174d', borderColor: '#fbcfe8' },
                          Open: { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#e5e7eb' },
                          Other: { backgroundColor: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff' },
                        }[discipline.type] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#e5e7eb' }
                        
                        return (
                          <span
                            key={`${discipline.name}-${discipline.type}-${index}`}
                            className="px-3 py-1 text-base rounded-full border"
                            style={colorStyle}
                          >
                            {discipline.name} ({discipline.type})
                          </span>
                        )
                      })
                  ) : (
                    <p className="text-gray-500 italic">No disciplines listed for this tournament.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-xl mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{tournament.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-xl mb-2">Venue Details</h3>
                  <p className="text-gray-700">{tournament.venueDetails}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      Official Website
                    </h3>
                    {tournament.registrationLink ? (
                      <Button asChild>
                        <a href={formatUrl(tournament.registrationLink)} target="_blank" rel="noopener noreferrer">
                          Go to site
                        </a>
                      </Button>
                    ) : (
                      <p className="text-gray-500 italic">Unavailable</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Contact Email
                    </h3>
                    {tournament.contactEmail ? (
                      <a
                        href={`mailto:${tournament.contactEmail}`}
                        className="text-blue-600 hover:underline"
                      >
                        {tournament.contactEmail}
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">Unavailable</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Rules
                    </h3>
                    {tournament.rulesLink ? (
                      <Button asChild variant="outline">
                        <a href={formatUrl(tournament.rulesLink)} target="_blank" rel="noopener noreferrer">
                          Go to site
                        </a>
                      </Button>
                    ) : (
                      <p className="text-gray-500 italic">Unavailable</p>
                    )}
                  </div>
                </div>
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

            {/* Image Modal */}
            {showImageModal && tournament.logo_url && (
              <div 
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={() => setShowImageModal(false)}
              >
                <div className="relative max-w-3xl max-h-[90vh]">
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                    aria-label="Close image"
                  >
                    <X className="w-8 h-8" />
                  </button>
                  <img
                    src={tournament.logo_url}
                    alt={`${tournament.name} logo`}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
