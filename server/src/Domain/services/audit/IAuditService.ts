import { AuditLog } from "../../models/AuditLog";

export interface IAuditService {
  getAll(page: number, pageSize: number): Promise<AuditLog[]>;
}