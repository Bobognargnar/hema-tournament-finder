import { type NextRequest, NextResponse } from "next/server"

interface TournamentSubmission {
  name: string
  location: string
  date: string
  disciplines: string[]
  description: string
  registrationLink: string
  venueDetails: string
  contactEmail: string
  rulesLink: string
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // In a real implementation, you would verify the token here
    // For now, we'll just check if it exists
    if (!token) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    const body: TournamentSubmission = await request.json()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: "Tournament name is required" }, { status: 400 })
    }

    // Log the submission for debugging
    console.log("Tournament submission received:", {
      name: body.name,
      location: body.location,
      date: body.date,
      disciplines: body.disciplines,
      description: body.description?.substring(0, 100) + "...",
      registrationLink: body.registrationLink,
      venueDetails: body.venueDetails?.substring(0, 100) + "...",
      contactEmail: body.contactEmail,
      rulesLink: body.rulesLink,
      submittedBy: "user-from-token", // In real implementation, extract from token
      submittedAt: new Date().toISOString(),
    })

    // Mock successful submission
    // In a real implementation, you would:
    // 1. Save to database
    // 2. Send notification to admins
    // 3. Generate coordinates from location if provided
    // 4. Validate URLs if provided
    // 5. Send confirmation email to submitter

    return NextResponse.json({
      success: true,
      message: "Tournament submitted successfully! It will be reviewed before being published.",
      submissionId: `mock-${Date.now()}`, // Mock submission ID
    })
  } catch (error) {
    console.error("Error processing tournament submission:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
