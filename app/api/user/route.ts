import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // In a real application, you would verify the JWT token from the request
  // and fetch user-specific data from a database.
  // For this mock, we return static user data.

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  return NextResponse.json(
    {
      success: true,
      user: {
        name: "Mock User", // Stubbed user name
        favouriteTournamentIds: [1, 3], // Stubbed favourite tournament IDs
      },
    },
    { status: 200 },
  )
}
