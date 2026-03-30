import type { KnowledgeGraph } from "@knowledgeview/kg-core";
import { serializeGraphForPrompt } from "@knowledgeview/kg-core";
import { runPipeline } from "@knowledgeview/graph-rag";

interface ChatContextResult {
    context: string;
    mode: "rag" | "fallback";
}

export function buildChatContext(
    graph: KnowledgeGraph,
    question: string,
): ChatContextResult {
    if (!question.trim()) {
        return {
            context: serializeGraphForPrompt(graph),
            mode: "fallback",
        };
    }

    try {
        const { context, extraction } = runPipeline(graph, question);

        if (extraction.entities.length === 0) {
            return {
                context: serializeGraphForPrompt(graph),
                mode: "fallback",
            };
        }

        return { context, mode: "rag" };
    } catch {
        return {
            context: serializeGraphForPrompt(graph),
            mode: "fallback",
        };
    }
}
