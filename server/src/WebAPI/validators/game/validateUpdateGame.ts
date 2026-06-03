import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { UpdateGameDto } from "../../../Domain/DTOs/game/CreateGameDto";

export type UpdateGameValidation = ValidationResult & { dto?: UpdateGameDto };

export const validateUpdateGame = (body: UpdateGameDto): UpdateGameValidation => {
  const dto: UpdateGameDto = {};

  if (body.name !== undefined) {
    if (!body.name.trim()) {
      return { valid: false, message: "Name cannot be empty" };
    }
    dto.name = body.name;
  }
  if (body.logo_url !== undefined) dto.logo_url = body.logo_url;
  if (body.genre !== undefined) dto.genre = body.genre;
  if (body.max_team_size !== undefined) {
    const maxTeamSize = parseInt(String(body.max_team_size), 10);
    if (isNaN(maxTeamSize) || maxTeamSize < 1 || maxTeamSize > 20) {
      return { valid: false, message: "max_team_size must be between 1 and 20" };
    }
    dto.max_team_size = maxTeamSize;
  }

  if (Object.keys(dto).length === 0) {
    return { valid: false, message: "No fields to update" };
  }

  return { valid: true, dto };
};
