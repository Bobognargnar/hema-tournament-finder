"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Calendar, MapPin, LinkIcon, Mail, BookOpen, Loader2, X, Pencil, Trash2, Bell, LogIn, LogOut, User, Sword } from "lucide-react"
import { fetchTournamentById, fetchOwnedTournaments } from "@/lib/tournaments"
import type { Tournament, DisciplineDetail, TournamentType } from "@/types/tournament"
import { TOURNAMENT_TYPE_ORDER, TOURNAMENT_TYPE_STYLES } from "@/types/tournament"
import { OpenLayersMap } from "@/components/OpenLayersMap"
import { useRouter } from "next/navigation"
import { disciplineOptions, tournamentTypeOptions } from "@/utils/tournament"

interface TournamentUpdate {
  id: number
  tournament_id: number
  message: string
  created_at: string
}

interface EditTournamentForm {
  location: string
  longitude: string
  latitude: string
  description: string
  venueDetails: string
  rulesLink: string
  contactEmail: string
  disciplines: DisciplineDetail[]
}

interface TournamentDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const tournamentId = Number.parseInt(resolvedParams.id)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ownedTournamentIds, setOwnedTournamentIds] = useState<number[]>([])
  const [userIdentity, setUserIdentity] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // Login/Signup state
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showSignupDialog, setShowSignupDialog] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [signupForm, setSignupForm] = useState({ email: "", password: "", confirmPassword: "" })
  const [loginLoading, setLoginLoading] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = useState<EditTournamentForm>({
    location: "",
    longitude: "",
    latitude: "",
    description: "",
    venueDetails: "",
    rulesLink: "",
    contactEmail: "",
    disciplines: [],
  })
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  
  // Updates state
  const [updates, setUpdates] = useState<TournamentUpdate[]>([])
  const [updatesLoading, setUpdatesLoading] = useState(true)
  const [dismissedUpdateIds, setDismissedUpdateIds] = useState<Set<number>>(new Set())
  const [showAddUpdate, setShowAddUpdate] = useState(false)
  const [newUpdateMessage, setNewUpdateMessage] = useState("")
  const [addUpdateLoading, setAddUpdateLoading] = useState(false)
  
  // Check if user can edit this tournament (must be logged in AND either admin or owner)
  const canEdit = isLoggedIn && (isAdmin || ownedTournamentIds.includes(tournamentId))
  
  // Filter out dismissed updates
  const visibleUpdates = updates.filter(u => !dismissedUpdateIds.has(u.id))

  // Load auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken")
    const storedIsAdmin = localStorage.getItem("isAdmin") === "true"
    const storedUserIdentity = localStorage.getItem("userIdentity")
    
    if (storedToken) {
      setAuthToken(storedToken)
      setIsAdmin(storedIsAdmin)
      setIsLoggedIn(true)
      if (storedUserIdentity) {
        setUserIdentity(storedUserIdentity)
      }
      
      // Fetch owned tournaments
      fetchOwnedTournaments(storedToken).then((ids) => {
        setOwnedTournamentIds(ids)
      })
    }
  }, [])

  useEffect(() => {
    const loadTournament = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchTournamentById(tournamentId)
        if (data) {
          setTournament(data)
        } else {
          setError("Tournament not found.")
        }
      } catch (err) {
        console.error("Failed to fetch tournament:", err)
        setError("Failed to load tournament details.")
      } finally {
        setLoading(false)
      }
    }

    if (!isNaN(tournamentId)) {
      loadTournament()
    } else {
      setLoading(false)
      setError("Invalid tournament ID.")
    }
  }, [tournamentId])

  // Fetch tournament updates
  useEffect(() => {
    const loadUpdates = async () => {
      if (isNaN(tournamentId)) return
      
      setUpdatesLoading(true)
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}/updates`)
        if (response.ok) {
          const data = await response.json()
          setUpdates(data)
        } else {
          console.error("Failed to fetch updates")
        }
      } catch (err) {
        console.error("Error fetching updates:", err)
      } finally {
        setUpdatesLoading(false)
      }
    }

    loadUpdates()
  }, [tournamentId])

  // Dismiss an update
  const handleDismissUpdate = (updateId: number) => {
    setDismissedUpdateIds(prev => new Set([...prev, updateId]))
  }

  // Add a new update
  const handleAddUpdate = async () => {
    if (!authToken || !newUpdateMessage.trim()) return

    setAddUpdateLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ message: newUpdateMessage.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Add the new update to the beginning of the list
        setUpdates(prev => [data.update, ...prev])
        setNewUpdateMessage("")
        setShowAddUpdate(false)
      } else {
        alert(`Failed to add update: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error adding update:", error)
      alert("An error occurred while adding the update.")
    } finally {
      setAddUpdateLoading(false)
    }
  }

  // Format update date with days ago
  const formatUpdateDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    
    const daysAgo = diffDays === 0 
      ? "today" 
      : diffDays === 1 
        ? "1 day ago" 
        : `${diffDays} days ago`
    
    return `${formattedDate} (${daysAgo})`
  }

  // Handle login
  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      alert("Please enter both email and password.")
      return
    }

    setLoginLoading(true)
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (data.success) {
        const token = data.token
        const identity = data.identity
        const adminStatus = data.isAdmin || false

        setAuthToken(token)
        setUserIdentity(identity)
        setIsLoggedIn(true)
        setIsAdmin(adminStatus)

        localStorage.setItem("authToken", token)
        localStorage.setItem("userIdentity", identity)
        localStorage.setItem("isAdmin", String(adminStatus))

        setShowLoginDialog(false)
        setLoginForm({ email: "", password: "" })

        // Fetch owned tournaments with new token
        fetchOwnedTournaments(token).then((ids) => {
          setOwnedTournamentIds(ids)
        })
      } else {
        alert(`Login failed: ${data.message}`)
      }
    } catch (error) {
      console.error("Error during login:", error)
      alert("An error occurred during login.")
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    setAuthToken(null)
    setIsLoggedIn(false)
    setIsAdmin(false)
    setUserIdentity(null)
    setOwnedTournamentIds([])

    localStorage.removeItem("authToken")
    localStorage.removeItem("userIdentity")
    localStorage.removeItem("isAdmin")
  }

  // Handle signup
  const handleSignup = async () => {
    if (!signupForm.email || !signupForm.password) {
      alert("Please enter both email and password.")
      return
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      alert("Passwords do not match.")
      return
    }

    if (signupForm.password.length < 6) {
      alert("Password must be at least 6 characters.")
      return
    }

    setSignupLoading(true)
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: signupForm.email,
          password: signupForm.password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.requiresConfirmation) {
          alert(data.message)
          setShowSignupDialog(false)
          setSignupForm({ email: "", password: "", confirmPassword: "" })
        } else {
          // Auto-confirmed, log the user in
          setAuthToken(data.token)
          setUserIdentity(data.identity)
          setIsLoggedIn(true)

          localStorage.setItem("authToken", data.token)
          localStorage.setItem("userIdentity", data.identity)

          setShowSignupDialog(false)
          setSignupForm({ email: "", password: "", confirmPassword: "" })
          alert("Registration successful! You are now logged in.")
        }
      } else {
        alert(`Registration failed: ${data.message}`)
      }
    } catch (error) {
      console.error("Error during signup:", error)
      alert("An error occurred during registration.")
    } finally {
      setSignupLoading(false)
    }
  }

  // Initialize edit form when modal opens
  useEffect(() => {
    if (showEditModal && tournament) {
      setEditForm({
        location: tournament.location || "",
        // Coordinates are stored as [lon, lat] in the tournament object
        longitude: tournament.coordinates?.[0]?.toString() || "",
        latitude: tournament.coordinates?.[1]?.toString() || "",
        description: tournament.description || "",
        venueDetails: tournament.venueDetails || "",
        rulesLink: tournament.rulesLink || "",
        contactEmail: tournament.contactEmail || "",
        disciplines: tournament.disciplines ? [...tournament.disciplines] : [],
      })
    }
  }, [showEditModal, tournament])

  // Geocode location using OpenStreetMap Nominatim API
  const geocodeLocation = async (location: string) => {
    if (!location.trim()) return

    setGeocodingLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
        {
          headers: {
            "User-Agent": "HEMATournamentFinder/1.0",
          },
        }
      )

      const data = await response.json()

      if (data && data.length > 0) {
        const { lon, lat } = data[0]
        setEditForm((prev) => ({
          ...prev,
          longitude: lon,
          latitude: lat,
        }))
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    } finally {
      setGeocodingLoading(false)
    }
  }

  // Handle save tournament changes
  const handleSaveTournament = async () => {
    if (!authToken || !tournament) return

    // Validate coordinates
    if (!editForm.longitude || !editForm.latitude) {
      alert("Coordinates are required. Please enter a location and wait for geocoding, or enter coordinates manually.")
      return
    }

    // Validate disciplines
    if (editForm.disciplines.length === 0) {
      alert("At least one discipline is required.")
      return
    }

    // Check all disciplines have both name and type
    const invalidDiscipline = editForm.disciplines.find(d => !d.name || !d.type)
    if (invalidDiscipline) {
      alert("All disciplines must have both a name and type selected.")
      return
    }

    setSaveLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          location: editForm.location,
          coordinates: [parseFloat(editForm.longitude), parseFloat(editForm.latitude)],
          description: editForm.description,
          venueDetails: editForm.venueDetails,
          rulesLink: editForm.rulesLink,
          contactEmail: editForm.contactEmail,
          disciplines: editForm.disciplines,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update local tournament state
        setTournament((prev) => prev ? {
          ...prev,
          location: editForm.location,
          coordinates: [parseFloat(editForm.longitude), parseFloat(editForm.latitude)],
          description: editForm.description,
          venueDetails: editForm.venueDetails,
          rulesLink: editForm.rulesLink,
          contactEmail: editForm.contactEmail,
          disciplines: editForm.disciplines,
        } : null)
        setShowEditModal(false)
        alert("Tournament updated successfully!")
      } else {
        alert(`Failed to update tournament: ${data.error || data.message}`)
      }
    } catch (error) {
      console.error("Error updating tournament:", error)
      alert("An error occurred while updating the tournament.")
    } finally {
      setSaveLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleBackClick = () => {
    router.push("/")
  }

  // Ensure URL has a protocol prefix
  const formatUrl = (url: string) => {
    if (!url) return url
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }
    return `https://${url}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <header className="bg-white shadow-sm border-b mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 gap-2">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Back</span>
              </Button>
              <div className="flex items-center gap-2">
                <Sword className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                <span className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                  <span className="hidden sm:inline">Tournament Details</span>
                  <span className="sm:hidden">Details</span>
                </span>
              </div>
            </div>

            {/* Right: Login/Logout Section */}
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              {isLoggedIn ? (
                <>
                  {userIdentity && (
                    <div className="hidden md:flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Hello, {userIdentity}</span>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <LogIn className="w-4 h-4" />
                        <span className="hidden sm:inline">Login</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Login</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                            disabled={loginLoading}
                            placeholder="Enter your email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="login-password">Password</Label>
                          <Input
                            id="login-password"
                            type="password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            disabled={loginLoading}
                            placeholder="Enter your password"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !loginLoading) {
                                handleLogin()
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowLoginDialog(false)} disabled={loginLoading}>
                            Cancel
                          </Button>
                          <Button onClick={handleLogin} disabled={loginLoading}>
                            {loginLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Logging in...
                              </>
                            ) : (
                              "Login"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Sign Up</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Account</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            value={signupForm.email}
                            onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                            disabled={signupLoading}
                            placeholder="Enter your email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            value={signupForm.password}
                            onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                            disabled={signupLoading}
                            placeholder="Enter your password (min 6 characters)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                          <Input
                            id="signup-confirm-password"
                            type="password"
                            value={signupForm.confirmPassword}
                            onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                            disabled={signupLoading}
                            placeholder="Confirm your password"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !signupLoading) {
                                handleSignup()
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowSignupDialog(false)} disabled={signupLoading}>
                            Cancel
                          </Button>
                          <Button onClick={handleSignup} disabled={signupLoading}>
                            {signupLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Creating account...
                              </>
                            ) : (
                              "Sign Up"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-lg text-gray-700">Loading tournament details...</span>
          </div>
        )}

        {error && (
          <Card className="border-red-400 bg-red-50 text-red-800">
            <CardContent className="p-6 text-center">
              <p className="font-semibold text-lg mb-2">Error:</p>
              <p>{error}</p>
              <Button onClick={handleBackClick} className="mt-4 bg-transparent" variant="outline">
                Go back to list
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && tournament && (
          <>
            {/* Owner Banner */}
            {canEdit && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2 text-green-800">
                <User className="w-5 h-5" />
                <span className="font-medium">You manage this tournament!</span>
              </div>
            )}

            {/* Organizer Contact Banner */}
            {!canEdit && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-800">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">
                  Are you the organizer of this tournament? Write us at{" "}
                  <a 
                    href="mailto:fbr.larosa@gmail.com?subject=Tournament%20Organizer%20Request" 
                    className="font-semibold underline hover:text-blue-600"
                  >
                    fbr.larosa@gmail.com
                  </a>
                </span>
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {tournament.logo_url && (
                    <img
                      src={tournament.logo_url}
                      alt={`${tournament.name} logo`}
                      className="w-60 h-60 object-contain rounded-md bg-gray-100 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setShowImageModal(true)}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-3xl font-bold">{tournament.name}</CardTitle>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowEditModal(true)}
                          className="flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-lg mt-2">
                      <MapPin className="w-5 h-5" />
                      <span>{tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-lg">
                      <Calendar className="w-5 h-5" />
                      <span>
                        {formatDate(tournament.date)}
                        {tournament.dateTo && tournament.dateTo !== tournament.date && (
                          <> - {formatDate(tournament.dateTo)}</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {tournament.disciplines && tournament.disciplines.length > 0 ? (
                    (() => {
                      // Group disciplines by name
                      const grouped = tournament.disciplines.reduce((acc, disc) => {
                        if (!acc[disc.name]) {
                          acc[disc.name] = []
                        }
                        if (!acc[disc.name].includes(disc.type)) {
                          acc[disc.name].push(disc.type)
                        }
                        return acc
                      }, {} as Record<string, TournamentType[]>)
                      
                      // Sort types within each group using centralized order
                      Object.keys(grouped).forEach(name => {
                        grouped[name].sort((a, b) => {
                          const orderA = TOURNAMENT_TYPE_ORDER[a] ?? 99
                          const orderB = TOURNAMENT_TYPE_ORDER[b] ?? 99
                          return orderA - orderB
                        })
                      })
                      
                      // Sort discipline names alphabetically
                      const sortedNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b))
                      
                      return sortedNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center justify-between text-sm px-3 py-1 rounded-full bg-gray-200 text-gray-700 min-w-[220px]"
                        >
                          <span className="font-bold">{name}</span>
                          <span className="inline-flex items-center gap-1 ml-2">
                            {grouped[name].map((type) => {
                              const style = TOURNAMENT_TYPE_STYLES[type] || TOURNAMENT_TYPE_STYLES.Other
                              return (
                                <span
                                  key={type}
                                  className="px-2 py-0.5 rounded-full text-xs font-medium border text-center"
                                  style={{
                                    backgroundColor: style.bg,
                                    color: style.text,
                                    borderColor: style.border,
                                  }}
                                >
                                  {type}
                                </span>
                              )
                            })}
                          </span>
                        </span>
                      ))
                    })()
                  ) : (
                    <p className="text-gray-500 italic">No disciplines listed for this tournament.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-xl mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{tournament.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-xl mb-2">Venue Details</h3>
                  <p className="text-gray-700">{tournament.venueDetails}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      Official Website
                    </h3>
                    {tournament.registrationLink ? (
                      <Button asChild>
                        <a href={formatUrl(tournament.registrationLink)} target="_blank" rel="noopener noreferrer">
                          Go to site
                        </a>
                      </Button>
                    ) : (
                      <p className="text-gray-500 italic">Unavailable</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Contact Email
                    </h3>
                    {tournament.contactEmail ? (
                      <a
                        href={`mailto:${tournament.contactEmail}`}
                        className="text-blue-600 hover:underline"
                      >
                        {tournament.contactEmail}
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">Unavailable</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Rules
                    </h3>
                    {tournament.rulesLink ? (
                      <Button asChild variant="outline">
                        <a href={formatUrl(tournament.rulesLink)} target="_blank" rel="noopener noreferrer">
                          Go to site
                        </a>
                      </Button>
                    ) : (
                      <p className="text-gray-500 italic">Unavailable</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Updates */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Tournament Updates
                  </CardTitle>
                  {canEdit && !showAddUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddUpdate(true)}
                      className="flex items-center gap-1"
                    >
                      <span>+ Add Update</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Add Update Form */}
                {canEdit && showAddUpdate && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <Textarea
                      value={newUpdateMessage}
                      onChange={(e) => setNewUpdateMessage(e.target.value)}
                      placeholder="Enter your update message..."
                      rows={2}
                      disabled={addUpdateLoading}
                      className="mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAddUpdate(false)
                          setNewUpdateMessage("")
                        }}
                        disabled={addUpdateLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddUpdate}
                        disabled={addUpdateLoading || !newUpdateMessage.trim()}
                      >
                        {addUpdateLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            Adding...
                          </>
                        ) : (
                          "Add Update"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {updatesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Loading updates...</span>
                  </div>
                ) : visibleUpdates.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-4">No updates on this tournament</p>
                ) : (
                  <div className="space-y-3">
                    {visibleUpdates.map((update, index) => (
                      <div
                        key={update.id}
                        className={`flex items-start justify-between gap-3 p-3 rounded-lg ${
                          index === 0
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800">{update.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatUpdateDate(update.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDismissUpdate(update.id)}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
                          aria-label="Dismiss update"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OpenLayers Map for Tournament Location */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Tournament Location on Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full rounded-lg overflow-hidden">
                  <OpenLayersMap tournaments={[tournament]} initialZoom={12} />
                </div>
              </CardContent>
            </Card>

            {/* Image Modal */}
            {showImageModal && tournament.logo_url && (
              <div 
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={() => setShowImageModal(false)}
              >
                <div className="relative max-w-3xl max-h-[90vh]">
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                    aria-label="Close image"
                  >
                    <X className="w-8 h-8" />
                  </button>
                  <img
                    src={tournament.logo_url}
                    alt={`${tournament.name} logo`}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
              <div 
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={() => setShowEditModal(false)}
              >
                <div 
                  className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold">Edit Tournament</h2>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Location Field */}
                    <div>
                      <Label htmlFor="edit-location">Location</Label>
                      <Input
                        id="edit-location"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        onBlur={(e) => geocodeLocation(e.target.value)}
                        placeholder="City, Country (coordinates auto-filled)"
                        disabled={saveLoading}
                      />
                      {geocodingLoading && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Looking up coordinates...
                        </p>
                      )}
                    </div>

                    {/* Coordinates Fields */}
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Label htmlFor="edit-longitude">Longitude</Label>
                        <Input
                          id="edit-longitude"
                          type="number"
                          step="any"
                          value={editForm.longitude}
                          onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                          placeholder="e.g. 16.3738"
                          disabled={saveLoading}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="edit-latitude">Latitude</Label>
                        <Input
                          id="edit-latitude"
                          type="number"
                          step="any"
                          value={editForm.latitude}
                          onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                          placeholder="e.g. 48.2082"
                          disabled={saveLoading}
                        />
                      </div>
                      {editForm.longitude && editForm.latitude && (
                        <a
                          href={`https://www.google.com/maps?q=${editForm.latitude},${editForm.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          title="View on Google Maps"
                        >
                          <MapPin className="w-5 h-5" />
                        </a>
                      )}
                    </div>

                    {/* Description Field */}
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Tournament description..."
                        rows={3}
                        disabled={saveLoading}
                      />
                    </div>

                    {/* Venue Details Field */}
                    <div>
                      <Label htmlFor="edit-venue">Venue Details</Label>
                      <Textarea
                        id="edit-venue"
                        value={editForm.venueDetails}
                        onChange={(e) => setEditForm({ ...editForm, venueDetails: e.target.value })}
                        placeholder="Venue address and details..."
                        rows={2}
                        disabled={saveLoading}
                      />
                    </div>

                    {/* Rules Link Field */}
                    <div>
                      <Label htmlFor="edit-rules">Rules Link</Label>
                      <Input
                        id="edit-rules"
                        type="url"
                        value={editForm.rulesLink}
                        onChange={(e) => setEditForm({ ...editForm, rulesLink: e.target.value })}
                        placeholder="https://..."
                        disabled={saveLoading}
                      />
                    </div>

                    {/* Contact Email Field */}
                    <div>
                      <Label htmlFor="edit-contact-email">Contact Email</Label>
                      <Input
                        id="edit-contact-email"
                        type="email"
                        value={editForm.contactEmail}
                        onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                        placeholder="contact@tournament.com"
                        disabled={saveLoading}
                      />
                    </div>

                    {/* Disciplines Field */}
                    <div>
                      <Label>Disciplines</Label>
                      <div className="space-y-2 mt-2">
                        {editForm.disciplines.map((discipline, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              className="border rounded px-2 py-1 flex-1 text-sm"
                              value={discipline.name}
                              onChange={(e) => {
                                const newDisciplines = [...editForm.disciplines]
                                newDisciplines[idx] = { ...newDisciplines[idx], name: e.target.value }
                                setEditForm({ ...editForm, disciplines: newDisciplines })
                              }}
                              disabled={saveLoading}
                            >
                              <option value="">Select discipline</option>
                              {disciplineOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <select
                              className="border rounded px-2 py-1 flex-1 text-sm"
                              value={discipline.type}
                              onChange={(e) => {
                                const newDisciplines = [...editForm.disciplines]
                                newDisciplines[idx] = { ...newDisciplines[idx], type: e.target.value as TournamentType }
                                setEditForm({ ...editForm, disciplines: newDisciplines })
                              }}
                              disabled={saveLoading}
                            >
                              <option value="">Select type</option>
                              {tournamentTypeOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="text-red-600 p-2 hover:bg-red-50 rounded"
                              onClick={() => {
                                const newDisciplines = editForm.disciplines.filter((_, i) => i !== idx)
                                setEditForm({ ...editForm, disciplines: newDisciplines })
                              }}
                              disabled={saveLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded border border-blue-200 text-sm"
                          onClick={() => setEditForm({
                            ...editForm,
                            disciplines: [...editForm.disciplines, { name: "", type: "Open" as TournamentType }],
                          })}
                          disabled={saveLoading}
                        >
                          + Add Discipline
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 p-4 border-t">
                    <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={saveLoading}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTournament} disabled={saveLoading}>
                      {saveLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
