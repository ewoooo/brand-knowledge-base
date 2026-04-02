"use client";

import { Button } from "@/components/ui/button";
import { GraphInfo } from "@/components/blocks/graph-info";
import { useGraphStore } from "@/store/graph-store";
import { useUIStore } from "@/store/ui-store";

export function GraphHeader() {
    const nodeCount = useGraphStore((s) => s.graph?.nodes.length ?? 0);
    const tripleCount = useGraphStore((s) => s.graph?.triples.length ?? 0);
    const ruleCount = useGraphStore((s) => s.graph?.rules.length ?? 0);
    const isDirty = useGraphStore((s) => s.isDirty);
    const save = useGraphStore((s) => s.save);
    const openNodeDialog = () => useUIStore.getState().openDialog("node");
    const openTripleDialog = () => useUIStore.getState().openDialog("triple");

    return (
        <div className="flex items-center gap-2 border-b px-4 py-2">
            <Button size="sm" variant="outline" onClick={openNodeDialog}>
                + 노드
            </Button>
            <Button size="sm" variant="outline" onClick={openTripleDialog}>
                + 관계
            </Button>
            <GraphInfo
                nodeCount={nodeCount}
                tripleCount={tripleCount}
                ruleCount={ruleCount}
            />
            <div className="flex-1" />
            <Button size="sm" onClick={save} disabled={!isDirty}>
                저장
            </Button>
        </div>
    );
}
