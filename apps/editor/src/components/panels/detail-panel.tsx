"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/panels/chat-panel";
import type { KnowledgeGraph, Triple, ValidationResult } from "@knowledgeview/kg-core";

function TripleCard({
    triple,
    direction,
    isViolating,
    nodeLabelById,
    onFocusNode,
    onEditTriple,
    onDeleteTriple,
}: {
    triple: Triple;
    direction: "outgoing" | "incoming";
    isViolating: boolean;
    nodeLabelById: (id: string) => string;
    onFocusNode: (nodeId: string) => void;
    onEditTriple: (tripleId: string) => void;
    onDeleteTriple: (tripleId: string) => void;
}) {
    const targetId = direction === "outgoing" ? triple.object : triple.subject;
    const title =
        direction === "outgoing"
            ? `${triple.predicate} → ${nodeLabelById(triple.object)}`
            : `${nodeLabelById(triple.subject)} → ${triple.predicate}`;

    return (
        <div
            className={`group overflow-hidden rounded-md border px-3 py-2 text-xs ${
                isViolating
                    ? "border-red-500 bg-red-500/5"
                    : "border-border bg-muted/30"
            }`}
        >
            <div className="truncate" title={title}>
                {isViolating && (
                    <span className="mr-1 text-red-500">⚠</span>
                )}
                {direction === "outgoing" ? (
                    <>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-primary mx-1">
                            {triple.predicate}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <button
                            type="button"
                            onClick={() => onFocusNode(targetId)}
                            className="ml-1 font-medium underline-offset-2 hover:underline"
                        >
                            {nodeLabelById(targetId)}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => onFocusNode(targetId)}
                            className="font-medium underline-offset-2 hover:underline"
                        >
                            {nodeLabelById(targetId)}
                        </button>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className="text-primary">{triple.predicate}</span>
                        <span className="text-muted-foreground ml-1">→</span>
                    </>
                )}
            </div>
            <div className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    onClick={() => onEditTriple(triple.id)}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded px-1.5 py-0.5 text-[10px]"
                >
                    편집
                </button>
                <button
                    onClick={() => onDeleteTriple(triple.id)}
                    className="rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10"
                >
                    삭제
                </button>
            </div>
        </div>
    );
}

interface DetailPanelProps {
    graph: KnowledgeGraph;
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    validationResults: ValidationResult[];
    onEditNode: (nodeId: string) => void;
    onDeleteNode: (nodeId: string) => void;
    onEditTriple: (tripleId: string) => void;
    onDeleteTriple: (tripleId: string) => void;
    onFocusNode: (nodeId: string) => void;
    onUpdateSystemPrompt?: (prompt: string) => void;
}

