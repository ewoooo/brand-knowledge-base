"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/primitives/badge";
import { Button } from "@/components/ui/primitives/button";
import { ScrollArea } from "@/components/ui/patterns/scroll-area";
import { SectionHeader } from "@/components/ui/patterns/section-header";
import { Separator } from "@/components/ui/primitives/separator";
import type {
    KnowledgeGraph,
    TypeRegistry,
    ValidationResult,
} from "@knowledgeview/kg-core";
import { getNodeTypeDisplayName } from "@/lib/schema-display";

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
    schema?: TypeRegistry;
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
    schema,
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
        <div className="flex h-full w-[220px] min-w-[220px] flex-col overflow-hidden border-r">
            <div className="p-4">
                <SectionHeader
                    title="그래프"
                    action={
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={onCreateGraph}
                        >
                            + 새 그래프
                        </Button>
                    }
                />
                <ScrollArea className="h-[120px]">
                    {graphs.map((g) => (
                        <button
                            key={g.filename}
                            onClick={() => onSelectFile(g.filename)}
                            title={g.name}
                            className={`mb-1 w-full truncate rounded-md px-3 py-1.5 text-left text-sm ${
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
                    <SectionHeader title="통계" />
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/30 rounded-md px-2 py-1.5">
                            <div className="truncate text-lg font-semibold">
                                {graph.nodes.length}
                            </div>
                            <div className="text-muted-foreground text-[10px]">
                                노드
                            </div>
                        </div>
                        <div className="bg-muted/30 overflow-hidden rounded-md px-2 py-1.5">
                            <div className="truncate text-lg font-semibold">
                                {graph.triples.length}
                            </div>
                            <div className="text-muted-foreground text-[10px]">
                                관계
                            </div>
                        </div>
                        <div className="bg-muted/30 overflow-hidden rounded-md px-2 py-1.5">
                            <div className="truncate text-lg font-semibold">
                                {graph.rules.length}
                            </div>
                            <div className="text-muted-foreground text-[10px]">
                                규칙
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {graph && graph.nodes.length > 0 && (
                <div className="px-4 py-3">
                    <SectionHeader title="노드 타입" />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {Array.from(
                            new Set(
                                graph.nodes.map((n) => n.type).filter(Boolean),
                            ),
                        ).map((type) => {
                            const count = graph.nodes.filter(
                                (n) => n.type === type,
                            ).length;
                            const displayName = getNodeTypeDisplayName(
                                schema,
                                type as string,
                            );
                            return (
                                <Badge
                                    key={type}
                                    variant={
                                        hiddenTypes.has(type as string)
                                            ? "outline"
                                            : "secondary"
                                    }
                                    className={`max-w-full cursor-pointer text-xs ${hiddenTypes.has(type as string) ? "line-through opacity-40" : ""}`}
                                    onClick={() => onToggleType(type as string)}
                                    title={`${displayName} (${type}) — ${count}개`}
                                >
                                    <span className="truncate">
                                        {displayName}
                                    </span>
                                    <span className="ml-1 shrink-0 opacity-60">
                                        {count}
                                    </span>
                                </Badge>
                            );
                        })}
                    </div>
                </div>
            )}

            <Separator />

            <div className="flex-1 p-4">
                <SectionHeader
                    title="규칙"
                    action={
                        <Button variant="ghost" size="xs" onClick={onAddRule}>
                            + 추가
                        </Button>
                    }
                />
                <ScrollArea className="h-full">
                    {validationResults.length === 0 && (
                        <p className="text-muted-foreground text-xs">
                            규칙 없음
                        </p>
                    )}
                    {validationResults.map((r) => (
                        <div
                            key={r.ruleId}
                            className="border-border mb-1.5 border-b px-3 py-2 text-xs last:border-b-0"
                        >
                            <div
                                className="flex items-center gap-1.5 truncate font-medium"
                                title={r.ruleName}
                            >
                                <span
                                    className={`size-1.5 shrink-0 rounded-full ${
                                        r.status === "pass"
                                            ? "bg-[#4da375]"
                                            : "bg-[#d94f4f]"
                                    }`}
                                />
                                {r.ruleName}
                            </div>
                            <div className="text-muted-foreground truncate pl-3">
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
