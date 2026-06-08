import { AuditLog } from "../../models/AuditLog";

export interface IAuditService {
  getAll(page: number, pageSize: number): Promise<AuditLog[]>;
  log(
    userId: number | null,
    action: string,
    entity?: string | null,
    entityId?: number | null,
    details?: string | null,
  ): Promise<void>;
}