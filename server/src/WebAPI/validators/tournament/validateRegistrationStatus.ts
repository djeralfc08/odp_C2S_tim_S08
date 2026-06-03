import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { TournamentRegistrationStatus } from "../../../Domain/enums/TournamentRegistrationStatus";

export type RegistrationStatusValidation = ValidationResult & {
  status?: TournamentRegistrationStatus;
};

export const validateRegistrationStatus = (body: {
  status?: string;
}): RegistrationStatusValidation => {
  const status = body.status as TournamentRegistrationStatus | undefined;
  if (!status || !Object.values(TournamentRegistrationStatus).includes(status)) {
    return {
      valid: false,
      message: "Status mora biti pending, confirmed ili disqualified",
    };
  }
  return { valid: true, status };
};
