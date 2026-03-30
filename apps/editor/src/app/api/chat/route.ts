import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";
import { buildChatContext, buildSystemMessage } from "@knowledgeview/chat-core";

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
            system: buildSystemMessage(graphContext),
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
