import { Trash2 } from "lucide-react";
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
            className={`group relative cursor-pointer overflow-hidden rounded-md border px-3 py-2 text-xs transition-colors hover:bg-muted/50 ${
                isViolating
                    ? "border-red-500 bg-red-500/5"
                    : "border-border bg-muted/30"
            }`}
            onClick={() => onEditTriple(triple.id)}
        >
            <div className="truncate pr-7" title={title}>
                {isViolating && <span className="mr-1 text-red-500">⚠</span>}
                {direction === "outgoing" ? (
                    <>
                        <span className="text-primary">{triple.predicate}</span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFocusNode(targetId);
                            }}
                            className="font-medium underline-offset-2 hover:underline"
                        >
                            {nodeLabelById(targetId)}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFocusNode(targetId);
                            }}
                            className="font-medium underline-offset-2 hover:underline"
                        >
                            {nodeLabelById(targetId)}
                        </button>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className="text-primary">{triple.predicate}</span>
                    </>
                )}
            </div>
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTriple(triple.id);
                    }}
                    className="rounded p-0.5 text-red-400 hover:bg-red-500/10 hover:text-red-500"
                >
                    <Trash2 className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
