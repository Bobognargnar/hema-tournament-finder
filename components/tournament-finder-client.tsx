"use client"

import { useState, useMemo, useEffect } from "react"
import type { Tournament, DisciplineDetail } from "@/types/tournament"
import { disciplineOptions, tournamentTypeOptions } from "@/utils/tournament"
import type { TournamentType } from "@/types/tournament"
import { fetchTournaments, fetchStagedTournaments, type StagedTournament } from "@/lib/tournaments"
import { TournamentFiltersComponent } from "@/components/tournament-filters"
import TournamentCard from "@/components/tournament-card"
import { OpenLayersMap } from "@/components/OpenLayersMap"
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
  DialogDescription,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Sword, Map, LogIn, Loader2, LogOut, User, Plus, Trash2, Check } from "lucide-react"

interface UserData {
  name: string
  favouriteTournamentIds: number[]
}

interface TournamentFinderClientProps {
  initialTournaments: Tournament[]
  initialMapCenter: [number, number] // [longitude, latitude]
  initialMapZoom: number // New prop for initial zoom
}

interface DisciplineRow {
  name: string
  type: TournamentType
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
  longitude: string
  latitude: string
  submittedBy: string
}

export function TournamentFinderClient({
  initialTournaments,
  initialMapCenter,
  initialMapZoom,
}: TournamentFinderClientProps) {
  console.log("TournamentFinderClient: Component rendered.")
  console.log("TournamentFinderClient: Received initialTournaments count:", initialTournaments.length)
  console.log("TournamentFinderClient: Received initialMapCenter:", initialMapCenter, "initialMapZoom:", initialMapZoom)

  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments)
  const [stagedTournaments, setStagedTournaments] = useState<StagedTournament[]>([])
  const [loading, setLoading] = useState(false)
  const [stagedLoading, setStagedLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    disciplines: [],
    selectedTypes: [],
    showFavorites: false,
  })
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })
  const [tournamentForm, setTournamentForm] = useState<TournamentSubmission>({
    name: "",
    location: "",
    date: "",
    disciplines: [],
    description: "",
    registrationLink: "",
    venueDetails: "",
    contactEmail: "",
    rulesLink: "",
    longitude: "",
    latitude: "",
    submittedBy: "",
  })
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showSignupDialog, setShowSignupDialog] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showAuthPromptDialog, setShowAuthPromptDialog] = useState(false)
  const [signupForm, setSignupForm] = useState({ email: "", password: "", confirmPassword: "" })
  const [signupLoading, setSignupLoading] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userIdentity, setUserIdentity] = useState<string | null>(null)

  // Check for existing auth token on mount
  useEffect(() => {
    console.log("TournamentFinderClient: useEffect for auth token check triggered.")
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("authToken")
      const storedUserIdentity = localStorage.getItem("userIdentity")
      const storedIsAdmin = localStorage.getItem("isAdmin") === "true"

      if (storedToken) {
        setAuthToken(storedToken)
        setIsLoggedIn(true)
        setIsAdmin(storedIsAdmin)
        console.log("TournamentFinderClient: Found stored auth token. isAdmin:", storedIsAdmin)

        // Restore user identity if available
        if (storedUserIdentity) {
          setUserIdentity(storedUserIdentity)
          console.log("TournamentFinderClient: Restored user identity:", storedUserIdentity)
        }

        // Fetch user data with the stored token
        fetchUserDataWithToken(storedToken)
      } else {
        console.log("TournamentFinderClient: No stored auth token found.")
      }
    }
  }, [])

  // Fetch staged tournaments when user is logged in
  useEffect(() => {
    const loadStagedTournaments = async () => {
      if (!authToken) {
        setStagedTournaments([])
        return
      }
      
      setStagedLoading(true)
      try {
        const data = await fetchStagedTournaments(authToken)
        setStagedTournaments(data)
        console.log("TournamentFinderClient: Fetched staged tournaments:", data.length)
      } catch (error) {
        console.error("TournamentFinderClient: Error fetching staged tournaments:", error)
      } finally {
        setStagedLoading(false)
      }
    }
    loadStagedTournaments()
  }, [authToken])

  // Filter tournaments based on current filters
  const filteredTournaments = useMemo(() => {
    console.log("TournamentFinderClient: Recalculating filteredTournaments.")
    let filtered = tournaments

    const filterStartDate = filters.startDate ? new Date(filters.startDate) : null
    const filterEndDate = filters.endDate ? new Date(filters.endDate) : null

    if (filterStartDate) {
      filtered = filtered.filter((t) => {
        const tournamentDate = new Date(t.date)
        return tournamentDate.getTime() >= filterStartDate.getTime()
      })
      console.log("TournamentFinderClient: Filtered by start date. Count:", filtered.length)
    }

    if (filterEndDate) {
      filtered = filtered.filter((t) => {
        const tournamentDate = new Date(t.date)
        return tournamentDate.getTime() <= filterEndDate.getTime()
      })
      console.log("TournamentFinderClient: Filtered by end date. Count:", filtered.length)
    }

    if (filters.disciplines.length > 0) {
      filtered = filtered.filter((t) =>
        t.disciplines.some((d: DisciplineDetail) => filters.disciplines.includes(d.name)),
      )
      console.log("TournamentFinderClient: Filtered by disciplines. Count:", filtered.length)
    }

    if (filters.selectedTypes.length > 0) {
      filtered = filtered.filter((t) =>
        t.disciplines.some((d: DisciplineDetail) => filters.selectedTypes.includes(d.type)),
      )
      console.log("TournamentFinderClient: Filtered by types. Count:", filtered.length)
    }

    // Apply new favorite filter
    if (filters.showFavorites && userData) {
      filtered = filtered.filter((t) => userData.favouriteTournamentIds.includes(t.id))
      console.log("TournamentFinderClient: Filtered by favorites. Count:", filtered.length)
    }
    console.log("TournamentFinderClient: Final filteredTournaments count:", filtered.length)
    return filtered
  }, [tournaments, filters, userData])

  const fetchUserDataWithToken = async (token: string) => {
    console.log("TournamentFinderClient: Attempting to fetch user data with token.")
    try {
      const response = await fetch("/api/user/favorites", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setUserData(data.user)
        console.log("TournamentFinderClient: User data fetched successfully:", data.user)
      } else {
        console.error("TournamentFinderClient: Failed to fetch user data:", data.message)
        handleLogout()
      }
    } catch (error) {
      console.error("TournamentFinderClient: Error fetching user data:", error)
      handleLogout()
    }
  }

  const fetchUserData = async () => {
    console.log("TournamentFinderClient: fetchUserData called.")
    if (!authToken) {
      console.warn("TournamentFinderClient: No auth token available to fetch user data.")
      return
    }
    await fetchUserDataWithToken(authToken)
  }

  const handleLogin = async () => {
    console.log("TournamentFinderClient: handleLogin called.")
    if (!loginForm.email || !loginForm.password) {
      alert("Please enter both email and password.")
      console.log("TournamentFinderClient: Login failed - missing email or password.")
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

        // Clear previous user's data before setting new user
        setUserData(null)
        setStagedTournaments([])
        setFilters((prevFilters) => ({ ...prevFilters, showFavorites: false }))

        setAuthToken(token)
        setUserIdentity(identity)
        setIsLoggedIn(true)
        setIsAdmin(adminStatus)

        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", token)
          localStorage.setItem("userIdentity", identity)
          localStorage.setItem("isAdmin", String(adminStatus))
          console.log("TournamentFinderClient: Stored auth token, user identity, and admin status in localStorage.")
        }

        setShowLoginDialog(false)
        setLoginForm({ email: "", password: "" })
        await fetchUserDataWithToken(token)
      } else {
        alert(`Login failed: ${data.message}`)
      }
    } catch (error) {
      console.error("TournamentFinderClient: Error during login:", error)
      alert("An error occurred during login.")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    console.log("TournamentFinderClient: handleLogout called.")
    setAuthToken(null)
    setIsLoggedIn(false)
    setIsAdmin(false)
    setUserData(null)
    setUserIdentity(null)
    setFilters((prevFilters) => ({ ...prevFilters, showFavorites: false }))

    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken")
      localStorage.removeItem("userIdentity")
      localStorage.removeItem("isAdmin")
      console.log("TournamentFinderClient: Auth token, user identity, and admin status removed from localStorage.")
    }

    console.log("TournamentFinderClient: Logged out.")
  }

  const handleSignup = async () => {
    console.log("TournamentFinderClient: handleSignup called.")
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

          if (typeof window !== "undefined") {
            localStorage.setItem("authToken", data.token)
            localStorage.setItem("userIdentity", data.identity)
          }

          setShowSignupDialog(false)
          setSignupForm({ email: "", password: "", confirmPassword: "" })
          alert("Registration successful! You are now logged in.")
        }
      } else {
        alert(`Registration failed: ${data.message}`)
      }
    } catch (error) {
      console.error("TournamentFinderClient: Error during signup:", error)
      alert("An error occurred during registration.")
    } finally {
      setSignupLoading(false)
    }
  }

  const handleSubmitTournament = async () => {
    console.log("TournamentFinderClient: handleSubmitTournament called.")
    if (!tournamentForm.name.trim()) {
      alert("Tournament name is required.")
      return
    }

    setSubmitLoading(true)
    try {
      const submissionData = {
        ...tournamentForm,
        submittedBy: userIdentity || "",
        coordinates:
          tournamentForm.longitude && tournamentForm.latitude
            ? [parseFloat(tournamentForm.longitude), parseFloat(tournamentForm.latitude)]
            : undefined,
      }
      const response = await fetch("/api/tournaments/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(submissionData),
      })

      const data = await response.json()

      if (data.success) {
        alert("Tournament submitted successfully! It will be reviewed before being published.")
        setShowSubmitDialog(false)
        // Reset form
        setTournamentForm({
          name: "",
          location: "",
          date: "",
          disciplines: [],
          description: "",
          registrationLink: "",
          venueDetails: "",
          contactEmail: "",
          rulesLink: "",
          longitude: "",
          latitude: "",
          submittedBy: "",
        })
        // Reload staged tournaments to show the new submission
        if (authToken) {
          const updatedStaged = await fetchStagedTournaments(authToken)
          setStagedTournaments(updatedStaged)
        }
      } else {
        alert(`Failed to submit tournament: ${data.message}`)
      }
    } catch (error) {
      console.error("TournamentFinderClient: Error submitting tournament:", error)
      alert("An error occurred while submitting the tournament.")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleApproveTournament = async (tournamentId: number) => {
    if (!isAdmin || !authToken) {
      alert("Admin access required")
      return
    }

    if (!confirm("Are you sure you want to approve this tournament? It will be published to the main list.")) {
      return
    }

    try {
      const response = await fetch("/api/tournaments/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ tournamentId }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Tournament approved successfully!")
        // Reload staged tournaments
        const updatedStaged = await fetchStagedTournaments(authToken)
        setStagedTournaments(updatedStaged)
        // Reload main tournaments list
        const updatedTournaments = await fetchTournaments()
        setTournaments(updatedTournaments)
      } else {
        alert(`Failed to approve tournament: ${data.error || data.message}`)
      }
    } catch (error) {
      console.error("Error approving tournament:", error)
      alert("An error occurred while approving the tournament.")
    }
  }

  const handleToggleFavorite = async (tournamentId: number) => {
    console.log("TournamentFinderClient: handleToggleFavorite called for tournamentId:", tournamentId)
    if (!isLoggedIn || !userData) {
      setShowAuthPromptDialog(true)
      console.log("TournamentFinderClient: Not logged in, showing auth prompt for favorite toggle.")
      return
    }

    const isCurrentlyFavorite = userData.favouriteTournamentIds.includes(tournamentId)
    const action = isCurrentlyFavorite ? "remove" : "add"

    setUserData((prevUserData) => {
      if (!prevUserData) return null
      const currentFavorites = prevUserData.favouriteTournamentIds
      const newFavorites = isCurrentlyFavorite
        ? currentFavorites.filter((id) => id !== tournamentId)
        : [...currentFavorites, tournamentId]
      console.log("TournamentFinderClient: Optimistic UI update for favorites. New favorites:", newFavorites)
      return { ...prevUserData, favouriteTournamentIds: newFavorites }
    })

    console.log(`TournamentFinderClient: Attempting to ${action} tournament ${tournamentId} from favorites via API.`)

    try {
      const response = await fetch("/api/user/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ tournamentId, action }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("TournamentFinderClient: API update favorites successful:", data.message)
        setUserData((prevUserData) =>
          prevUserData ? { ...prevUserData, favouriteTournamentIds: data.favouriteTournamentIds } : null,
        )
      } else {
        console.error("TournamentFinderClient: Failed to update favorites via API:", data.message)
        alert(`Failed to update favorites: ${data.message}`)
        setUserData((prevUserData) => {
          if (!prevUserData) return null
          const currentFavorites = prevUserData.favouriteTournamentIds
          const revertedFavorites = isCurrentlyFavorite
            ? [...currentFavorites, tournamentId]
            : currentFavorites.filter((id) => id !== tournamentId)
          console.log(
            "TournamentFinderClient: Reverting optimistic update on API failure. Reverted favorites:",
            revertedFavorites,
          )
          return { ...prevUserData, favouriteTournamentIds: revertedFavorites }
        })
      }
    } catch (error) {
      console.error("TournamentFinderClient: Error updating favorites via API:", error)
      alert("An error occurred while updating favorites.")
      setUserData((prevUserData) => {
        if (!prevUserData) return null
        const currentFavorites = prevUserData.favouriteTournamentIds
        const revertedFavorites = isCurrentlyFavorite
          ? [...currentFavorites, tournamentId]
          : currentFavorites.filter((id) => id !== tournamentId)
        console.log(
          "TournamentFinderClient: Reverting optimistic update on network error. Reverted favorites:",
          revertedFavorites,
        )
        return { ...prevUserData, favouriteTournamentIds: revertedFavorites }
      })
    }
  }

  const handleFiltersChange = (newFilters: any) => {
    console.log("TournamentFinderClient: handleFiltersChange called with new filters:", newFilters)
    if (newFilters.showFavorites && !isLoggedIn) {
      setShowAuthPromptDialog(true)
      setFilters((prevFilters) => ({ ...newFilters, showFavorites: prevFilters.showFavorites }))
      console.log("TournamentFinderClient: Attempted to show favorites without login, showing auth prompt.")
    } else {
      setFilters(newFilters)
      console.log("TournamentFinderClient: Filters updated.")
    }
  }

  const handleDisciplineToggle = (discipline: string, checked: boolean) => {
    setTournamentForm((prev) => ({
      ...prev,
      disciplines: checked ? [...prev.disciplines, discipline] : prev.disciplines.filter((d) => d !== discipline),
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Sword className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">HEMA Tournament Finder</h1>
            </div>
            {/* Login/Logout Section in Header */}
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  {userIdentity && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span>Hello, {userIdentity}</span>
                    </div>
                  )}
                  <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                        <Plus className="w-4 h-4" />
                        Submit a Tournament
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Submit a Tournament</DialogTitle>
                        <DialogDescription>
                          Share your tournament with the HEMA community. All fields except name are optional.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tournament-name">Tournament Name *</Label>
                          <Input
                            id="tournament-name"
                            value={tournamentForm.name}
                            onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                            placeholder="Enter tournament name"
                            disabled={submitLoading}
                          />
                        </div>

                        <div>
                          <Label htmlFor="tournament-location">Location</Label>
                          <Input
                            id="tournament-location"
                            value={tournamentForm.location}
                            onChange={(e) => setTournamentForm({ ...tournamentForm, location: e.target.value })}
                            placeholder="City, Country"
                            disabled={submitLoading}
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Label htmlFor="tournament-longitude">Longitude</Label>
                            <Input
                              id="tournament-longitude"
                              type="number"
                              step="any"
                              value={tournamentForm.longitude}
                              onChange={(e) => setTournamentForm({ ...tournamentForm, longitude: e.target.value })}
                              placeholder="e.g. 16.3738"
                              disabled={submitLoading}
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="tournament-latitude">Latitude</Label>
                            <Input
                              id="tournament-latitude"
                              type="number"
                              step="any"
                              value={tournamentForm.latitude}
                              onChange={(e) => setTournamentForm({ ...tournamentForm, latitude: e.target.value })}
                              placeholder="e.g. 48.2082"
                              disabled={submitLoading}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="tournament-date">Date</Label>
                          <Input
                            id="tournament-date"
                            type="date"
                            value={tournamentForm.date}
                            onChange={(e) => setTournamentForm({ ...tournamentForm, date: e.target.value })}
                            disabled={submitLoading}
                          />
                        </div>

                        <div>
                          <Label>Disciplines</Label>
                          <div className="space-y-2 mt-2">
                            {tournamentForm.disciplines.map((row, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <select
                                  className="border rounded px-2 py-1 flex-1"
                                  value={row.name}
                                  onChange={e => {
                                    const newRows = [...tournamentForm.disciplines]
                                    newRows[idx].name = e.target.value
                                    setTournamentForm({ ...tournamentForm, disciplines: newRows })
                                  }}
                                  disabled={submitLoading}
                                >
                                  <option value="">Select discipline</option>
                                  {disciplineOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <select
                                  className="border rounded px-2 py-1 flex-1"
                                  value={row.type}
                                  onChange={e => {
                                    const newRows = [...tournamentForm.disciplines]
                                    newRows[idx].type = e.target.value as TournamentType
                                    setTournamentForm({ ...tournamentForm, disciplines: newRows })
                                  }}
                                  disabled={submitLoading}
                                >
                                  <option value="">Select type</option>
                                  {tournamentTypeOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  className="text-red-600 p-2 hover:bg-red-50 rounded"
                                  onClick={() => {
                                    setTournamentForm({
                                      ...tournamentForm,
                                      disciplines: tournamentForm.disciplines.filter((_, i) => i !== idx),
                                    })
                                  }}
                                  disabled={submitLoading}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded border border-blue-200"
                              onClick={() => setTournamentForm({
                                ...tournamentForm,
                                disciplines: [...tournamentForm.disciplines, { name: "", type: "Open" as TournamentType }],
                              })}
                              disabled={submitLoading}
                            >
                              + Add Discipline
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="tournament-description">Description</Label>
                          <Textarea
                            id="tournament-description"
                            value={tournamentForm.description}
                            onChange={(e) => setTournamentForm({ ...tournamentForm, description: e.target.value })}
                            placeholder="Describe your tournament..."
                            rows={3}
                            disabled={submitLoading}
                          />
                        </div>

                        <div>
                          <Label htmlFor="tournament-registration">Officiale Website / Registration Link</Label>
                          <Input
                            id="tournament-registration"
                            type="url"
                            value={tournamentForm.registrationLink}
                            onChange={(e) => setTournamentForm({ ...tournamentForm, registrationLink: e.target.value })}
                            placeholder="https://..."
                            disabled={submitLoading}
                          />
                        </div>

                        <div>
                          <Label htmlFor="tournament-venue">Venue Details</Label>
                          <Textarea
                            id="tournament-venue"
                            value={tournamentForm.venueDetails}
                            onChange={(e) => setTournamentForm({ ...tournamentForm, venueDetails: e.target.value })}
                            placeholder="Venue address and details..."
                            rows={2}
                            disabled={submitLoading}
                          />
                        </div>

                        <div>
                          <Label htmlFor="tournament-contact">Contact Email</Label>
                          <Input
                            id="tournament-contact"
                            type="email"
                            value={tournamentForm.contactEmail}
                            onChange={(e) => setTournamentForm({ ...tournamentForm, contactEmail: e.target.value })}
                            placeholder="contact@tournament.com"
                            disabled={submitLoading}
                          />
                        </div>

                        <div>
                          <Label htmlFor="tournament-rules">Rules Link</Label>
                          <Input
                            id="tournament-rules"
                            type="url"
                            value={tournamentForm.rulesLink}
                            onChange={(e) => setTournamentForm({ ...tournamentForm, rulesLink: e.target.value })}
                            placeholder="https://..."
                            disabled={submitLoading}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setShowSubmitDialog(false)} disabled={submitLoading}>
                            Cancel
                          </Button>
                          <Button onClick={handleSubmitTournament} disabled={submitLoading}>
                            {submitLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Tournament"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" className="flex items-center gap-2" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <LogIn className="w-4 h-4" />
                        Login
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Login</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={loginForm.email}
                            onChange={(e) =>
                              setLoginForm({
                                ...loginForm,
                                email: e.target.value,
                              })
                            }
                            disabled={loginLoading}
                            placeholder="Enter your email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={loginForm.password}
                            onChange={(e) =>
                              setLoginForm({
                                ...loginForm,
                                password: e.target.value,
                              })
                            }
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
                      <Button variant="outline" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Sign Up
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
                            onChange={(e) =>
                              setSignupForm({
                                ...signupForm,
                                email: e.target.value,
                              })
                            }
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
                            onChange={(e) =>
                              setSignupForm({
                                ...signupForm,
                                password: e.target.value,
                              })
                            }
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
                            onChange={(e) =>
                              setSignupForm({
                                ...signupForm,
                                confirmPassword: e.target.value,
                              })
                            }
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Map and Filters Card */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Tournament Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Flex container for filters and map */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Filters Component */}
                  <div className="lg:w-1/3">
                    <TournamentFiltersComponent
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      disciplineOptions={disciplineOptions}
                      tournamentTypeOptions={tournamentTypeOptions}
                    />
                  </div>

                  {/* OpenLayers Map */}
                  <div className="lg:w-2/3">
                    <OpenLayersMap
                      tournaments={filteredTournaments}
                      initialCenter={initialMapCenter}
                      initialZoom={initialMapZoom}
                    />
                    {console.log(
                      "TournamentFinderClient: OpenLayersMap component rendered with filteredTournaments count:",
                      filteredTournaments.length,
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tournament List Card */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Tournaments ({filteredTournaments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Loading tournaments...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTournaments.map((tournament) => (
                      <TournamentCard
                        key={tournament.id}
                        tournament={tournament}
                        isFavorite={userData?.favouriteTournamentIds.includes(tournament.id) || false}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                    {filteredTournaments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No tournaments found matching your filters.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Submitted Tournaments Card - Only visible when logged in */}
          {isLoggedIn && (
          <div className="lg:col-span-1">
            <Card className="h-full border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Plus className="w-5 h-5" />
                  Your Submitted Tournaments ({stagedTournaments.length})
                </CardTitle>
                <p className="text-sm text-amber-600">
                  These tournaments are pending review and will be published once verified.
                </p>
              </CardHeader>
              <CardContent>
                {stagedLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                    <span className="ml-2 text-amber-700">Loading submitted tournaments...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stagedTournaments.map((tournament) => (
                      <Card key={tournament.id} className="bg-white border-amber-100">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{tournament.name}</h3>
                              {tournament.location && (
                                <p className="text-xs text-gray-600 mt-1">📍 {tournament.location}</p>
                              )}
                              {tournament.date && (
                                <p className="text-xs text-gray-600">
                                  📅 {new Date(tournament.date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              )}
                              {tournament.disciplines && tournament.disciplines.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {tournament.disciplines.map((d, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full"
                                    >
                                      {d.name} ({d.type})
                                    </span>
                                  ))}
                                </div>
                              )}
                              {tournament.description && (
                                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                  {tournament.description}
                                </p>
                              )}
                              {tournament.submittedBy && (
                                <p className="text-xs text-gray-500 mt-1">
                                  👤 Submitted by: {tournament.submittedBy}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-amber-600">
                                  ⏳ Pending review
                                </p>
                                {isAdmin && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                                    onClick={() => handleApproveTournament(tournament.id)}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Confirm
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {stagedTournaments.length === 0 && (
                      <div className="text-center py-8 text-amber-600">
                        <p>No pending tournament submissions.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end gap-4 h-16"></div>
        </div>
      </footer>

      {/* Authentication Prompt Dialog */}
      <Dialog open={showAuthPromptDialog} onOpenChange={setShowAuthPromptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Favorites!</DialogTitle>
            <DialogDescription>
              Log in or subscribe to save your favorite tournaments and access them anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAuthPromptDialog(false)}>
              Maybe Later
            </Button>
            <Button
              onClick={() => {
                setShowAuthPromptDialog(false)
                setShowLoginDialog(true)
              }}
            >
              Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
