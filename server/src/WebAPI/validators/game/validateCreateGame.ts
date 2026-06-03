import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { CreateGameDto } from "../../../Domain/DTOs/game/CreateGameDto";

export type CreateGameValidation = ValidationResult & { dto?: CreateGameDto };

export const validateCreateGame = (body: {
  name?: string;
  logo_url?: string;
  genre?: string;
  max_team_size?: number;
}): CreateGameValidation => {
  const name = body.name?.trim() ?? "";
  const maxTeamSize = parseInt(String(body.max_team_size ?? ""), 10);

  if (!name) {
    return { valid: false, message: "Name is required" };
  }
  if (isNaN(maxTeamSize) || maxTeamSize < 1 || maxTeamSize > 20) {
    return { valid: false, message: "max_team_size must be between 1 and 20" };
  }

  return {
    valid: true,
    dto: new CreateGameDto(name, body.logo_url, body.genre, maxTeamSize),
  };
};
