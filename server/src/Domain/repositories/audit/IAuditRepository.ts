import { AuditLog } from "../../models/AuditLog";

export interface IAuditRepository {
  findAll(page: number, pageSize: number): Promise<AuditLog[]>;
}