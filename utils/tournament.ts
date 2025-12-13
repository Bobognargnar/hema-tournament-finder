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

export const tournamentTypeOptions: TournamentType[] = ["Male", "Female", "Open", "Other"]

export const getTournamentTypeColor = (type: TournamentType): string => {
  switch (type) {
    case "Male":
      return "!bg-blue-100 !text-blue-800 border-blue-200"
    case "Female":
      return "!bg-pink-100 !text-pink-800 border-pink-200"
    case "Open":
      return "!bg-gray-100 !text-gray-800 border-gray-200"
    case "Other":
      return "!bg-purple-100 !text-purple-800 border-purple-200"
    default:
      return "!bg-gray-100 !text-gray-800 border-gray-200"
  }
}
