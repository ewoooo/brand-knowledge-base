"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/primitives/button";
import { ScrollArea } from "@/components/ui/patterns/scroll-area";
import { Textarea } from "@/components/ui/primitives/textarea";
import type { KnowledgeGraph, Node } from "@knowledgeview/kg-core";
import { Send, Loader2, Settings2, ChevronDown } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { extractMentionedNodeIds } from "@/lib/extract-mentioned-nodes";

interface ChatPanelProps {
    graph: KnowledgeGraph;
    chatId: string;
    onFocusNode: (nodeId: string) => void;
    onUpdateSystemPrompt?: (prompt: string) => void;
}

/**
 * 텍스트에서 노드 라벨을 감지하여 클릭 가능한 요소로 변환
 */
function highlightNodeLabels(
    text: string,
    nodes: Node[],
    onFocusNode: (id: string) => void,
): ReactNode {
    if (nodes.length === 0) return text;

    // 라벨 → 노드 매핑 (긴 라벨부터 매칭하여 부분 매칭 방지)
    const sorted = [...nodes]
        .filter((n) => n.label.length >= 2)
        .sort((a, b) => b.label.length - a.label.length);

    // 정규식 특수문자 이스케이프
    const escaped = sorted.map((n) => ({
        node: n,
        pattern: n.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    }));

    const regex = new RegExp(`(${escaped.map((e) => e.pattern).join("|")})`, "g");
    const labelToNode = new Map(sorted.map((n) => [n.label, n]));

    const parts = text.split(regex);
    if (parts.length === 1) return text;

    return parts.map((part, i) => {
        const node = labelToNode.get(part);
        if (node) {
            return (
                <button
                    key={i}
                    type="button"
                    onClick={() => onFocusNode(node.id)}
                    className="bg-primary/10 text-primary hover:bg-primary/20 inline cursor-pointer rounded px-0.5 font-medium underline decoration-dotted underline-offset-2 transition-colors"
                >
                    {part}
                </button>
            );
        }
        return part;
    });
}

/**
 * React children를 재귀적으로 순회하며 문자열에서 노드 라벨을 하이라이트
 */
function processChildren(
    children: ReactNode,
    nodes: Node[],
    onFocusNode: (id: string) => void,
): ReactNode {
    if (typeof children === "string") {
        return highlightNodeLabels(children, nodes, onFocusNode);
    }
    if (Array.isArray(children)) {
        return children.map((child, i) =>
            typeof child === "string" ? (
                <span key={i}>
                    {highlightNodeLabels(child, nodes, onFocusNode)}
                </span>
            ) : (
                child
            ),
        );
    }
    return children;
}

