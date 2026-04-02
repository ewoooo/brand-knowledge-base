"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/patterns/scroll-area";
import { SectionHeader } from "@/components/patterns/section-header";
import { Separator } from "@/components/ui/separator";
import { RuleCard } from "@/components/blocks/rule/rule-card";
import { useGraphStore } from "@/store/graph-store";
import { useUIStore } from "@/store/ui-store";
import { useValidationStore } from "@/store/validation-store";
import { selectNodeTypes } from "@/store/selectors/node-selectors";
import { selectUserValidationResults } from "@/store/selectors/rule-selectors";

interface GraphListItem {
    filename: string;
    name: string;
    nodeCount: number;
    tripleCount: number;
    ruleCount: number;
}

export function Sidebar() {
    const filename = useGraphStore((s) => s.filename);
    const load = useGraphStore((s) => s.load);
    const removeRule = useGraphStore((s) => s.removeRule);
    const nodeTypes = useGraphStore(selectNodeTypes);
    const hiddenTypes = useUIStore((s) => s.hiddenTypes);
    const toggleHiddenType = useUIStore((s) => s.toggleHiddenType);
    const validationResults = useValidationStore((s) => s.results);
    const ruleResults = selectUserValidationResults(validationResults);

    const [graphs, setGraphs] = useState<GraphListItem[]>([]);

    useEffect(() => {
        fetch("/api/graphs")
            .then((res) => res.json())
            .then(setGraphs);
    }, [filename]);

    const handleCreateGraph = async () => {
        const name = prompt("그래프 이름을 입력하세요:");
        if (!name?.trim()) return;

        const res = await fetch("/api/graphs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim() }),
        });

        if (!res.ok) return;
        const data = await res.json();
        await load(data.filename);
    };

    const openRuleDialog = () => useUIStore.getState().openDialog("rule");
    const editRule = (ruleId: string) => useUIStore.getState().openDialog("rule", ruleId);

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="p-4">
                <SectionHeader
                    title="그래프"
                    action={
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={handleCreateGraph}
                        >
                            + 새 그래프
                        </Button>
                    }
                />
                <ScrollArea className="h-[80px]">
                    {graphs.map((g) => (
                        <button
                            key={g.filename}
                            onClick={() => load(g.filename)}
                            title={g.name}
                            className={`mb-1 w-full truncate rounded-md px-3 py-1.5 text-left text-sm ${
                                filename === g.filename
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
                                onClick={() => toggleHiddenType(type)}
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
                        <Button variant="ghost" size="xs" onClick={openRuleDialog}>
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
                                onEdit={editRule}
                                onDelete={removeRule}
                            />
                        ))
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
