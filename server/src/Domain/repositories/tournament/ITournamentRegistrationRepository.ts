import { TournamentRegistration } from "../../models/TournamentRegistration";
import { TournamentRegistrationStatus } from "../../enums/TournamentRegistrationStatus";

export interface ITournamentRegistrationRepository {
  findByTournamentId(tournamentId: number): Promise<TournamentRegistration[]>;
  findByTournamentAndTeam(
    tournamentId: number,
    teamId: number,
  ): Promise<TournamentRegistration | null>;
  countByTournamentId(tournamentId: number): Promise<number>;
  existsOnWrite(tournamentId: number, teamId: number): Promise<boolean>;
  create(tournamentId: number, teamId: number): Promise<boolean>;
  delete(tournamentId: number, teamId: number): Promise<boolean>;
  updateStatus(
    tournamentId: number,
    teamId: number,
    status: TournamentRegistrationStatus,
  ): Promise<boolean>;
}
