import { ValidationResult } from "../../types/ValidationResult";
import { TournamentFormat } from "../../enums/TournamentFormat";

const ELIMINATION_FORMATS = new Set<TournamentFormat>([
  TournamentFormat.SE,
  TournamentFormat.DE,
]);

export const isPowerOfTwo = (n: number): boolean => n > 0 && (n & (n - 1)) === 0;

export const validateTournamentName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 3 || trimmed.length > 120) {
    return { valid: false, message: "Naziv turnira je obavezan" };
  }
  return { valid: true };
};

export const validateTournamentFormat = (format?: TournamentFormat): ValidationResult => {
  if (!format || !Object.values(TournamentFormat).includes(format)) {
    return { valid: false, message: "Izaberite validan format" };
  }
  return { valid: true };
};

export const validateTournamentMaxTeams = (
  maxTeams: number,
  format?: TournamentFormat,
): ValidationResult => {
  if (isNaN(maxTeams) || maxTeams < 4 || maxTeams > 256) {
    return {
      valid: false,
      message: "Broj timova mora biti između 4 i 256",
    };
  }
  if (format && ELIMINATION_FORMATS.has(format) && !isPowerOfTwo(maxTeams)) {
    return {
      valid: false,
      message: "Broj timova mora biti stepen broja 2 (4, 8, 16...)",
    };
  }
  return { valid: true };
};

export const validateTournamentDates = (
  registrationDeadline: string,
  startsAt: string,
): ValidationResult => {
  const deadline = new Date(registrationDeadline);
  const start = new Date(startsAt);
  const now = new Date();

  if (isNaN(deadline.getTime()) || isNaN(start.getTime())) {
    return { valid: false, message: "Nevalidan format datuma" };
  }
  if (deadline <= now) {
    return { valid: false, message: "Rok prijave mora biti u budućnosti" };
  }
  if (deadline >= start) {
    return {
      valid: false,
      message: "Rok prijave mora biti pre početka turnira",
    };
  }
  return { valid: true };
};

export const validateTournamentDatesForUpdate = (
  registrationDeadline: string,
  startsAt: string,
): ValidationResult => {
  const deadline = new Date(registrationDeadline);
  const start = new Date(startsAt);

  if (isNaN(deadline.getTime()) || isNaN(start.getTime())) {
    return { valid: false, message: "Nevalidan format datuma" };
  }
  if (deadline >= start) {
    return {
      valid: false,
      message: "Rok prijave mora biti pre početka turnira",
    };
  }
  return { valid: true };
};
