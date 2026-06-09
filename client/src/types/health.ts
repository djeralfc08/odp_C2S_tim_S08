export type NodeStatus = 'healthy' | 'degraded' | 'offline';
export type DbNodeRole = 'master' | 'slave';

export interface DbNodeHealth {
  name: string;
  host: string;
  port: number;
  status: NodeStatus;
  latency: number | null;
  last_check: string;
  role: DbNodeRole;
  promoted?: boolean;
  original_role?: DbNodeRole;
  failover_at?: string | null;
}

export interface ApiNodeHealth {
  id: number;
  port: number;
  url: string;
  status: NodeStatus;
  latency: number | null;
  last_check: string;
}
