import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { TournamentFilters } from "../../../Domain/repositories/tournament/ITournamentRepository";
import { TournamentFormat } from "../../../Domain/enums/TournamentFormat";
import { TournamentStatus } from "../../../Domain/enums/TournamentStatus";

export type ListFiltersValidation = ValidationResult & { filters?: TournamentFilters };

export const validateListFilters = (query: {
  game_id?: string;
  status?: string;
  format?: string;
  fresh?: string;
}): ListFiltersValidation => {
  const filters: TournamentFilters = {};

  if (query.game_id !== undefined) {
    const gameId = parseInt(query.game_id, 10);
    if (isNaN(gameId) || gameId < 1) {
      return { valid: false, message: "Invalid game_id filter" };
    }
    filters.gameId = gameId;
  }

  if (query.status !== undefined) {
    if (!Object.values(TournamentStatus).includes(query.status as TournamentStatus)) {
      return { valid: false, message: "Invalid status filter" };
    }
    filters.status = query.status;
  }

  if (query.format !== undefined) {
    if (!Object.values(TournamentFormat).includes(query.format as TournamentFormat)) {
      return { valid: false, message: "Invalid format filter" };
    }
    filters.format = query.format;
  }

  if (query.fresh === "1" || query.fresh === "true") {
    filters.fromWrite = true;
  }

  return { valid: true, filters };
};
