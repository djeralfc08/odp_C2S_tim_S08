import { AuditLog } from "../../Domain/models/AuditLog";
import { IAuditRepository } from "../../Domain/repositories/audit/IAuditRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";

export class AuditService implements IAuditService {
  public constructor(
    private readonly auditRepo: IAuditRepository
  ) {}

  async getAll(page: number, pageSize: number): Promise<AuditLog[]> {
    return await this.auditRepo.findAll(page, pageSize);
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
