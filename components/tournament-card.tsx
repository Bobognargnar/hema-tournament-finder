"use client"

import type React from "react"
import { useState } from "react"
import type { Tournament, DisciplineDetail } from "@/types/tournament"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Star } from "lucide-react"
import Link from "next/link"

interface TournamentCardProps {
  tournament: Tournament
  isFavorite: boolean
  onToggleFavorite: (tournamentId: number) => void
}

export default function TournamentCard({ tournament, isFavorite, onToggleFavorite }: TournamentCardProps) {
  const [showAuthPrompt, setShowAuthPrompt] = useState(false) // This state is not used in this component, but kept for consistency with previous versions.

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite(tournament.id)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if the click wasn't on the star button
    const target = e.target as HTMLElement
    if (target.closest('button[aria-label*="favorite"]')) {
      e.preventDefault()
      return
    }
  }

  return (
    <div onClick={handleCardClick}>
      <Link href={`/tournaments/${tournament.id}`} passHref>
        <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="w-24 h-20 flex-shrink-0">
                <img
                  src={tournament.image || "/placeholder.svg"}
                  alt={tournament.name}
                  className="w-full h-full object-cover rounded-md bg-gray-100"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    target.nextElementSibling?.classList.remove("hidden")
                  }}
                />
                <div className="hidden w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-sm truncate pr-2">{tournament.name}</h3>
                  <button
                    onClick={handleStarClick}
                    className="flex-shrink-0 p-1 -mt-1 -mr-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    type="button"
                  >
                    <Star
                      className={`w-4 h-4 transition-colors duration-200 ${
                        isFavorite ? "text-yellow-500 fill-yellow-500" : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{tournament.location}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDate(tournament.date)}
                    {tournament.dateTo && tournament.dateTo !== tournament.date && (
                      <> - {formatDate(tournament.dateTo)}</>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {tournament.disciplines.map((discipline: DisciplineDetail, index: number) => {
                    const colorStyle = {
                      Male: { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' },
                      Female: { backgroundColor: '#fce7f3', color: '#9d174d', borderColor: '#fbcfe8' },
                      Open: { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#e5e7eb' },
                      Other: { backgroundColor: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff' },
                    }[discipline.type] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#e5e7eb' }
                    
                    return (
                      <span
                        key={`${discipline.name}-${discipline.type}-${index}`}
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={colorStyle}
                      >
                        {discipline.name} ({discipline.type})
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
