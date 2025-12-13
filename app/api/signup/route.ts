import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required." },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 6 characters." },
      { status: 400 }
    )
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL
    const apiKey = process.env.API_KEY

    if (!baseUrl || !apiKey) {
      console.error("API configuration missing")
      return NextResponse.json(
        { success: false, message: "API configuration error" },
        { status: 500 }
      )
    }

    const response = await fetch(`${baseUrl}/auth/v1/signup`, {
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

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.error_description || data.msg || data.message || "Signup failed"
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: response.status }
      )
    }

    // Check if email confirmation is required
    if (data.id && !data.access_token) {
      return NextResponse.json({
        success: true,
        message: "Registration successful! Please check your email to confirm your account.",
        requiresConfirmation: true,
      })
    }

    // If auto-confirmed, return the token
    return NextResponse.json({
      success: true,
      message: "Registration successful!",
      token: data.access_token,
      identity: data.user?.email,
      requiresConfirmation: false,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred during registration." },
      { status: 500 }
    )
  }
}

