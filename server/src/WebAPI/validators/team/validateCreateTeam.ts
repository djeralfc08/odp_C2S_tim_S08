import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { CreateTeamDto } from "../../../Domain/DTOs/team/CreateTeamDto";

export const validateCreateTeam = (body: CreateTeamDto): ValidationResult & { dto?: CreateTeamDto } => {
  const name = body.name?.trim();
  const tag = body.tag?.trim();

  if (!name || name.length < 2 || name.length > 80) {
    return { valid: false, message: "Team name must be 2-80 characters" };
  }

  if (!tag || tag.length < 2 || tag.length > 6 || !/^[A-Z0-9]+$/.test(tag)) {
    return { valid: false, message: "Team tag must be 2-6 uppercase letters or numbers" };
  }

  return {
    valid: true,
    dto: new CreateTeamDto(
      name,
      tag,
      body.logoUrl ?? null,
      body.description ?? null
    ),
  };
};