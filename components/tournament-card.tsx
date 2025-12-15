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

  // Check if tournament start date is in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tournamentDate = new Date(tournament.date)
  const isPast = tournamentDate < today

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

  console.log(tournament)
  console.log("--------------")

  return (
    <div onClick={handleCardClick}>
      <Link href={`/tournaments/${tournament.id}`} passHref>
        <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${isPast ? 'bg-yellow-50 border-yellow-200' : ''}`}>
          <CardContent className="p-4">
            {/* Grid: 4 columns on desktop, 2 on mobile */}
            <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_2fr] gap-3 sm:gap-4">
              {/* Column 1: Logo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                <img
                  src={tournament.logo_url || "/placeholder.svg"}
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

              {/* Column 2: Info (name, location, date) */}
              <div className="min-w-0">
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

                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{tournament.location}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>
                    {formatDate(tournament.date)}
                    {tournament.dateTo && tournament.dateTo !== tournament.date && (
                      <> - {formatDate(tournament.dateTo)}</>
                    )}
                  </span>
                </div>
              </div>

              {/* Column 3: Disciplines - full width on mobile (second row), 2 cols on desktop */}
              <div className="col-span-2 sm:col-span-1 flex flex-wrap gap-1 content-start">
                {(() => {
                  // Group disciplines by name
                  const typeOrder = { Open: 0, Male: 1, Female: 2, Other: 3 }
                  const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
                    Male: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
                    Female: { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8' },
                    Open: { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' },
                    Other: { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
                  }
                  
                  const grouped = tournament.disciplines.reduce((acc, disc) => {
                    if (!acc[disc.name]) {
                      acc[disc.name] = []
                    }
                    if (!acc[disc.name].includes(disc.type)) {
                      acc[disc.name].push(disc.type)
                    }
                    return acc
                  }, {} as Record<string, string[]>)
                  
                  // Sort types within each group
                  Object.keys(grouped).forEach(name => {
                    grouped[name].sort((a, b) => {
                      const orderA = typeOrder[a as keyof typeof typeOrder] ?? 4
                      const orderB = typeOrder[b as keyof typeof typeOrder] ?? 4
                      return orderA - orderB
                    })
                  })
                  
                  // Sort discipline names alphabetically
                  const sortedNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b))
                  
                  return sortedNames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center justify-between text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 min-w-[200px] sm:min-w-[230px]"
                    >
                      <span className="font-bold">{name}</span>
                      <span className="inline-flex items-center gap-1">
                        {grouped[name].map((type) => {
                          const style = typeStyles[type] || typeStyles.Open
                          // Abbreviate Male/Female on mobile
                          const mobileLabel = type === 'Male' ? 'M' : type === 'Female' ? 'F' : type
                          const fullLabel = type
                          return (
                            <span
                              key={type}
                              className="px-1.5 py-0 rounded-full text-[10px] font-medium border text-center"
                              style={{
                                backgroundColor: style.bg,
                                color: style.text,
                                borderColor: style.border,
                              }}
                            >
                              <span className="sm:hidden">{mobileLabel}</span>
                              <span className="hidden sm:inline">{fullLabel}</span>
                            </span>
                          )
                        })}
                      </span>
                    </span>
                  ))
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
