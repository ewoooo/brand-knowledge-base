import { NextResponse } from "next/server";
import { runPipeline } from "@knowledgeview/graph-rag";
import { loadGraph } from "@/lib/graph-loader";

export async function POST(req: Request) {
  const body = await req.json();
  const { question, graphFile, options } = body;

  if (!question || !graphFile) {
    return NextResponse.json(
      { error: "question and graphFile are required" },
      { status: 400 }
    );
  }

  const graph = await loadGraph(graphFile);
  const result = runPipeline(graph, question, options);

  return NextResponse.json({
    context: result.context,
    subgraph: {
      nodes: result.subgraph.nodes,
      triples: result.subgraph.triples,
    },
    extraction: result.extraction,
    metadata: {
      depth: result.subgraph.metadata.depth,
      nodeCount: result.subgraph.nodes.length,
      tripleCount: result.subgraph.triples.length,
    },
  });
}
