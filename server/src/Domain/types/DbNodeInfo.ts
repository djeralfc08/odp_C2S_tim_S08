import { Pool } from "mysql2/promise";
import { DbNode } from "../models/DbNode";

export interface DbNodeInfo {
  name: string;
  pool: Pool;
  node: DbNode;
  originalPool: Pool;
}
