import fs from "node:fs/promises";
import path from "node:path";
import { fromJSON } from "@knowledgeview/kg-core";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";

const DATA_DIR = path.join(process.cwd(), "../../data");

export async function loadGraph(filename: string): Promise<KnowledgeGraph> {
  const safeName = filename.endsWith(".kg.json")
    ? filename
    : `${filename}.kg.json`;

  const filepath = path.resolve(DATA_DIR, safeName);
  if (!filepath.startsWith(path.resolve(DATA_DIR))) {
    throw new Error("Invalid graph file path");
  }

  const content = await fs.readFile(filepath, "utf-8");
  return fromJSON(content);
}
