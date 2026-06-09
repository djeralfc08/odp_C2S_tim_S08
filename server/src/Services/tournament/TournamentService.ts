import { ITournamentService } from "../../Domain/services/tournament/ITournamentService";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import {
  ITournamentRepository,
  TournamentFilters,
} from "../../Domain/repositories/tournament/ITournamentRepository";
import {
  CreateTournamentDto,
  TournamentDto,
  UpdateTournamentDto,
} from "../../Domain/DTOs/tournament/CreateTournamentDto";
import { Tournament } from "../../Domain/models/Tournament";
import { TournamentFormat } from "../../Domain/enums/TournamentFormat";
import {
  validateTournamentMaxTeams,
  validateTournamentName,
} from "../../Domain/validators/tournament/tournamentFieldRules";

export class TournamentService implements ITournamentService {
  public constructor(
    private readonly tournamentRepo: ITournamentRepository,
    private readonly auditService: IAuditService,
  ) {}

  async getAll(filters?: TournamentFilters): Promise<TournamentDto[]> {
    const rows = await this.tournamentRepo.findAll(filters);
    return rows.map((t) => this.toDto(t));
  }

  async getById(id: number): Promise<TournamentDto | null> {
    const tournament = await this.tournamentRepo.findById(id);
    if (!tournament) return null;
    return this.toDto(tournament);
  }

  async create(userId: number, dto: CreateTournamentDto): Promise<TournamentDto | null> {
    if (!validateTournamentName(dto.name).valid) return null;
    if (!dto.game_id || dto.game_id < 1) return null;
    if (!Object.values(TournamentFormat).includes(dto.format)) return null;
    if (!validateTournamentMaxTeams(dto.max_teams, dto.format).valid) return null;
    if (!dto.registration_deadline || !dto.starts_at) return null;

    const existing = await this.tournamentRepo.findByName(dto.name);
    if (existing) return null;

    const created = await this.tournamentRepo.create(dto);
    if (created.id === 0) return null;

    await this.auditService.log(userId, "CREATE", "tournament", created.id);
    return this.toDto(created);
  }

  async update(userId: number, id: number, dto: UpdateTournamentDto): Promise<boolean> {
    const current = await this.tournamentRepo.findById(id);
    if (!current) return false;

    if (dto.name !== undefined && !validateTournamentName(dto.name).valid) return false;
    if (dto.max_teams !== undefined) {
      const format = dto.format ?? current.format;
      if (!validateTournamentMaxTeams(dto.max_teams, format).valid) return false;
    }
    if (dto.format !== undefined && !Object.values(TournamentFormat).includes(dto.format)) {
      return false;
    }

    if (dto.name !== undefined) {
      const duplicate = await this.tournamentRepo.findByName(dto.name);
      if (duplicate && duplicate.id !== id) return false;
    }

    const ok = await this.tournamentRepo.update(id, dto);
    if (ok) await this.auditService.log(userId, "UPDATE", "tournament", id);
    return ok;
  }

  async delete(userId: number, id: number): Promise<boolean> {
    const current = await this.tournamentRepo.findById(id);
    if (!current) return false;
    const ok = await this.tournamentRepo.delete(id);
    if (ok) await this.auditService.log(userId, "DELETE", "tournament", id);
    return ok;
  }

  private toDto(tournament: Tournament): TournamentDto {
    return new TournamentDto(
      tournament.id,
      tournament.name,
      tournament.gameId,
      tournament.gameName,
      tournament.format,
      tournament.maxTeams,
      tournament.registrationDeadline.toISOString(),
      tournament.startsAt.toISOString(),
      tournament.prizePool,
      tournament.status,
      tournament.registeredTeamsCount,
    );
  }
}
