"use client";

import { ScrollArea } from "@/components/patterns/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/patterns/tabs";
import { ChatPanel } from "@/components/blocks/chat-panel";
import { NodeInfoPanel } from "@/components/blocks/node/node-info-panel";
import { EdgeInfoPanel } from "@/components/blocks/edge/edge-info-panel";
import { useGraphStore } from "@/store/graph-store";
import { useUIStore } from "@/store/ui-store";
import { useValidationStore } from "@/store/validation-store";
import { selectNodes, selectSchema } from "@/store/selectors/node-selectors";

export function DetailPanel() {
    const selection = useUIStore((s) => s.selection);
    const graph = useGraphStore((s) => s.graph);
    const schema = useGraphStore(selectSchema);
    const validationResults = useValidationStore((s) => s.results);
    const nodes = useGraphStore(selectNodes);
    const systemPrompt = useGraphStore(
        (s) => s.graph?.metadata.systemPrompt ?? "",
    );

    // graph를 구독하여 파생 — getState() snapshot이 아니라 리렌더에 반응
    const selectedNode =
        selection?.type === "node"
            ? (graph?.nodes.find((n) => n.id === selection.id) ?? null)
            : null;
    const selectedTriple =
        selection?.type === "edge"
            ? (graph?.triples.find((t) => t.id === selection.id) ?? null)
            : null;
    const triples = graph?.triples ?? [];
    const selectedNodeRelations = selectedNode
        ? {
              outgoing: triples.filter((t) => t.subject === selectedNode.id),
              incoming: triples.filter((t) => t.object === selectedNode.id),
          }
        : { outgoing: [], incoming: [] };
    const getNodeLabel = (id: string) =>
        graph?.nodes.find((n) => n.id === id)?.label ?? id;

    const editNode = (nodeId: string) =>
        useUIStore.getState().openDialog("node", nodeId);
    const deleteNode = (nodeId: string) => {
        useGraphStore.getState().removeNode(nodeId);
        useUIStore.getState().clearSelection();
    };
    const editTriple = (tripleId: string) =>
        useUIStore.getState().openDialog("triple", tripleId);
    const deleteTriple = (tripleId: string) => {
        useGraphStore.getState().removeTriple(tripleId);
        useUIStore.getState().clearSelection();
    };
    const focusNode = (nodeId: string) => {
        useUIStore.getState().selectNode(nodeId);
        useUIStore.getState().setFocusedNodeId(nodeId);
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
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

                        {selectedNode && (
                            <NodeInfoPanel
                                node={selectedNode}
                                schema={schema}
                                validationResults={validationResults}
                                outgoingTriples={selectedNodeRelations.outgoing}
                                incomingTriples={selectedNodeRelations.incoming}
                                getNodeLabel={getNodeLabel}
                                onEditNode={editNode}
                                onDeleteNode={deleteNode}
                                onEditTriple={editTriple}
                                onDeleteTriple={deleteTriple}
                                onFocusNode={focusNode}
                                onAddPropertyDef={useGraphStore.getState().addPropertyDef}
                                onRemovePropertyDef={useGraphStore.getState().removePropertyDef}
                            />
                        )}

                        {selectedTriple && !selectedNode && (
                            <EdgeInfoPanel
                                triple={selectedTriple}
                                schema={schema}
                                getNodeLabel={getNodeLabel}
                                onEditTriple={editTriple}
                                onDeleteTriple={deleteTriple}
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
                        nodes={nodes}
                        systemPrompt={systemPrompt}
                        chatGraph={graph}
                        chatId="detail-panel-chat"
                        onFocusNode={focusNode}
                        onUpdateSystemPrompt={useGraphStore.getState().updateSystemPrompt}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
