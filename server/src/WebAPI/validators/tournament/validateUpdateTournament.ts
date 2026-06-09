import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { UpdateTournamentDto } from "../../../Domain/DTOs/tournament/CreateTournamentDto";
import { TournamentFormat } from "../../../Domain/enums/TournamentFormat";
import { TournamentStatus } from "../../../Domain/enums/TournamentStatus";
import {
  validateTournamentDates,
  validateTournamentFormat,
  validateTournamentMaxTeams,
  validateTournamentName,
} from "../../../Domain/validators/tournament/tournamentFieldRules";

export type UpdateTournamentContext = {
  currentFormat?: TournamentFormat;
  currentRegistrationDeadline?: string;
  currentStartsAt?: string;
};

export type UpdateTournamentValidation = ValidationResult & { dto?: UpdateTournamentDto };

export const validateUpdateTournament = (
  body: UpdateTournamentDto,
  context: UpdateTournamentContext = {},
): UpdateTournamentValidation => {
  const dto: UpdateTournamentDto = {};

  if (body.name !== undefined) {
    const nameCheck = validateTournamentName(body.name);
    if (!nameCheck.valid) return nameCheck;
    dto.name = body.name.trim();
  }

  if (body.game_id !== undefined) {
    const gameId = parseInt(String(body.game_id), 10);
    if (isNaN(gameId) || gameId < 1) return { valid: false, message: "Invalid game_id" };
    dto.game_id = gameId;
  }

  if (body.format !== undefined) {
    const formatCheck = validateTournamentFormat(body.format);
    if (!formatCheck.valid) return formatCheck;
    dto.format = body.format;
  }

  const effectiveFormat = dto.format ?? context.currentFormat;

  if (body.max_teams !== undefined) {
    const maxTeams = parseInt(String(body.max_teams), 10);
    const maxTeamsCheck = validateTournamentMaxTeams(maxTeams, effectiveFormat);
    if (!maxTeamsCheck.valid) return maxTeamsCheck;
    dto.max_teams = maxTeams;
  }

  if (body.registration_deadline !== undefined) {
    if (!body.registration_deadline.trim()) {
      return { valid: false, message: "registration_deadline cannot be empty" };
    }
    dto.registration_deadline = body.registration_deadline;
  }

  if (body.starts_at !== undefined) {
    if (!body.starts_at.trim()) return { valid: false, message: "starts_at cannot be empty" };
    dto.starts_at = body.starts_at;
  }

  if (body.prize_pool !== undefined) dto.prize_pool = body.prize_pool;

  if (body.status !== undefined) {
    if (!Object.values(TournamentStatus).includes(body.status as TournamentStatus)) {
      return { valid: false, message: "Nevažeći status turnira" };
    }
    dto.status = body.status;
  }

  if (Object.keys(dto).length === 0) {
    return { valid: false, message: "No fields to update" };
  }

  const deadline =
    dto.registration_deadline ??
    context.currentRegistrationDeadline;
  const startsAt = dto.starts_at ?? context.currentStartsAt;

  if (deadline && startsAt) {
    const datesCheck = validateTournamentDates(deadline, startsAt);
    if (!datesCheck.valid) return datesCheck;
  } else if (dto.registration_deadline && context.currentStartsAt) {
    const datesCheck = validateTournamentDates(
      dto.registration_deadline,
      context.currentStartsAt,
    );
    if (!datesCheck.valid) return datesCheck;
  } else if (context.currentRegistrationDeadline && dto.starts_at) {
    const datesCheck = validateTournamentDates(
      context.currentRegistrationDeadline,
      dto.starts_at,
    );
    if (!datesCheck.valid) return datesCheck;
  }

  return { valid: true, dto };
};
