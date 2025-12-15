import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Validate token
    if (!token) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    // Get environment variables
    const apiBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
    const apiKey = process.env.API_KEY
    const logosBucket = process.env.LOGOS_BUCKET

    if (!apiBaseUrl) {
      console.error("API_BASE_URL not configured")
      return NextResponse.json({ success: false, message: "API configuration error" }, { status: 500 })
    }

    if (!apiKey) {
      console.error("API_KEY not configured")
      return NextResponse.json({ success: false, message: "API configuration error" }, { status: 500 })
    }

    if (!logosBucket) {
      console.error("LOGOS_BUCKET not configured")
      return NextResponse.json({ success: false, message: "Storage configuration error" }, { status: 500 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    const validExtensions = [".jpg", ".jpeg", ".png"]
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPEG and PNG images are allowed." },
        { status: 400 }
      )
    }

    // Validate MIME type as well
    const validMimeTypes = ["image/jpeg", "image/png"]
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPEG and PNG images are allowed." },
        { status: 400 }
      )
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = fileName.endsWith(".png") ? ".png" : ".jpg"
    const uniqueFileName = `logo_${timestamp}_${randomString}${extension}`

    // Convert file to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const uploadUrl = `${apiBaseUrl}/storage/v1/object/${logosBucket}/${uniqueFileName}`
    
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "apikey": apiKey,
        "Authorization": `Bearer ${token}`,
      },
      body: buffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => "")
      console.error("Failed to upload logo:", uploadResponse.status, errorText)
      return NextResponse.json(
        { success: false, message: `Failed to upload logo: ${uploadResponse.status}` },
        { status: uploadResponse.status }
      )
    }

    // Construct the public URL for the uploaded file
    const publicUrl = `${apiBaseUrl}/storage/v1/object/public/${logosBucket}/${uniqueFileName}`

    console.log("Logo uploaded successfully:", publicUrl)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
    })
  } catch (error) {
    console.error("Error uploading logo:", error)
    return NextResponse.json({ success: false, message: "Failed to upload logo" }, { status: 500 })
  }
}
