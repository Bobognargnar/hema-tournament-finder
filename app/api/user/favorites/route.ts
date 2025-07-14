import { NextResponse } from "next/server"

// In a real application, this would interact with a database
// and verify the JWT token to get the actual user's favorites.
// For this mock, we'll maintain a simple in-memory state per "user"
// (though it's not truly multi-user persistent without a real backend).

// Mock user data store (in a real app, this would be a database)
const mockUserFavorites: { [key: string]: number[] } = {
  mock_user_id: [1, 3], // Default favorites for our mock user
}

export async function POST(request: Request) {
  const { tournamentId, action } = await request.json()
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]

  // Simulate token validation (in a real app, you'd decode and verify the JWT)
  if (!token) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 })
  }

  // For this mock, we'll just use a fixed user ID
  const userId = "mock_user_id"
  let currentFavorites = mockUserFavorites[userId] || []

  if (action === "add") {
    if (!currentFavorites.includes(tournamentId)) {
      currentFavorites.push(tournamentId)
    }
  } else if (action === "remove") {
    currentFavorites = currentFavorites.filter((id) => id !== tournamentId)
  } else {
    return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 })
  }

  mockUserFavorites[userId] = currentFavorites // Update mock store

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  return NextResponse.json(
    {
      success: true,
      message: `Tournament ${tournamentId} ${action === "add" ? "added to" : "removed from"} favorites.`,
      favouriteTournamentIds: currentFavorites, // Return updated list
    },
    { status: 200 },
  )
}

// Also provide a GET endpoint for fetching initial user favorites
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.split(" ")[1]

  if (!token) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 })
  }

  const userId = "mock_user_id"
  const currentFavorites = mockUserFavorites[userId] || []

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  return NextResponse.json(
    {
      success: true,
      user: {
        name: "Mock User",
        favouriteTournamentIds: currentFavorites,
      },
    },
    { status: 200 },
  )
}
