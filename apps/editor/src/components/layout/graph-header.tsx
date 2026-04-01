import { Button } from "@/components/ui/button";
import { GraphInfo } from "@/components/blocks/graph-info";

interface GraphHeaderProps {
    stats: { nodeCount: number; tripleCount: number; ruleCount: number } | null;
    isDirty: boolean;
    onAddNode: () => void;
    onAddTriple: () => void;
    onSave: () => void;
}

export function GraphHeader({
    stats,
    isDirty,
    onAddNode,
    onAddTriple,
    onSave,
}: GraphHeaderProps) {
    return (
        <div className="flex items-center gap-2 border-b px-4 py-2">
            <Button size="sm" variant="outline" onClick={onAddNode}>
                + 노드
            </Button>
            <Button size="sm" variant="outline" onClick={onAddTriple}>
                + 관계
            </Button>
            {stats && (
                <GraphInfo
                    nodeCount={stats.nodeCount}
                    tripleCount={stats.tripleCount}
                    ruleCount={stats.ruleCount}
                />
            )}
            <div className="flex-1" />
            <Button size="sm" onClick={onSave} disabled={!isDirty}>
                저장
            </Button>
        </div>
    );
}
