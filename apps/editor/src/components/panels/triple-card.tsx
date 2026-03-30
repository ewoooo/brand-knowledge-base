import type { Triple } from "@knowledgeview/kg-core";

interface TripleCardProps {
    triple: Triple;
    direction: "outgoing" | "incoming";
    isViolating: boolean;
    nodeLabelById: (id: string) => string;
    onFocusNode: (nodeId: string) => void;
    onEditTriple: (tripleId: string) => void;
    onDeleteTriple: (tripleId: string) => void;
}

export function TripleCard({
    triple,
    direction,
    isViolating,
    nodeLabelById,
    onFocusNode,
    onEditTriple,
    onDeleteTriple,
}: TripleCardProps) {
    const targetId = direction === "outgoing" ? triple.object : triple.subject;
    const title =
        direction === "outgoing"
            ? `${triple.predicate} → ${nodeLabelById(triple.object)}`
            : `${nodeLabelById(triple.subject)} → ${triple.predicate}`;

    return (
        <div
            className={`group relative overflow-hidden rounded-md border px-3 py-2 text-xs ${
                isViolating
                    ? "border-red-500 bg-red-500/5"
                    : "border-border bg-muted/30"
            }`}
        >
            <div className="truncate pr-14" title={title}>
                {isViolating && <span className="mr-1 text-red-500">⚠</span>}
                {direction === "outgoing" ? (
                    <>
                        <span className="text-primary">{triple.predicate}</span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <button
                            type="button"
                            onClick={() => onFocusNode(targetId)}
                            className="font-medium underline-offset-2 hover:underline"
                        >
                            {nodeLabelById(targetId)}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => onFocusNode(targetId)}
                            className="font-medium underline-offset-2 hover:underline"
                        >
                            {nodeLabelById(targetId)}
                        </button>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className="text-primary">{triple.predicate}</span>
                    </>
                )}
            </div>
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    onClick={() => onEditTriple(triple.id)}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded px-1.5 py-0.5 text-[10px]"
                >
                    편집
                </button>
                <button
                    onClick={() => onDeleteTriple(triple.id)}
                    className="rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10"
                >
                    삭제
                </button>
            </div>
        </div>
    );
}
