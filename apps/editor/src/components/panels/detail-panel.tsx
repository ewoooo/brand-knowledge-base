"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/panels/chat-panel";
import { NodeInfoPanel } from "@/components/panels/node-info-panel";
import { EdgeInfoPanel } from "@/components/panels/edge-info-panel";
import type { KnowledgeGraph, TypeRegistry, ValidationResult } from "@knowledgeview/kg-core";

interface DetailPanelProps {
    graph: KnowledgeGraph;
    schema?: TypeRegistry;
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
    schema,
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
                            <NodeInfoPanel
                                graph={graph}
                                node={selectedNode}
                                schema={schema}
                                validationResults={validationResults}
                                onEditNode={onEditNode}
                                onDeleteNode={onDeleteNode}
                                onEditTriple={onEditTriple}
                                onDeleteTriple={onDeleteTriple}
                                onFocusNode={onFocusNode}
                            />
                        )}

                        {/* Edge selected */}
                        {selectedTriple && !selectedNode && (
                            <EdgeInfoPanel
                                graph={graph}
                                triple={selectedTriple}
                                schema={schema}
                                onEditTriple={onEditTriple}
                                onDeleteTriple={onDeleteTriple}
                            />
                        )}
                    </ScrollArea>
                </TabsContent>

                <TabsContent
                    value="chat"
                    forceMount
                    className="mt-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
                >
                    <ChatPanel
                        graph={graph}
                        chatId="detail-panel-chat"
                        onFocusNode={onFocusNode}
                        onUpdateSystemPrompt={onUpdateSystemPrompt}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
