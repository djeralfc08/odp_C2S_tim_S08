export class AuditLogDto {
  constructor(
    public id: number = 0,
    public user_id: number | null = null,
    public username: string | null = null,
    public action: string = "",
    public entity: string | null = null,
    public entity_id: number | null = null,
    public details: string | null = null,
    public created_at: string = "",
  ) {}
}
