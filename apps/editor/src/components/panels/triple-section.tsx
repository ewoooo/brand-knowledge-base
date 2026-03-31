import { PanelSection } from "@/components/panels/panel-section";
import { TripleCard } from "@/components/ui/patterns/cards/triple-card";
import type { Triple } from "@knowledgeview/kg-core";

interface TripleSectionProps {
    title: string;
    triples: Triple[];
    direction: "outgoing" | "incoming";
    violatingIds: Set<string | undefined>;
    nodeLabelById: (id: string) => string;
    onFocusNode: (nodeId: string) => void;
    onEditTriple: (tripleId: string) => void;
    onDeleteTriple: (tripleId: string) => void;
}

export function TripleSection({
    title,
    triples,
    direction,
    violatingIds,
    nodeLabelById,
    onFocusNode,
    onEditTriple,
    onDeleteTriple,
}: TripleSectionProps) {
    return (
        <PanelSection title={title} count={triples.length} empty="없음">
            {triples.length > 0 && (
                <div className="space-y-1.5">
                    {triples.map((t) => (
                        <TripleCard
                            key={t.id}
                            triple={t}
                            direction={direction}
                            isViolating={violatingIds.has(t.id)}
                            nodeLabelById={nodeLabelById}
                            onFocusNode={onFocusNode}
                            onEditTriple={onEditTriple}
                            onDeleteTriple={onDeleteTriple}
                        />
                    ))}
                </div>
            )}
        </PanelSection>
    );
}
