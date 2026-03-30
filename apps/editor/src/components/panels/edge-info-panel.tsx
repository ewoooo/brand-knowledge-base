import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { KnowledgeGraph, Triple } from "@knowledgeview/kg-core";

interface EdgeInfoPanelProps {
    graph: KnowledgeGraph;
    triple: Triple;
    onEditTriple: (tripleId: string) => void;
    onDeleteTriple: (tripleId: string) => void;
}

export function EdgeInfoPanel({
    graph,
    triple,
    onEditTriple,
    onDeleteTriple,
}: EdgeInfoPanelProps) {
    const nodeLabelById = (id: string) => {
        const n = graph.nodes.find((nd) => nd.id === id);
        return n ? n.label : id;
    };

    return (
        <div className="space-y-4 p-4">
            <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                    관계
                </p>
                <div className="border-border bg-muted/30 rounded-md border px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                        <span
                            className="max-w-full truncate font-medium"
                            title={nodeLabelById(triple.subject)}
                        >
                            {nodeLabelById(triple.subject)}
                        </span>
                        <span className="text-muted-foreground shrink-0">→</span>
                        <span
                            className="text-primary max-w-full truncate font-medium"
                            title={triple.predicate}
                        >
                            {triple.predicate}
                        </span>
                        <span className="text-muted-foreground shrink-0">→</span>
                        <span
                            className="max-w-full truncate font-medium"
                            title={nodeLabelById(triple.object)}
                        >
                            {nodeLabelById(triple.object)}
                        </span>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEditTriple(triple.id)}
                >
                    편집
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => onDeleteTriple(triple.id)}
                >
                    삭제
                </Button>
            </div>
        </div>
    );
}
