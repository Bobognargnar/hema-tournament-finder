import type { Tournament } from "@/types/tournament"

// Fallback mock data in case the API is not available
const mockTournaments: Tournament[] = [
  {
    id: 1,
    name: "European HEMA Championships",
    location: "Vienna, Austria",
    date: "2025-06-15",
    disciplines: [
      { name: "Longsword", type: "Open" },
      { name: "Rapier", type: "Open" },
      { name: "Longsword", type: "Female" },
    ],
    image: "/placeholder.svg?height=80&width=120",
    coordinates: [16.3738, 48.2082],
    description:
      "The premier HEMA event in Europe, featuring top competitors from across the continent in various weapon categories. Expect high-level fencing and a vibrant community atmosphere.",
    registrationLink: "https://example.com/ehc-register",
    venueDetails: "Messe Wien Exhibition & Congress Center, Messepl. 1, 1020 Wien, Austria",
    contactEmail: "info@ehc.org",
    rulesLink: "https://example.com/ehc-rules",
  },
  {
    id: 2,
    name: "Swordfish Tournament",
    location: "Gothenburg, Sweden",
    date: "2025-07-20",
    disciplines: [
      { name: "Longsword", type: "Open" },
      { name: "Sabre", type: "Male" },
    ],
    image: "/placeholder.svg?height=80&width=120",
    coordinates: [11.9746, 57.7089],
    description:
      "One of the oldest and most prestigious HEMA tournaments globally, known for its challenging format and strong competition. A must-attend for serious practitioners.",
    registrationLink: "https://example.com/swordfish-register",
    venueDetails: "Fencing Hall, Kviberg, Gothenburg, Sweden",
    contactEmail: "contact@swordfish.se",
    rulesLink: "https://example.com/swordfish-rules",
  },
  {
    id: 3,
    name: "Fechtschule America",
    location: "Chicago, USA",
    date: "2025-08-10",
    disciplines: [
      { name: "Longsword", type: "Open" },
      { name: "Dagger", type: "Open" },
      { name: "Messer", type: "Male" },
    ],
    image: "/placeholder.svg?height=80&width=120",
    coordinates: [-87.6298, 41.8781],
    description:
      "A large HEMA event in North America combining a tournament with workshops and seminars from renowned instructors. Great for both competition and learning.",
    registrationLink: "https://example.com/fsa-register",
    venueDetails: "Donald E. Stephens Convention Center, Rosemont, IL, USA",
    contactEmail: "info@fechtschuleamerica.com",
    rulesLink: "https://example.com/fsa-rules",
  },
  {
    id: 4,
    name: "Rapier Masters Cup",
    location: "Florence, Italy",
    date: "2025-09-05",
    disciplines: [
      { name: "Rapier", type: "Open" },
      { name: "Smallsword", type: "Female" },
    ],
    image: "/placeholder.svg?height=80&width=120",
    coordinates: [11.2558, 43.7696],
    description:
      "An exclusive tournament focusing on historical rapier and smallsword fencing. Attracts masters and advanced practitioners of these elegant disciplines.",
    registrationLink: "https://example.com/rmc-register",
    venueDetails: "Palazzo dei Congressi, Piazza Adua, 1, 50123 Firenze FI, Italy",
    contactEmail: "info@rapiermasters.it",
    rulesLink: "https://example.com/rmc-rules",
  },
  {
    id: 5,
    name: "Nordic Steel",
    location: "Oslo, Norway",
    date: "2025-10-12",
    disciplines: [
      { name: "Longsword", type: "Male" },
      { name: "Sword & Buckler", type: "Open" },
    ],
    image: "/placeholder.svg?height=80&width=120",
    coordinates: [10.7522, 59.9139],
    description:
      "A friendly yet competitive tournament in the heart of Scandinavia, offering a great opportunity to test your skills and meet fellow HEMA enthusiasts.",
    registrationLink: "https://example.com/nordicsteel-register",
    venueDetails: "Oslofjord Convention Center, Oslo, Norway",
    contactEmail: "organizers@nordicsteel.no",
    rulesLink: "https://example.com/nordicsteel-rules",
  },
]

export const fetchTournaments = async (): Promise<Tournament[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL

  if (!baseUrl) {
    console.warn("API_BASE_URL not found")
    return []
  }

  try {
    const response = await fetch(`${baseUrl}/rest/v1/tournaments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_API_KEY || '',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const tournaments: Tournament[] = await response.json()
    return tournaments
  } catch (error) {
    console.error('Failed to fetch tournaments from API:', error)
    console.warn('Falling back to mock data')
    return []
  }
}

export const fetchTournamentById = async (id: number): Promise<Tournament | undefined> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL

  if (!baseUrl) {
    console.warn("API_BASE_URL not found")
    return undefined
  }

  try {
    const response = await fetch(`${baseUrl}/rest/v1/tournaments?id=eq.${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_API_KEY || '',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const tournament: Tournament[] = await response.json()
    return tournament[0]
  } catch (error) {
    console.error('Failed to fetch tournaments from API:', error)
    console.warn('Falling back to mock data')
    return undefined
  }
}
