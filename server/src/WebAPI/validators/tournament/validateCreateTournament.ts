import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { CreateTournamentDto } from "../../../Domain/DTOs/tournament/CreateTournamentDto";
import { TournamentFormat } from "../../../Domain/enums/TournamentFormat";
import {
  validateTournamentDates,
  validateTournamentFormat,
  validateTournamentMaxTeams,
  validateTournamentName,
} from "../../../Domain/validators/tournament/tournamentFieldRules";

export type CreateTournamentValidation = ValidationResult & { dto?: CreateTournamentDto };

export const validateCreateTournament = (body: {
  name?: string;
  game_id?: number;
  format?: string;
  max_teams?: number;
  registration_deadline?: string;
  starts_at?: string;
  prize_pool?: string | null;
}): CreateTournamentValidation => {
  const name = body.name ?? "";
  const gameId = parseInt(String(body.game_id ?? ""), 10);
  const maxTeams = parseInt(String(body.max_teams ?? ""), 10);
  const format = body.format as TournamentFormat | undefined;
  const registrationDeadline = body.registration_deadline?.trim() ?? "";
  const startsAt = body.starts_at?.trim() ?? "";

  const nameCheck = validateTournamentName(name);
  if (!nameCheck.valid) return nameCheck;

  if (isNaN(gameId) || gameId < 1) {
    return { valid: false, message: "Valid game_id is required" };
  }

  const formatCheck = validateTournamentFormat(format);
  if (!formatCheck.valid) return formatCheck;

  const maxTeamsCheck = validateTournamentMaxTeams(maxTeams, format);
  if (!maxTeamsCheck.valid) return maxTeamsCheck;

  if (!registrationDeadline || !startsAt) {
    return { valid: false, message: "registration_deadline i starts_at su obavezni" };
  }

  const datesCheck = validateTournamentDates(registrationDeadline, startsAt);
  if (!datesCheck.valid) return datesCheck;

  return {
    valid: true,
    dto: new CreateTournamentDto(
      name.trim(),
      gameId,
      format!,
      maxTeams,
      registrationDeadline,
      startsAt,
      body.prize_pool ?? null,
    ),
  };
};
