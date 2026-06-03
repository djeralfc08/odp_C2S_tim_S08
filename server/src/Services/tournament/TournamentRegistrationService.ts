import { ITournamentRegistrationService } from "../../Domain/services/tournament/ITournamentRegistrationService";
import { ITournamentRepository } from "../../Domain/repositories/tournament/ITournamentRepository";
import { ITournamentRegistrationRepository } from "../../Domain/repositories/tournament/ITournamentRegistrationRepository";
import { ITeamRepository } from "../../Domain/repositories/team/ITeamRepository";
import { TournamentRegistrationDto } from "../../Domain/DTOs/tournament/CreateTournamentDto";
import { TournamentRegistration } from "../../Domain/models/TournamentRegistration";
import { TournamentRegistrationStatus } from "../../Domain/enums/TournamentRegistrationStatus";
import { TournamentStatus } from "../../Domain/enums/TournamentStatus";

export class TournamentRegistrationService implements ITournamentRegistrationService {
  public constructor(
    private readonly tournamentRepo: ITournamentRepository,
    private readonly registrationRepo: ITournamentRegistrationRepository,
    private readonly teamRepo: ITeamRepository,
  ) {}

  async getByTournamentId(tournamentId: number): Promise<TournamentRegistrationDto[]> {
    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) return [];

    const rows = await this.registrationRepo.findByTournamentId(tournamentId);
    return rows.map((r) => this.toDto(r));
  }

  async register(tournamentId: number, teamId: number, userId: number): Promise<boolean> {
    const isCaptain = await this.teamRepo.isCaptain(teamId, userId);
    if (!isCaptain) return false;

    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) return false;
    if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) return false;
    if (new Date() > tournament.registrationDeadline) return false;

    const count = await this.registrationRepo.countByTournamentId(tournamentId);
    if (count >= tournament.maxTeams) return false;

    const existing = await this.registrationRepo.findByTournamentAndTeam(tournamentId, teamId);
    if (existing) return false;

    const created = await this.registrationRepo.create(tournamentId, teamId);
    return created !== null;
  }

  async unregister(tournamentId: number, teamId: number): Promise<boolean> {
    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) return false;
    if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) return false;

    const existing = await this.registrationRepo.findByTournamentAndTeam(tournamentId, teamId);
    if (!existing) return false;

    return this.registrationRepo.delete(tournamentId, teamId);
  }

  async updateStatus(
    tournamentId: number,
    teamId: number,
    status: TournamentRegistrationStatus,
  ): Promise<boolean> {
    if (!Object.values(TournamentRegistrationStatus).includes(status)) return false;

    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) return false;

    const existing = await this.registrationRepo.findByTournamentAndTeam(tournamentId, teamId);
    if (!existing) return false;

    return this.registrationRepo.updateStatus(tournamentId, teamId, status);
  }

  private toDto(reg: TournamentRegistration): TournamentRegistrationDto {
    return new TournamentRegistrationDto(
      reg.teamId,
      reg.tournamentId,
      reg.teamId,
      reg.teamName,
      reg.teamTag,
      reg.registeredAt.toISOString(),
      reg.status,
      reg.seed,
    );
  }
}
