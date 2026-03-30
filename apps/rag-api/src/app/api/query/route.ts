import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { runPipeline } from "@knowledgeview/graph-rag";
import { buildSystemMessage } from "@knowledgeview/chat-core";
import { loadGraph } from "@/lib/graph-loader";

export async function POST(req: Request) {
  const body = await req.json();
  const { question, graphFile, options, messages } = body as {
    question: string;
    graphFile: string;
    options?: { depth?: number; model?: string };
    messages?: UIMessage[];
  };

  if (!question || !graphFile) {
    return new Response(
      JSON.stringify({ error: "question and graphFile are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let graph;
  try {
    graph = await loadGraph(graphFile);
  } catch {
    return new Response(
      JSON.stringify({ error: `Graph file not found: ${graphFile}` }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const { context } = runPipeline(graph, question, options);

  const modelId = options?.model ?? "claude-sonnet-4.6";

  const chatMessages = messages
    ? await convertToModelMessages(messages)
    : [{ role: "user" as const, content: question }];

  const result = streamText({
    model: anthropic(modelId),
    system: buildSystemMessage(context),
    messages: chatMessages,
  });

  return result.toUIMessageStreamResponse();
}
