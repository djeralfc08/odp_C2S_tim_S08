import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { AuditLogDto } from "../../DTOs/audit/AuditLogDto";

export interface IAuditService {
  getAll(page: number, pageSize: number): Promise<PaginatedListDto<AuditLogDto>>;
  log(
    userId: number | null,
    action: string,
    entity?: string | null,
    entityId?: number | null,
    details?: string | null,
  ): Promise<void>;
}