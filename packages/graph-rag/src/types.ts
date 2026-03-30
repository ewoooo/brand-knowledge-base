import type { Node, Triple } from "@knowledgeview/kg-core";

export interface ExtractionResult {
  entities: {
    nodeId: string;
    label: string;
    matchType: "exact" | "partial" | "semantic";
  }[];
  predicateHints: string[];
  typeHints: string[];
  mode: "keyword" | "llm";
}

export interface SubGraph {
  nodes: Node[];
  triples: Triple[];
  metadata: {
    startNodes: string[];
    depth: number;
    totalHops: number;
  };
}

export interface PipelineOptions {
  depth?: number;
  extractorMode?: "keyword" | "llm";
  maxNodes?: number;
}

export interface PipelineResult {
  context: string;
  subgraph: SubGraph;
  extraction: ExtractionResult;
}
