import type { TournamentType } from "@/types/tournament"
import { TOURNAMENT_TYPE_STYLES } from "@/types/tournament"
export { disciplineOptions } from "@/shared/disciplines"

// All available tournament types for selection
export const tournamentTypeOptions: TournamentType[] = ["Open", "Men", "Women", "Women+", "Beginner", "Invitational", "Other"]

export const getTournamentTypeColor = (type: TournamentType): string => {
  const style = TOURNAMENT_TYPE_STYLES[type]
  if (!style) {
    return "!bg-gray-100 !text-gray-800 border-gray-200"
  }
  // Convert hex colors to Tailwind-compatible format
  switch (type) {
    case "Men":
      return "!bg-blue-100 !text-blue-800 border-blue-200"
    case "Women":
      return "!bg-pink-100 !text-pink-800 border-pink-200"
    case "Women+":
      return "!bg-pink-50 !text-pink-700 border-pink-300"
    case "Open":
      return "!bg-gray-100 !text-gray-800 border-gray-200"
    case "Beginner":
      return "!bg-green-100 !text-green-800 border-green-200"
    case "Invitational":
      return "!bg-amber-100 !text-amber-800 border-amber-200"
    case "Other":
      return "!bg-purple-100 !text-purple-800 border-purple-200"
    default:
      return "!bg-gray-100 !text-gray-800 border-gray-200"
  }
}
