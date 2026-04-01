"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/patterns/scroll-area";
import { SectionHeader } from "@/components/patterns/section-header";
import { Separator } from "@/components/ui/separator";
import type { ValidationResult } from "@knowledgeview/kg-core";
import { RuleCard } from "@/components/blocks/rule/rule-card";
import type { NodeTypeInfo } from "@/hooks/use-node";

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
    stats: { nodeCount: number; tripleCount: number; ruleCount: number } | null;
    nodeTypes: NodeTypeInfo[];
    ruleResults: ValidationResult[];
    onAddRule: () => void;
    onEditRule: (ruleId: string) => void;
    onDeleteRule: (ruleId: string) => void;
    hiddenTypes: Set<string>;
    onToggleType: (type: string) => void;
}

export function Sidebar({
    currentFile,
    onSelectFile,
    onCreateGraph,
    stats,
    nodeTypes,
    ruleResults,
    onAddRule,
    onEditRule,
    onDeleteRule,
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
        <div className="flex h-full flex-col overflow-hidden">
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
                <ScrollArea className="h-[80px]">
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

            {stats && (
                <div className="px-4 py-3">
                    <SectionHeader title="통계" />
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/30 rounded-md px-2 py-1.5">
                            <div className="truncate text-lg font-semibold">
                                {stats.nodeCount}
                            </div>
                            <div className="text-muted-foreground text-[10px]">
                                노드
                            </div>
                        </div>
                        <div className="bg-muted/30 overflow-hidden rounded-md px-2 py-1.5">
                            <div className="truncate text-lg font-semibold">
                                {stats.tripleCount}
                            </div>
                            <div className="text-muted-foreground text-[10px]">
                                관계
                            </div>
                        </div>
                        <div className="bg-muted/30 overflow-hidden rounded-md px-2 py-1.5">
                            <div className="truncate text-lg font-semibold">
                                {stats.ruleCount}
                            </div>
                            <div className="text-muted-foreground text-[10px]">
                                규칙
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {nodeTypes.length > 0 && (
                <div className="px-4 py-3">
                    <SectionHeader title="노드 타입" />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {nodeTypes.map(({ type, displayName, count }) => (
                            <Badge
                                key={type}
                                variant={
                                    hiddenTypes.has(type)
                                        ? "outline"
                                        : "secondary"
                                }
                                className={`max-w-full cursor-pointer text-xs ${hiddenTypes.has(type) ? "line-through opacity-40" : ""}`}
                                onClick={() => onToggleType(type)}
                                title={`${displayName} (${type}) — ${count}개`}
                            >
                                <span className="truncate">
                                    {displayName}
                                </span>
                                <span className="ml-1 shrink-0 opacity-60">
                                    {count}
                                </span>
                            </Badge>
                        ))}
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
                    {ruleResults.length === 0 ? (
                        <p className="text-muted-foreground text-xs">
                            규칙 없음
                        </p>
                    ) : (
                        ruleResults.map((r) => (
                            <RuleCard
                                key={r.ruleId}
                                result={r}
                                onEdit={onEditRule}
                                onDelete={onDeleteRule}
                            />
                        ))
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
