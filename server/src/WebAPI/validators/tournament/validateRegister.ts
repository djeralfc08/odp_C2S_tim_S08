import { ValidationResult } from "../../../Domain/types/ValidationResult";

export type RegisterValidation = ValidationResult & { teamId?: number };

export const validateRegister = (body: { team_id?: number }): RegisterValidation => {
  const teamId = parseInt(String(body.team_id ?? ""), 10);
  if (isNaN(teamId) || teamId < 1) {
    return { valid: false, message: "Valid team_id is required" };
  }
  return { valid: true, teamId };
};
