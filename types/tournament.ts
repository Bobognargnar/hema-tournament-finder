export type TournamentType = "Male" | "Female" | "Open" | "Other"

export interface DisciplineDetail {
  name: string
  type: TournamentType
}

export interface Tournament {
  id: number
  name: string
  location: string
  date: string // Start date
  dateTo: string // End date
  disciplines: DisciplineDetail[] // Changed to array of DisciplineDetail objects
  image: string
  coordinates: [number, number]
  description: string
  registrationLink: string
  venueDetails: string
  contactEmail: string
  rulesLink: string
  submittedBy?: string
}

export interface TournamentFilters {
  startDate: string
  endDate: string
  disciplines: string[] // Still stores just the names of selected disciplines for the filter UI
  selectedTypes: TournamentType[] // New filter for tournament types
  showFavorites: boolean // New filter for favorite tournaments
}

export interface LoginForm {
  email: string
  password: string
}
