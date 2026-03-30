import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { runPipeline } from "@knowledgeview/graph-rag";
import { loadGraph } from "@/lib/graph-loader";

const SYSTEM_PROMPT = `당신은 브랜드 온톨로지 전문가입니다.
아래 지식 그래프 컨텍스트를 기반으로 질문에 답하세요.
컨텍스트에 없는 정보는 추측하지 마세요.
한국어로 답변합니다.`;

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
    system: `${SYSTEM_PROMPT}\n\n${context}`,
    messages: chatMessages,
  });

  return result.toUIMessageStreamResponse();
}
