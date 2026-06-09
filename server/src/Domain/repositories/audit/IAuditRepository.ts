import { AuditLog } from "../../models/AuditLog";
import { AuditLogDto } from "../../DTOs/audit/AuditLogDto";

export interface IAuditRepository {
  findAll(page: number, pageSize: number): Promise<AuditLogDto[]>;
  countAll(): Promise<number>;
  create(log: AuditLog): Promise<boolean>;
}