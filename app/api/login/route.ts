import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // In a real application, you would validate credentials against a database
  // and generate a real JWT. For this mock, any credentials work.
  const { email, password } = await request.json()

  console.log("Login attempt received:", { email, password })

  if (email && password) {
    // Simulate a successful login and return a dummy JWT token
    const dummyToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1vY2sgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZW1haWwiOiJ" +
      email +
      "J9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

    console.log("Login successful, returning token:", dummyToken)

    return NextResponse.json({ success: true, token: dummyToken, message: "Login successful!" }, { status: 200 })
  } else {
    console.log("Login failed: Missing email or password")
    return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 })
  }
}
