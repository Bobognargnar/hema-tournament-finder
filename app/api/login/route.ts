import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (email && password) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL
      const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.API_KEY || "",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      return NextResponse.json(
        { success: true, token: data.access_token, identity: data.user.email, message: "Login successful!" },
        { status: 200 },
      )
    } catch (error) {
      return NextResponse.json({ success: false, message: "Login failed" }, { status: 400 })
    }
  } else {
    console.log("Login failed: Missing email or password")
    return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 })
  }
}
