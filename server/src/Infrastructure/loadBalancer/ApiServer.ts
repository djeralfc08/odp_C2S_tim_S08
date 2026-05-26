import { NodeStatus } from "../../Domain/enums/NodeStatus";

export class ApiServer {
  public status: NodeStatus = NodeStatus.OFFLINE;
  public lastCheck: Date = new Date();
  public latencyMs: number | null = null;
  public activeConnections = 0;
  public weight: number;

  constructor(
    public readonly id: number,
    public readonly url: string,
    public readonly port: number,
    weight = 1,
  ) {
    this.weight = Math.max(1, weight);
  }
}
