import { type NextRequest, NextResponse } from "next/server"

interface DisciplineRow {
  name: string
  type: "Male" | "Female" | "Open" | "Other"
}

interface TournamentSubmission {
  name: string
  location: string
  date: string
  disciplines: DisciplineRow[]
  description: string
  registrationLink: string
  venueDetails: string
  contactEmail: string
  rulesLink: string
  coordinates?: [number, number]
  submittedBy?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Decode JWT to extract user_id
    if (!token) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    let userId: string
    let userEmail: string
    try {
      // JWT is base64 encoded: header.payload.signature
      const payloadBase64 = token.split('.')[1]
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'))
      userId = payload.sub
      userEmail = payload.email || ""
      if (!userId) {
        throw new Error("No user ID in token")
      }
    } catch (error) {
      console.error("Failed to decode JWT:", error)
      return NextResponse.json({ success: false, message: "Invalid token format" }, { status: 401 })
    }

    console.log("User submitting tournament:", { userId, userEmail })

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
      submittedBy: userId,
      submittedAt: new Date().toISOString(),
    })

    // Get the API endpoint from environment variables
    const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
    const apiKey = process.env.API_KEY

    if (!apiBaseUrl) {
      console.error("API_BASE_URL not configured")
      return NextResponse.json({ success: false, message: "API configuration error" }, { status: 500 })
    }

    try {
      // Prepare the data for submission
      const submissionData = {
        name: body.name,
        location: body.location,
        date: body.date,
        disciplines: body.disciplines,
        description: body.description,
        registration_link: body.registrationLink,
        venue_details: body.venueDetails,
        contact_email: body.contactEmail,
        rules_link: body.rulesLink,
        // Form sends [lon, lat], database stores as [lat, lon]
        coordinates: body.coordinates ? [body.coordinates[1], body.coordinates[0]] : null,
        user_id: userId,
        submitted_by: body.submittedBy || userEmail,
      }

      // Make fetch POST request to the external API
      const response = await fetch(`${apiBaseUrl}/rest/v1/staged_tournaments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey || "",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          // If response is not JSON, try to get text content
          try {
            const textContent = await response.text()
            if (textContent) {
              errorMessage = `${errorMessage} - ${textContent}`
            }
          } catch (textError) {
            // If we can't read the response at all, use the default error message
            console.error("Could not read error response:", textError)
          }
        }
        throw new Error(errorMessage)
      }

      let responseData
      try {
        const responseText = await response.text()
        if (responseText) {
          responseData = JSON.parse(responseText)
        } else {
          responseData = { success: true }
        }
      } catch (parseError) {
        console.warn("Could not parse response as JSON, treating as success:", parseError)
        responseData = { success: true }
      }

      console.log("Tournament submitted successfully to external API:", responseData)

      return NextResponse.json({
        success: true,
        message: "Tournament submitted successfully! It will be reviewed before being published.",
        submissionId: responseData.id || `submission-${Date.now()}`,
      })
    } catch (error) {
      console.error("Error submitting tournament to external API:", error)

      const errorMessage = error instanceof Error ? error.message : "Failed to submit tournament"
      return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing tournament submission:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