export function DetailPanel({
    graph,
    selectedNodeId,
    selectedEdgeId,
    validationResults,
    onEditNode,
    onDeleteNode,
    onEditTriple,
    onDeleteTriple,
    onFocusNode,
    onUpdateSystemPrompt,
}: DetailPanelProps) {
    const selectedNode = selectedNodeId
        ? (graph.nodes.find((n) => n.id === selectedNodeId) ?? null)
        : null;

    const selectedTriple = selectedEdgeId
        ? (graph.triples.find((t) => t.id === selectedEdgeId) ?? null)
        : null;

    // Violations that apply to the selected node
    const nodeViolations = selectedNode
        ? validationResults.flatMap((r) =>
              r.violations
                  .filter((v) => v.nodeId === selectedNode.id)
                  .map((v) => ({
                      ruleName: r.ruleName,
                      message: v.message,
                      relatedTripleId: v.relatedTripleId,
                  })),
          )
        : [];

    // Set of triple IDs that have violations related to the selected node
    const violatingTripleIds = new Set(
        nodeViolations.map((v) => v.relatedTripleId).filter(Boolean),
    );

    // Outgoing triples: selected node is subject (→ points to other nodes)
    const outgoingTriples = selectedNode
        ? graph.triples.filter((t) => t.subject === selectedNode.id)
        : [];

    // Incoming triples: selected node is object (← pointed by other nodes)
    const incomingTriples = selectedNode
        ? graph.triples.filter((t) => t.object === selectedNode.id)
        : [];

    // Helper to resolve node label by id
    const nodeLabelById = (id: string) => {
        const node = graph.nodes.find((n) => n.id === id);
        return node ? node.label : id;
    };

    return (
        <div className="flex h-full w-[350px] min-w-[350px] flex-col overflow-hidden border-l">
            <Tabs defaultValue="properties" className="flex h-full flex-col">
                <div className="border-b px-2 pt-2">
                    <TabsList className="w-full">
                        <TabsTrigger
                            value="properties"
                            className="flex-1 text-xs"
                        >
                            속성
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="flex-1 text-xs">
                            AI 채팅
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent
                    value="properties"
                    className="mt-0 flex-1 overflow-hidden"
                >
                    <ScrollArea className="h-full w-full">
                        {/* Empty state */}
                        {!selectedNode && !selectedTriple && (
                            <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
                                <div className="space-y-2">
                                    <p className="text-foreground/80 text-sm font-medium">
                                        시작하기
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        노드를 클릭하면 상세 정보가 여기에
                                        표시됩니다
                                    </p>
                                </div>
                                <div className="w-full space-y-2 text-left">
                                    <div className="border-border/50 rounded-md border px-3 py-2 text-xs">
                                        <span className="text-muted-foreground">
                                            캔버스 더블클릭
                                        </span>
                                        <span className="text-foreground/70 ml-2">
                                            새 노드 추가
                                        </span>
                                    </div>
                                    <div className="border-border/50 rounded-md border px-3 py-2 text-xs">
                                        <span className="text-muted-foreground">
                                            노드 클릭
                                        </span>
                                        <span className="text-foreground/70 ml-2">
                                            정보 보기 · 편집
                                        </span>
                                    </div>
                                    <div className="border-border/50 rounded-md border px-3 py-2 text-xs">
                                        <span className="text-muted-foreground">
                                            엣지 클릭
                                        </span>
                                        <span className="text-foreground/70 ml-2">
                                            관계 편집 · 삭제
                                        </span>
                                    </div>
                                    <div className="border-border/50 rounded-md border px-3 py-2 text-xs">
                                        <span className="text-muted-foreground">
                                            노드 드래그
                                        </span>
                                        <span className="text-foreground/70 ml-2">
                                            위치 이동
                                        </span>
                                    </div>
                                    <div className="border-border/50 rounded-md border px-3 py-2 text-xs">
                                        <span className="text-muted-foreground">
                                            스크롤
                                        </span>
                                        <span className="text-foreground/70 ml-2">
                                            줌 인/아웃
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Node selected */}
                        {selectedNode && (
                            <div className="max-w-full space-y-4 overflow-hidden p-4">
                                {/* Label and type */}
                                <div className="space-y-1">
                                    <p className="truncate text-base font-semibold" title={selectedNode.label}>
                                        {selectedNode.label}
                                    </p>
                                    {selectedNode.type && (
                                        <Badge variant="secondary">
                                            {selectedNode.type}
                                        </Badge>
                                    )}
                                </div>

                                {/* Violation alerts */}
                                {nodeViolations.length > 0 && (
                                    <div className="space-y-2">
                                        {nodeViolations.map((v, i) => (
                                            <Alert
                                                key={i}
                                                variant="destructive"
                                            >
                                                <AlertTitle>
                                                    {v.ruleName}
                                                </AlertTitle>
                                                <AlertDescription>
                                                    {v.message}
                                                </AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                )}

                                <Separator />

                                {/* Outgoing triples */}
                                <div>
                                    <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                                        나가는 관계 ({outgoingTriples.length})
                                    </p>
                                    {outgoingTriples.length === 0 ? (
                                        <p className="text-muted-foreground text-xs">
                                            없음
                                        </p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {outgoingTriples.map((t) => (
                                                <TripleCard
                                                    key={t.id}
                                                    triple={t}
                                                    direction="outgoing"
                                                    isViolating={violatingTripleIds.has(t.id)}
                                                    nodeLabelById={nodeLabelById}
                                                    onFocusNode={onFocusNode}
                                                    onEditTriple={onEditTriple}
                                                    onDeleteTriple={onDeleteTriple}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Incoming triples */}
                                <div>
                                    <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                                        들어오는 관계 ({incomingTriples.length})
                                    </p>
                                    {incomingTriples.length === 0 ? (
                                        <p className="text-muted-foreground text-xs">
                                            없음
                                        </p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {incomingTriples.map((t) => (
                                                <TripleCard
                                                    key={t.id}
                                                    triple={t}
                                                    direction="incoming"
                                                    isViolating={violatingTripleIds.has(t.id)}
                                                    nodeLabelById={nodeLabelById}
                                                    onFocusNode={onFocusNode}
                                                    onEditTriple={onEditTriple}
                                                    onDeleteTriple={onDeleteTriple}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Edit / Delete buttons */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() =>
                                            onEditNode(selectedNode.id)
                                        }
                                    >
                                        편집
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() =>
                                            onDeleteNode(selectedNode.id)
                                        }
                                    >
                                        삭제
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Edge (triple) selected */}
                        {selectedTriple && !selectedNode && (
                            <div className="space-y-4 p-4">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-medium uppercase">
                                        관계
                                    </p>
                                    <div className="border-border bg-muted/30 rounded-md border px-3 py-2 text-sm">
                                        <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                                            <span className="max-w-full truncate font-medium" title={nodeLabelById(selectedTriple.subject)}>
                                                {nodeLabelById(
                                                    selectedTriple.subject,
                                                )}
                                            </span>
                                            <span className="text-muted-foreground shrink-0">
                                                →
                                            </span>
                                            <span className="text-primary max-w-full truncate font-medium" title={selectedTriple.predicate}>
                                                {selectedTriple.predicate}
                                            </span>
                                            <span className="text-muted-foreground shrink-0">
                                                →
                                            </span>
                                            <span className="max-w-full truncate font-medium" title={nodeLabelById(selectedTriple.object)}>
                                                {nodeLabelById(
                                                    selectedTriple.object,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Edit / Delete buttons */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() =>
                                            onEditTriple(selectedTriple.id)
                                        }
                                    >
                                        편집
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() =>
                                            onDeleteTriple(selectedTriple.id)
                                        }
                                    >
                                        삭제
                                    </Button>
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>

                <TabsContent
                    value="chat"
                    forceMount
                    className="mt-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
                >
                    <ChatPanel graph={graph} chatId="detail-panel-chat" onFocusNode={onFocusNode} onUpdateSystemPrompt={onUpdateSystemPrompt} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
