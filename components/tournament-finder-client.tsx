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
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("authToken")
      if (storedToken) {
        setAuthToken(storedToken)
        setIsLoggedIn(true)
        // Fetch user data with the stored token
        fetchUserDataWithToken(storedToken)
      }
    }
  }, [])

  // Filter tournaments based on current filters
  const filteredTournaments = useMemo(() => {
    let filtered = tournaments

    const filterStartDate = filters.startDate ? new Date(filters.startDate) : null
    const filterEndDate = filters.endDate ? new Date(filters.endDate) : null

    if (filterStartDate) {
      filtered = filtered.filter((t) => {
        const tournamentDate = new Date(t.date)
        return tournamentDate.getTime() >= filterStartDate.getTime()
      })
    }

    if (filterEndDate) {
      filtered = filtered.filter((t) => {
        const tournamentDate = new Date(t.date)
        return tournamentDate.getTime() <= filterEndDate.getTime()
      })
    }

    if (filters.disciplines.length > 0) {
      filtered = filtered.filter((t) =>
        t.disciplines.some((d: DisciplineDetail) => filters.disciplines.includes(d.name)),
      )
    }

    if (filters.selectedTypes.length > 0) {
      filtered = filtered.filter((t) =>
        t.disciplines.some((d: DisciplineDetail) => filters.selectedTypes.includes(d.type)),
      )
    }

    // Apply new favorite filter
    if (filters.showFavorites && userData) {
      filtered = filtered.filter((t) => userData.favouriteTournamentIds.includes(t.id))
    }

    return filtered
  }, [tournaments, filters, userData])

  const fetchUserDataWithToken = async (token: string) => {
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
        console.log("User data fetched:", data.user)
      } else {
        console.error("Failed to fetch user data:", data.message)
        handleLogout()
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      handleLogout()
    }
  }

  const fetchUserData = async () => {
    if (!authToken) {
      console.warn("No auth token available to fetch user data.")
      return
    }
    await fetchUserDataWithToken(authToken)
  }

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
        setAuthToken(token)
        setIsLoggedIn(true)

        // Store token in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", token)
        }

        console.log("Login successful! Token:", token)
        setShowLoginDialog(false)

        // Clear login form
        setLoginForm({ email: "", password: "" })

        // Fetch user data immediately after setting the token
        await fetchUserDataWithToken(token)
      } else {
        console.error("Login failed:", data.message)
        alert(`Login failed: ${data.message}`)
      }
    } catch (error) {
      console.error("Error during login:", error)
      alert("An error occurred during login.")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    setAuthToken(null)
    setIsLoggedIn(false)
    setUserData(null)
    setFilters((prevFilters) => ({ ...prevFilters, showFavorites: false }))

    // Remove token from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken")
    }

    console.log("Logged out.")
  }

  const handleToggleFavorite = async (tournamentId: number) => {
    if (!isLoggedIn || !userData) {
      setShowAuthPromptDialog(true)
      return
    }

    const isCurrentlyFavorite = userData.favouriteTournamentIds.includes(tournamentId)
    const action = isCurrentlyFavorite ? "remove" : "add"

    // Optimistic UI update
    setUserData((prevUserData) => {
      if (!prevUserData) return null
      const currentFavorites = prevUserData.favouriteTournamentIds
      const newFavorites = isCurrentlyFavorite
        ? currentFavorites.filter((id) => id !== tournamentId)
        : [...currentFavorites, tournamentId]
      return { ...prevUserData, favouriteTournamentIds: newFavorites }
    })

    console.log(`Attempting to ${action} tournament ${tournamentId} from favorites via API.`)

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
        console.log(data.message)
        setUserData((prevUserData) =>
          prevUserData ? { ...prevUserData, favouriteTournamentIds: data.favouriteTournamentIds } : null,
        )
      } else {
        console.error("Failed to update favorites:", data.message)
        alert(`Failed to update favorites: ${data.message}`)
        // Revert optimistic update on failure
        setUserData((prevUserData) => {
          if (!prevUserData) return null
          const currentFavorites = prevUserData.favouriteTournamentIds
          const revertedFavorites = isCurrentlyFavorite
            ? [...currentFavorites, tournamentId]
            : currentFavorites.filter((id) => id !== tournamentId)
          return { ...prevUserData, favouriteTournamentIds: revertedFavorites }
        })
      }
    } catch (error) {
      console.error("Error updating favorites:", error)
      alert("An error occurred while updating favorites.")
      // Revert optimistic update on network error
      setUserData((prevUserData) => {
        if (!prevUserData) return null
        const currentFavorites = prevUserData.favouriteTournamentIds
        const revertedFavorites = isCurrentlyFavorite
          ? [...currentFavorites, tournamentId]
          : currentFavorites.filter((id) => id !== tournamentId)
        return { ...prevUserData, favouriteTournamentIds: revertedFavorites }
      })
    }
  }

  const handleFiltersChange = (newFilters: any) => {
    if (newFilters.showFavorites && !isLoggedIn) {
      setShowAuthPromptDialog(true)
      setFilters((prevFilters) => ({ ...newFilters, showFavorites: prevFilters.showFavorites }))
    } else {
      setFilters(newFilters)
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
