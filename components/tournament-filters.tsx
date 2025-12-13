"use client"

import type { TournamentFilters, TournamentType } from "@/types/tournament"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch" // Import Switch component
import { X, CalendarDays, Swords, Tag, Star } from "lucide-react" // Import Star icon

interface TournamentFiltersProps {
  filters: TournamentFilters
  onFiltersChange: (filters: TournamentFilters) => void
  disciplineOptions: string[]
  tournamentTypeOptions: TournamentType[]
}

export function TournamentFiltersComponent({
  filters,
  onFiltersChange,
  disciplineOptions,
  tournamentTypeOptions,
}: TournamentFiltersProps) {
  const handleDisciplineToggle = (disciplineName: string) => {
    const newDisciplines = filters.disciplines.includes(disciplineName)
      ? filters.disciplines.filter((d) => d !== disciplineName)
      : [...filters.disciplines, disciplineName]

    onFiltersChange({
      ...filters,
      disciplines: newDisciplines,
    })
  }

  const handleTypeToggle = (type: TournamentType) => {
    const newTypes = filters.selectedTypes.includes(type)
      ? filters.selectedTypes.filter((t) => t !== type)
      : [...filters.selectedTypes, type]

    onFiltersChange({
      ...filters,
      selectedTypes: newTypes,
    })
  }

  const handleShowFavoritesToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      showFavorites: checked,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      startDate: "",
      endDate: "",
      disciplines: [],
      selectedTypes: [],
      showFavorites: false, // Reset favorite filter
    })
  }

  return (
    <div className="space-y-4">
      {/* Date Range Filter Card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="w-4 h-4" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start-date" className="text-xs">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    startDate: e.target.value,
                  })
                }
                className="text-xs"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    endDate: e.target.value,
                  })
                }
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Disciplines Filter Card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Swords className="w-4 h-4" />
            Disciplines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {disciplineOptions.map((disciplineName) => (
              <Badge
                key={disciplineName}
                variant={filters.disciplines.includes(disciplineName) ? "default" : "outline"}
                className="cursor-pointer text-xs px-2 py-1"
                onClick={() => handleDisciplineToggle(disciplineName)}
              >
                {disciplineName}
                {filters.disciplines.includes(disciplineName) && <X className="w-3 h-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Tournament Type Filter Card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="w-4 h-4" />
            Tournament Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tournamentTypeOptions.map((type) => (
              <Badge
                key={type}
                variant={filters.selectedTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer text-xs px-2 py-1"
                onClick={() => handleTypeToggle(type)}
              >
                {type}
                {filters.selectedTypes.includes(type) && <X className="w-3 h-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Favorites Filter Card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="w-4 h-4" />
            Favorites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <Label
              htmlFor="show-favorites"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show only my favorite tournaments
            </Label>
            <Switch id="show-favorites" checked={filters.showFavorites} onCheckedChange={handleShowFavoritesToggle} />
          </div>
        </CardContent>
      </Card>
      {/* Clear All Filters Button - moved outside individual cards */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
          Clear All Filters
        </Button>
      </div>
    </div>
  )
}
