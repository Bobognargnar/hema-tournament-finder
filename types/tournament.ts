// Centralized tournament type definitions
export type TournamentType = "Men" | "Women" | "Open" | "Women+" | "Beginner" | "Other" | "Invitational"

export interface DisciplineDetail {
  name: string
  type: TournamentType
}

// Type order for sorting disciplines in UI
export const TOURNAMENT_TYPE_ORDER: Record<TournamentType, number> = {
  Open: 0,
  Men: 1,
  Women: 2,
  "Women+": 3,
  Beginner: 4,
  Invitational: 5,
  Other: 6,
}

// Style definitions for tournament type badges
export const TOURNAMENT_TYPE_STYLES: Record<TournamentType, { bg: string; text: string; border: string }> = {
  Men: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  Women: { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8' },
  "Women+": { bg: '#fdf2f8', text: '#be185d', border: '#f9a8d4' },
  Open: { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' },
  Beginner: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  Invitational: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  Other: { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
}

export interface TournamentUpdate {
  id: number
  message: string
  created_at: string
}

export interface Tournament {
  id: number
  name: string
  location: string
  date: string // Start date
  dateTo: string // End date
  disciplines: DisciplineDetail[] // Changed to array of DisciplineDetail objects
  image: string
  logo_url?: string | null
  coordinates: [number, number]
  description: string
  registrationLink: string
  venueDetails: string
  contactEmail: string
  rulesLink: string
  latestUpdate?: TournamentUpdate | null // Latest update for this tournament
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
