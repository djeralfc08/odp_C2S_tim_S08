export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface PaginatedAuditLogs {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}
