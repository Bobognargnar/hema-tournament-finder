import type { TournamentType } from "@/types/tournament"

export const disciplineOptions = [
  "Longsword",
  "Rapier",
  "Sabre",
  "Smallsword",
  "Dagger",
  "Sword & Buckler",
  "Messer",
  "Polearms",
]

export const tournamentTypeOptions: TournamentType[] = ["Male", "Female", "Open"]

export const getTournamentTypeColor = (type: TournamentType): string => {
  switch (type) {
    case "Male":
      return "bg-blue-100 text-blue-800"
    case "Female":
      return "bg-pink-100 text-pink-800"
    case "Open":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
