import { NodeStatus } from "../enums/NodeStatus";

export type DbNodeOriginalRole = "master" | "slave";

export class DbNode {
  public status: NodeStatus    = NodeStatus.OFFLINE;
  public lastCheck: Date       = new Date();
  public latencyMs: number | null = null;
  public successfulWrites: number = 0;
  public failedWrites: number  = 0;
  public promoted: boolean       = false;
  public originalRole: DbNodeOriginalRole;
  public failoverAt: Date | null = null;
  public excludedFromReads: boolean = false;

  constructor(
    public readonly name: string,
    public host: string,
    public port: number,
    originalRole?: DbNodeOriginalRole,
  ) {
    this.originalRole = originalRole ?? (name === "master" ? "master" : "slave");
  }
}
