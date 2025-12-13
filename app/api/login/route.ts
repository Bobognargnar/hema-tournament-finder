import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (email && password) {
    try {
      const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      const apiKey = process.env.API_KEY

      // Debug logging
      console.log("Login attempt - API_BASE_URL configured:", !!baseUrl)
      console.log("Login attempt - API_KEY configured:", !!apiKey)

      if (!baseUrl) {
        console.error("API_BASE_URL is not configured")
        return NextResponse.json({ success: false, message: "API configuration error: BASE_URL missing" }, { status: 500 })
      }

      if (!apiKey) {
        console.error("API_KEY is not configured")
        return NextResponse.json({ success: false, message: "API configuration error: API_KEY missing" }, { status: 500 })
      }

      const loginUrl = `${baseUrl}/auth/v1/token?grant_type=password`
      console.log("Login URL:", loginUrl)

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          console.error("Login API error response:", errorData)
          errorMessage = errorData.error_description || errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          const textContent = await response.text().catch(() => "")
          if (textContent) {
            console.error("Login API error text:", textContent)
            errorMessage = textContent
          }
        }
        return NextResponse.json({ success: false, message: errorMessage }, { status: response.status })
      }

      const data = await response.json()
      console.log("Login successful for user:", data.user?.email)
      
      return NextResponse.json(
        { success: true, token: data.access_token, identity: data.user.email, message: "Login successful!" },
        { status: 200 },
      )
    } catch (error) {
      console.error("Login error:", error)
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 })
    }
  } else {
    console.log("Login failed: Missing email or password")
    return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 })
  }
}
