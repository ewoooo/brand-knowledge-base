"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ValidationResult } from "@/lib/kg-core/types";

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
}

export function Sidebar({
  currentFile,
  onSelectFile,
  onCreateGraph,
  validationResults,
  onAddRule,
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
              📁 {g.name}
            </button>
          ))}
        </ScrollArea>
      </div>

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
