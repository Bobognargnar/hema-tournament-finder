import { type NextRequest, NextResponse } from "next/server"
import type { TournamentType } from "@/types/tournament"

interface StagedTournament {
  id: number
  user_id?: string
  created_at?: string
  name: string
  location: string
  date: string
  disciplines: { name: string; type: TournamentType }[]
  description: string
  registration_link: string
  venue_details: string
  contact_email: string
  rules_link: string
  coordinates: [number, number] | null
  [key: string]: unknown // Allow additional fields
}

// POST - Approve a staged tournament (admin only)
// Moves tournament from staged_tournaments to tournaments table
export async function POST(request: NextRequest) {
  // Get the authorization header
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const userToken = authHeader.substring(7)

  // Decode JWT to check admin role
  let isAdmin = false
  try {
    const payloadBase64 = userToken.split('.')[1]
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'))
    isAdmin = payload.app_metadata?.role === "admin"
  } catch (error) {
    console.error("Failed to decode JWT:", error)
    return NextResponse.json({ error: "Invalid token format" }, { status: 401 })
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
  const apiKey = process.env.API_KEY

  if (!apiBaseUrl || !apiKey) {
    console.error("API configuration missing")
    return NextResponse.json({ error: "API configuration error" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { tournamentId } = body

    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 })
    }

    // Step 1: Fetch the staged tournament
    const fetchUrl = `${apiBaseUrl}/rest/v1/staged_tournaments?id=eq.${tournamentId}`
    const fetchResponse = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        "apikey": apiKey,
        "Accept": "application/json",
        "Authorization": `Bearer ${userToken}`,
      },
    })

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text()
      console.error("Failed to fetch staged tournament:", fetchResponse.status, errorText)
      return NextResponse.json({ error: "Failed to fetch staged tournament" }, { status: fetchResponse.status })
    }

    const stagedTournaments: StagedTournament[] = await fetchResponse.json()
    
    if (stagedTournaments.length === 0) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    const staged = stagedTournaments[0]

    // Step 2: Insert into tournaments table - copy all fields except id, user_id, submitted_by, created_at
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, user_id, submitted_by, created_at,tournament_approved, ...restData } = staged
    const tournamentData = {
      ...restData,
      created_at: new Date().toISOString(), // Set fresh timestamp
    }

    const insertResponse = await fetch(`${apiBaseUrl}/rest/v1/tournaments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${userToken}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(tournamentData),
    })

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text()
      console.error("Failed to insert tournament:", insertResponse.status, errorText)
      return NextResponse.json({ error: "Failed to approve tournament" }, { status: insertResponse.status })
    }

    // Step 2.5: Add tournament owner if user_id exists
    const insertedTournaments = await insertResponse.json()
    if (insertedTournaments.length > 0 && staged.user_id) {
      const newTournamentId = insertedTournaments[0].id
      
      const ownerResponse = await fetch(`${apiBaseUrl}/rest/v1/tournament_owners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
          "Authorization": `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          tournament_id: newTournamentId,
          user_id: staged.user_id,
        }),
      })

      if (!ownerResponse.ok) {
        console.warn("Failed to set tournament owner:", ownerResponse.status)
        // Don't fail the approval, just log the warning
      } else {
        console.log(`Tournament owner set: user ${staged.user_id} for tournament ${newTournamentId}`)
      }
    }

    // Step 3: Send email notification to user (only after successful Supabase verification)
    const emailEdgeUrl = process.env.EMAIL_USER_EDGE_URL
    if (emailEdgeUrl && staged.submitted_by) {
      try {
        const disciplines = staged.disciplines?.map((d: { name: string; type: string }) => 
          `${d.name} (${d.type})`
        ).join(', ') || 'N/A'

        const notificationBody = {
          to: staged.submitted_by,
          subject: `Your HEMA tournament has been approved: ${staged.name}`,
          message: `Great news! Your tournament submission has been approved and is now live.\n\n` +
            `Tournament Details:\n` +
            `Name: ${staged.name}\n` +
            `Location: ${staged.location}\n` +
            `Date: ${staged.date}${staged.date_to && staged.date_to !== staged.date ? ` - ${staged.date_to}` : ''}\n` +
            `Disciplines: ${disciplines}\n\n` +
            `Thank you for contributing to the HEMA community!`
        }

        const emailResponse = await fetch(emailEdgeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify(notificationBody),
        })

        if (emailResponse.ok) {
          console.log("User notification email sent successfully to:", staged.submitted_by)
        } else {
          console.warn("Failed to send user notification email:", emailResponse.status, emailResponse.statusText)
        }
      } catch (emailError) {
        // Don't fail the approval if email notification fails
        console.error("Error sending user notification email:", emailError)
      }
    }

    // Step 4: Mark staged tournament as approved
    const updateResponse = await fetch(`${apiBaseUrl}/rest/v1/staged_tournaments?id=eq.${tournamentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${userToken}`,
      },
      body: JSON.stringify({ tournament_approved: true }),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error("Failed to update staged tournament:", updateResponse.status, errorText)
      // Tournament was already inserted, so we just log the error
      return NextResponse.json({ 
        success: true, 
        message: "Tournament approved but failed to update staging status",
        warning: "Manual cleanup may be required"
      })
    }

    console.log(`Tournament ${tournamentId} approved and moved to main table`)
    return NextResponse.json({ 
      success: true, 
      message: "Tournament approved successfully" 
    })

  } catch (error) {
    console.error("Error approving tournament:", error)
    return NextResponse.json({ error: "Failed to approve tournament" }, { status: 500 })
  }
}
