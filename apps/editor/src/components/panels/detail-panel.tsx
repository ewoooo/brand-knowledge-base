"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/panels/chat-panel";
import type {
  KnowledgeGraph,
  ValidationResult,
} from "@knowledgeview/kg-core";

interface DetailPanelProps {
  graph: KnowledgeGraph;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  validationResults: ValidationResult[];
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onEditTriple: (tripleId: string) => void;
  onDeleteTriple: (tripleId: string) => void;
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
}: DetailPanelProps) {
  const selectedNode = selectedNodeId
    ? graph.nodes.find((n) => n.id === selectedNodeId) ?? null
    : null;

  const selectedTriple = selectedEdgeId
    ? graph.triples.find((t) => t.id === selectedEdgeId) ?? null
    : null;

  // Violations that apply to the selected node
  const nodeViolations = selectedNode
    ? validationResults.flatMap((r) =>
        r.violations
          .filter((v) => v.nodeId === selectedNode.id)
          .map((v) => ({ ruleName: r.ruleName, message: v.message, relatedTripleId: v.relatedTripleId }))
      )
    : [];

  // Set of triple IDs that have violations related to the selected node
  const violatingTripleIds = new Set(
    nodeViolations.map((v) => v.relatedTripleId).filter(Boolean)
  );

  // Triples connected to the selected node
  const connectedTriples = selectedNode
    ? graph.triples.filter(
        (t) => t.subject === selectedNode.id || t.object === selectedNode.id
      )
    : [];

  // Helper to resolve node label by id
  const nodeLabelById = (id: string) => {
    const node = graph.nodes.find((n) => n.id === id);
    return node ? node.label : id;
  };

  return (
    <div className="flex h-full w-[280px] flex-col border-l">
      <Tabs defaultValue="properties" className="flex h-full flex-col">
        <div className="border-b px-2 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="properties" className="flex-1 text-xs">속성</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 text-xs">AI 채팅</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="properties" className="mt-0 flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        {/* Empty state */}
        {!selectedNode && !selectedTriple && (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/80">시작하기</p>
              <p className="text-xs text-muted-foreground">노드를 클릭하면 상세 정보가 여기에 표시됩니다</p>
            </div>
            <div className="w-full space-y-2 text-left">
              <div className="rounded-md border border-border/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">캔버스 더블클릭</span>
                <span className="ml-2 text-foreground/70">새 노드 추가</span>
              </div>
              <div className="rounded-md border border-border/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">노드 클릭</span>
                <span className="ml-2 text-foreground/70">정보 보기 · 편집</span>
              </div>
              <div className="rounded-md border border-border/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">엣지 클릭</span>
                <span className="ml-2 text-foreground/70">관계 편집 · 삭제</span>
              </div>
              <div className="rounded-md border border-border/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">노드 드래그</span>
                <span className="ml-2 text-foreground/70">위치 이동</span>
              </div>
              <div className="rounded-md border border-border/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">스크롤</span>
                <span className="ml-2 text-foreground/70">줌 인/아웃</span>
              </div>
            </div>
          </div>
        )}

        {/* Node selected */}
        {selectedNode && (
          <div className="space-y-4 p-4">
            {/* Label and type */}
            <div className="space-y-1">
              <p className="text-base font-semibold">{selectedNode.label}</p>
              {selectedNode.type && (
                <Badge variant="secondary">{selectedNode.type}</Badge>
              )}
            </div>

            {/* Violation alerts */}
            {nodeViolations.length > 0 && (
              <div className="space-y-2">
                {nodeViolations.map((v, i) => (
                  <Alert key={i} variant="destructive">
                    <AlertTitle>{v.ruleName}</AlertTitle>
                    <AlertDescription>{v.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <Separator />

            {/* Connected triples */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                연결된 관계 ({connectedTriples.length})
              </p>
              {connectedTriples.length === 0 ? (
                <p className="text-xs text-muted-foreground">연결 없음</p>
              ) : (
                <div className="space-y-1.5">
                  {connectedTriples.map((t) => {
                    const isViolating = violatingTripleIds.has(t.id);
                    return (
                      <div
                        key={t.id}
                        className={`group rounded-md border px-3 py-2 text-xs ${
                          isViolating
                            ? "border-red-500 bg-red-500/5"
                            : "border-border bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            {isViolating && (
                              <span className="mr-1 text-red-500">⚠</span>
                            )}
                            <span className="font-medium">
                              {nodeLabelById(t.subject)}
                            </span>
                            <span className="mx-1 text-muted-foreground">
                              →{t.predicate}→
                            </span>
                            <span className="font-medium">
                              {nodeLabelById(t.object)}
                            </span>
                          </div>
                          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => onEditTriple(t.id)}
                              className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                              편집
                            </button>
                            <button
                              onClick={() => onDeleteTriple(t.id)}
                              className="rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                onClick={() => onEditNode(selectedNode.id)}
              >
                편집
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onDeleteNode(selectedNode.id)}
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
              <p className="text-xs font-medium uppercase text-muted-foreground">
                관계
              </p>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">
                  {nodeLabelById(selectedTriple.subject)}
                </span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="font-medium text-primary">
                  {selectedTriple.predicate}
                </span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="font-medium">
                  {nodeLabelById(selectedTriple.object)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Edit / Delete buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEditTriple(selectedTriple.id)}
              >
                편집
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onDeleteTriple(selectedTriple.id)}
              >
                삭제
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>
        </TabsContent>

        <TabsContent value="chat" className="mt-0 flex-1 overflow-hidden">
          <ChatPanel graph={graph} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
