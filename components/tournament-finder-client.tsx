"use client"

import { useState, useMemo, useEffect } from "react"
import type { Tournament, DisciplineDetail } from "@/types/tournament"
import { disciplineOptions, tournamentTypeOptions } from "@/utils/tournament"
import { TournamentFiltersComponent } from "@/components/tournament-filters"
import TournamentCard from "@/components/tournament-card"
import { OpenLayersMap } from "@/components/OpenLayersMap"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Sword, Map, LogIn, Loader2, LogOut, User } from "lucide-react"

interface UserData {
  name: string
  favouriteTournamentIds: number[]
}

interface TournamentFinderClientProps {
  initialTournaments: Tournament[]
  initialMapCenter: [number, number] // [longitude, latitude]
  initialMapZoom: number // New prop for initial zoom
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
  const [loading, setLoading] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
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
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showAuthPromptDialog, setShowAuthPromptDialog] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)

  // Check for existing auth token on mount
  useEffect(() => {
    console.log("TournamentFinderClient: useEffect for auth token check triggered.")
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("authToken")
      if (storedToken) {
        setAuthToken(storedToken)
        setIsLoggedIn(true)
        console.log("TournamentFinderClient: Found stored auth token.")
        // Fetch user data with the stored token
        fetchUserDataWithToken(storedToken)
      } else {
        console.log("TournamentFinderClient: No stored auth token found.")
      }
    }
  }, [])

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
        setAuthToken(token)
        setIsLoggedIn(true)

        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", token)
          console.log("TournamentFinderClient: Auth token stored in localStorage.")
        }

        console.log("TournamentFinderClient: Login successful! Token:", token)
        setShowLoginDialog(false)
        setLoginForm({ email: "", password: "" })
        await fetchUserDataWithToken(token)
      } else {
        console.error("TournamentFinderClient: Login failed:", data.message)
        alert(`Login failed: ${data.message}`)
      }
    } catch (error) {
      console.error("TournamentFinderClient: Error during login:", error)
      alert("An error occurred during login.")
    } finally {
      setLoginLoading(false)
      console.log("TournamentFinderClient: Login attempt finished.")
    }
  }

  const handleLogout = () => {
    console.log("TournamentFinderClient: handleLogout called.")
    setAuthToken(null)
    setIsLoggedIn(false)
    setUserData(null)
    setFilters((prevFilters) => ({ ...prevFilters, showFavorites: false }))

    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken")
      console.log("TournamentFinderClient: Auth token removed from localStorage.")
    }

    console.log("TournamentFinderClient: Logged out.")
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
                  {userData && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span>Hello, {userData.name}</span>
                    </div>
                  )}
                  <Button variant="ghost" className="flex items-center gap-2" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
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
                  <div className="lg:w-2/3 h-[400px]">
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
