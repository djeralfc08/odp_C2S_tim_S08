import { TournamentRegistrationDto } from "../../DTOs/tournament/CreateTournamentDto";
import { TournamentRegistrationStatus } from "../../enums/TournamentRegistrationStatus";

export type RegistrationResult = { success: true } | { success: false; message: string };

export interface ITournamentRegistrationService {
  getByTournamentId(tournamentId: number): Promise<TournamentRegistrationDto[]>;
  register(tournamentId: number, teamId: number, userId: number): Promise<RegistrationResult>;
  unregister(tournamentId: number, teamId: number): Promise<boolean>;
  updateStatus(
    tournamentId: number,
    teamId: number,
    status: TournamentRegistrationStatus,
  ): Promise<boolean>;

  generateBracket(tournamentId: number): Promise<boolean>;
}
