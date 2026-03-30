import fs from "node:fs/promises";
import path from "node:path";
import { fromJSON } from "@knowledgeview/kg-core";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";

const DATA_DIR = path.join(process.cwd(), "../../data");

export async function loadGraph(filename: string): Promise<KnowledgeGraph> {
  const safeName = filename.endsWith(".kg.json")
    ? filename
    : `${filename}.kg.json`;

  const filepath = path.join(DATA_DIR, safeName);
  const content = await fs.readFile(filepath, "utf-8");
  return fromJSON(content);
}
