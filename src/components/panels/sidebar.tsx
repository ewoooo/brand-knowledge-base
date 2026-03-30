"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { KnowledgeGraph, ValidationResult } from "@/lib/kg-core/types";

interface GraphListItem {
  filename: string;
  name: string;
  nodeCount: number;
  tripleCount: number;
  ruleCount: number;
}

interface SidebarProps {
  currentFile: string | null;
  onSelectFile: (filename: string) => void;
  onCreateGraph: () => void;
  validationResults: ValidationResult[];
  onAddRule: () => void;
  graph: KnowledgeGraph | null;
  hiddenTypes: Set<string>;
  onToggleType: (type: string) => void;
}

export function Sidebar({
  currentFile,
  onSelectFile,
  onCreateGraph,
  validationResults,
  onAddRule,
  graph,
  hiddenTypes,
  onToggleType,
}: SidebarProps) {
  const [graphs, setGraphs] = useState<GraphListItem[]>([]);

  useEffect(() => {
    fetch("/api/graphs")
      .then((res) => res.json())
      .then(setGraphs);
  }, [currentFile]);

  return (
    <div className="flex h-full w-[220px] flex-col border-r">
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            그래프
          </span>
          <Button variant="ghost" size="sm" onClick={onCreateGraph}>
            + 새 그래프
          </Button>
        </div>
        <ScrollArea className="h-[120px]">
          {graphs.map((g) => (
            <button
              key={g.filename}
              onClick={() => onSelectFile(g.filename)}
              className={`mb-1 w-full rounded-md px-3 py-1.5 text-left text-sm ${
                currentFile === g.filename
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {g.name}
            </button>
          ))}
        </ScrollArea>
      </div>

      <Separator />

      {graph && (
        <div className="px-4 py-3">
          <span className="text-xs font-medium uppercase text-muted-foreground">통계</span>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/30 px-2 py-1.5">
              <div className="text-lg font-semibold">{graph.nodes.length}</div>
              <div className="text-[10px] text-muted-foreground">노드</div>
            </div>
            <div className="rounded-md bg-muted/30 px-2 py-1.5">
              <div className="text-lg font-semibold">{graph.triples.length}</div>
              <div className="text-[10px] text-muted-foreground">관계</div>
            </div>
            <div className="rounded-md bg-muted/30 px-2 py-1.5">
              <div className="text-lg font-semibold">{graph.rules.length}</div>
              <div className="text-[10px] text-muted-foreground">규칙</div>
            </div>
          </div>
        </div>
      )}

      {graph && graph.nodes.length > 0 && (
        <div className="px-4 py-3">
          <span className="text-xs font-medium uppercase text-muted-foreground">노드 타입</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Array.from(new Set(graph.nodes.map((n) => n.type).filter(Boolean))).map((type) => {
              const count = graph.nodes.filter((n) => n.type === type).length;
              return (
                <Badge
                  key={type}
                  variant={hiddenTypes.has(type as string) ? "outline" : "secondary"}
                  className={`cursor-pointer text-xs ${hiddenTypes.has(type as string) ? "opacity-40 line-through" : ""}`}
                  onClick={() => onToggleType(type as string)}
                >
                  {type} <span className="ml-1 opacity-60">{count}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      <Separator />

      <div className="flex-1 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            규칙
          </span>
          <Button variant="ghost" size="sm" onClick={onAddRule}>
            + 추가
          </Button>
        </div>
        <ScrollArea className="h-full">
          {validationResults.length === 0 && (
            <p className="text-xs text-muted-foreground">규칙 없음</p>
          )}
          {validationResults.map((r) => (
            <div
              key={r.ruleId}
              className={`mb-1.5 rounded-md border-l-2 px-3 py-2 text-xs ${
                r.status === "pass"
                  ? "border-green-500 bg-green-500/5"
                  : "border-red-500 bg-red-500/5"
              }`}
            >
              <div className="font-medium">
                {r.status === "pass" ? "✓" : "✗"} {r.ruleName}
              </div>
              <div className="text-muted-foreground">
                {r.status === "pass"
                  ? "통과"
                  : `${r.violations.length}건 위반`}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
