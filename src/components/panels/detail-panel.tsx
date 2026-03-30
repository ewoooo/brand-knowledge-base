"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type {
  KnowledgeGraph,
  ValidationResult,
} from "@/lib/kg-core/types";

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
    <div className="flex h-full w-[260px] flex-col border-l">
      <div className="p-4">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          상세 정보
        </span>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        {/* Empty state */}
        {!selectedNode && !selectedTriple && (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            노드를 클릭하면 상세 정보가 표시됩니다
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
                연결된 트리플 ({connectedTriples.length})
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
                        className={`rounded-md border px-3 py-2 text-xs ${
                          isViolating
                            ? "border-red-500 bg-red-500/5"
                            : "border-border bg-muted/30"
                        }`}
                      >
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
                트리플
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
    </div>
  );
}
