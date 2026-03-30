import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";
import { buildChatContext } from "@/lib/build-chat-context";

const SYSTEM_PROMPT = `당신은 브랜드 디자인 시스템 지식 그래프 분석 전문가입니다.
사용자가 현재 보고 있는 그래프 데이터를 기반으로 질문에 답변합니다.
노드 간의 관계, 규칙 위반 사항, 그래프 구조의 일관성 등에 대해 분석하고 조언합니다.
한국어로 답변합니다.
컨텍스트에 없는 정보는 추측하지 마세요.`;

export async function POST(req: Request) {
    try {
        const {
            messages,
            graph,
        }: { messages: UIMessage[]; graph: KnowledgeGraph } = await req.json();

        const lastUserMessage =
            [...messages].reverse().find((m) => m.role === "user");
        const question =
            lastUserMessage?.parts
                ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map((p) => p.text)
                .join(" ")
            ?? "";

        const { context: graphContext } = buildChatContext(graph, question);

        const result = streamText({
            model: anthropic("claude-sonnet-4.6"),
            system: `${SYSTEM_PROMPT}\n\n${graphContext}`,
            messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("[chat route error]", error);
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
