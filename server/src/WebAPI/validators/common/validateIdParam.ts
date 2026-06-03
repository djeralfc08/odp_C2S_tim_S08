import { ValidationResult } from "../../../Domain/types/ValidationResult";

export type IdParamValidation = ValidationResult & { value?: number };

export const validateIdParam = (
  raw: string | undefined,
  label = "id",
): IdParamValidation => {
  const n = parseInt(raw ?? "", 10);
  if (isNaN(n) || n < 1) {
    return { valid: false, message: `Invalid ${label}` };
  }
  return { valid: true, value: n };
};