export function ChatPanel({ graph, chatId, onFocusNode, onUpdateSystemPrompt }: ChatPanelProps) {
    const [input, setInput] = useState("");
    const [showPromptEditor, setShowPromptEditor] = useState(false);
    const [promptDraft, setPromptDraft] = useState(graph.metadata.systemPrompt ?? "");
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status } = useChat({
        id: chatId,
        transport: new DefaultChatTransport({
            api: "/api/chat",
            prepareSendMessagesRequest: ({ id, messages }) => ({
                body: { id, messages, graph },
            }),
        }),
    });

    const isLoading = status === "streaming" || status === "submitted";

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        const viewport = scrollAreaRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]",
        );
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [messages]);

    // Auto-focus: 스트리밍 중 첫 번째 노드가 감지되면 즉시 포커스 (1회만)
    const focusedForMessageRef = useRef<string | null>(null);
    useEffect(() => {
        if (status !== "streaming") {
            // 스트리밍이 끝나면 플래그 초기화 (다음 대화를 위해)
            if (status === "ready") focusedForMessageRef.current = null;
            return;
        }

        const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
        if (!lastAssistant || focusedForMessageRef.current === lastAssistant.id) return;

        const text = lastAssistant.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join(" ");

        const mentionedIds = extractMentionedNodeIds(text, graph.nodes);
        if (mentionedIds.length > 0) {
            focusedForMessageRef.current = lastAssistant.id;
            onFocusNode(mentionedIds[0]);
        }
    }, [status, messages, graph.nodes, onFocusNode]);

    // react-markdown 커스텀 컴포넌트: 텍스트 내 노드 라벨을 클릭 가능하게 변환
    const mdComponents = useMemo<Components>(
        () => ({
            p: ({ children }) => (
                <p>{processChildren(children, graph.nodes, onFocusNode)}</p>
            ),
            li: ({ children }) => (
                <li>{processChildren(children, graph.nodes, onFocusNode)}</li>
            ),
            td: ({ children }) => (
                <td>{processChildren(children, graph.nodes, onFocusNode)}</td>
            ),
            strong: ({ children }) => (
                <strong>
                    {processChildren(children, graph.nodes, onFocusNode)}
                </strong>
            ),
        }),
        [graph.nodes, onFocusNode],
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        sendMessage({ text: input });
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            {/* System Prompt Editor */}
            {onUpdateSystemPrompt && (
                <div className="border-b">
                    <button
                        type="button"
                        onClick={() => setShowPromptEditor((v) => !v)}
                        className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 px-3 py-2 text-[11px] transition-colors"
                    >
                        <Settings2 className="h-3 w-3" />
                        <span>시스템 프롬프트</span>
                        {graph.metadata.systemPrompt && (
                            <span className="bg-primary/10 text-primary rounded px-1 text-[10px]">
                                커스텀
                            </span>
                        )}
                        <ChevronDown
                            className={`ml-auto h-3 w-3 transition-transform ${showPromptEditor ? "rotate-180" : ""}`}
                        />
                    </button>
                    {showPromptEditor && (
                        <div className="space-y-1.5 px-3 pb-3">
                            <Textarea
                                value={promptDraft}
                                onChange={(e) => setPromptDraft(e.target.value)}
                                placeholder="기본 프롬프트를 사용합니다. 커스텀 프롬프트를 입력하면 기본 프롬프트를 대체합니다."
                                className="max-h-[120px] min-h-[60px] resize-none text-[11px]"
                                rows={3}
                            />
                            <div className="flex justify-end gap-1">
                                {promptDraft && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px]"
                                        onClick={() => {
                                            setPromptDraft("");
                                            onUpdateSystemPrompt("");
                                        }}
                                    >
                                        초기화
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    className="h-6 text-[10px]"
                                    onClick={() => onUpdateSystemPrompt(promptDraft)}
                                    disabled={promptDraft === (graph.metadata.systemPrompt ?? "")}
                                >
                                    적용
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1">
                <div className="space-y-3 p-3">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                            <p className="text-muted-foreground text-xs">
                                그래프에 대해 질문해보세요
                            </p>
                            <div className="text-muted-foreground/60 space-y-1 text-[11px]">
                                <p>
                                    &ldquo;이 브랜드의 컬러 체계를
                                    분석해줘&rdquo;
                                </p>
                                <p>&ldquo;규칙 위반 사항을 설명해줘&rdquo;</p>
                                <p>
                                    &ldquo;노드 간 관계가 일관성이 있어?&rdquo;
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                                    message.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                }`}
                            >
                                {message.parts.map((part, index) => {
                                    if (part.type === "text") {
                                        if (message.role === "assistant") {
                                            return (
                                                <div
                                                    key={index}
                                                    className="chat-markdown break-words"
                                                >
                                                    <ReactMarkdown
                                                        remarkPlugins={[
                                                            remarkGfm,
                                                        ]}
                                                        components={
                                                            mdComponents
                                                        }
                                                    >
                                                        {part.text}
                                                    </ReactMarkdown>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div
                                                key={index}
                                                className="break-words whitespace-pre-wrap"
                                            >
                                                {part.text}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    ))}

                    {isLoading &&
                        messages[messages.length - 1]?.role !== "assistant" && (
                            <div className="flex justify-start">
                                <div className="bg-muted rounded-lg px-3 py-2">
                                    <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                                </div>
                            </div>
                        )}
                </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t p-2">
                <div className="flex items-end gap-1.5">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요..."
                        className="max-h-[100px] min-h-[36px] resize-none text-xs"
                        rows={1}
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        disabled={!input.trim() || isLoading}
                    >
                        <Send className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
