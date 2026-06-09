import { AuditLog } from "../../Domain/models/AuditLog";
import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { AuditLogDto } from "../../Domain/DTOs/audit/AuditLogDto";
import { IAuditRepository } from "../../Domain/repositories/audit/IAuditRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";

export class AuditService implements IAuditService {
  public constructor(
    private readonly auditRepo: IAuditRepository
  ) {}

  async getAll(page: number, pageSize: number): Promise<PaginatedListDto<AuditLogDto>> {
    const [items, total] = await Promise.all([
      this.auditRepo.findAll(page, pageSize),
      this.auditRepo.countAll(),
    ]);
    return new PaginatedListDto(items, total, page, pageSize);
  }

  async log(
    userId: number | null,
    action: string,
    entity?: string | null,
    entityId?: number | null,
    details?: string | null,
  ): Promise<void> {
    await this.auditRepo.create(
      new AuditLog(0, userId, action, entity ?? null, entityId ?? null, details ?? null),
    );
  }
}
