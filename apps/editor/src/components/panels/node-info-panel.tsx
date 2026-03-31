import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountBadge } from "@/components/ui/count-badge";
import { Separator } from "@/components/ui/separator";
import { TripleCard } from "@/components/panels/triple-card";
import { Pencil, Trash2 } from "lucide-react";
import type {
    KnowledgeGraph,
    Node,
    TypeRegistry,
    ValidationResult,
} from "@knowledgeview/kg-core";
import { PropertyEditor, getFieldsForType } from "@/components/forms/property-editor";
import { getNodeTypeDisplayName } from "@/lib/schema-display";

interface NodeInfoPanelProps {
    graph: KnowledgeGraph;
    node: Node;
    schema?: TypeRegistry;
    validationResults: ValidationResult[];
    onEditNode: (nodeId: string) => void;
    onDeleteNode: (nodeId: string) => void;
    onEditTriple: (tripleId: string) => void;
    onDeleteTriple: (tripleId: string) => void;
    onFocusNode: (nodeId: string) => void;
}

export function NodeInfoPanel({
    graph,
    node,
    schema,
    validationResults,
    onEditNode,
    onDeleteNode,
    onEditTriple,
    onDeleteTriple,
    onFocusNode,
}: NodeInfoPanelProps) {
    const nodeViolations = validationResults.flatMap((r) =>
        r.violations
            .filter((v) => v.nodeId === node.id)
            .map((v) => ({
                ruleName: r.ruleName,
                message: v.message,
                relatedTripleId: v.relatedTripleId,
            })),
    );

    const violatingTripleIds = new Set(
        nodeViolations.map((v) => v.relatedTripleId).filter(Boolean),
    );

    const outgoingTriples = graph.triples.filter((t) => t.subject === node.id);
    const incomingTriples = graph.triples.filter((t) => t.object === node.id);

    const nodeLabelById = (id: string) => {
        const n = graph.nodes.find((nd) => nd.id === id);
        return n ? n.label : id;
    };

    const schemaProperties = getFieldsForType(schema, node.type);
    const hasSchemaProps = schemaProperties.length > 0;
    const hasFallbackProps =
        !hasSchemaProps && node.props && Object.keys(node.props).length > 0;

    return (
        <div className="max-w-full space-y-4 overflow-hidden p-4">
            {/* Label and type */}
            <div className="space-y-1">
                <div className="flex items-start gap-1">
                    <p
                        className="min-w-0 flex-1 truncate text-base font-semibold"
                        title={node.label}
                    >
                        {node.label}
                    </p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => onEditNode(node.id)}
                    >
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-red-400 hover:text-red-500"
                        onClick={() => onDeleteNode(node.id)}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
                {node.type && (
                    <Badge variant="secondary" title={node.type}>
                        {getNodeTypeDisplayName(schema, node.type)}
                    </Badge>
                )}
            </div>

            {/* Properties (read-only, schema-driven) */}
            {hasSchemaProps && (
                <>
                    <Separator />
                    <PropertyEditor
                        properties={schemaProperties}
                        values={node.props ?? {}}
                        readOnly
                    />
                </>
            )}

            {/* Properties (fallback: raw key-value when no schema) */}
            {!hasSchemaProps && hasFallbackProps && (
                <>
                    <Separator />
                    <div className="space-y-3">
                        <p className="text-muted-foreground text-xs font-medium uppercase">
                            속성
                        </p>
                        <div className="space-y-2">
                            {Object.entries(node.props!).map(([key, val]) => (
                                <div key={key} className="space-y-0.5">
                                    <p className="text-muted-foreground text-[11px]">
                                        {key}
                                    </p>
                                    <p className="truncate text-sm" title={String(val)}>
                                        {String(val)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Violation alerts */}
            {nodeViolations.length > 0 && (
                <div className="space-y-2">
                    {nodeViolations.map((v, i) => (
                        <Alert key={i} variant="destructive">
                            <AlertTitle>{v.ruleName}</AlertTitle>
                            <AlertDescription>{v.message}</AlertDescription>
                        </Alert>
                    ))}
                </div>
            )}

            <Separator />

            {/* Outgoing triples */}
            <div>
                <div className="mb-2 flex items-center gap-1.5">
                    <p className="text-muted-foreground text-xs font-medium uppercase">
                        나가는 관계
                    </p>
                    <CountBadge count={outgoingTriples.length} />
                </div>
                {outgoingTriples.length === 0 ? (
                    <p className="text-muted-foreground text-xs">없음</p>
                ) : (
                    <div className="space-y-1.5">
                        {outgoingTriples.map((t) => (
                            <TripleCard
                                key={t.id}
                                triple={t}
                                direction="outgoing"
                                isViolating={violatingTripleIds.has(t.id)}
                                nodeLabelById={nodeLabelById}
                                onFocusNode={onFocusNode}
                                onEditTriple={onEditTriple}
                                onDeleteTriple={onDeleteTriple}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Separator />

            {/* Incoming triples */}
            <div>
                <div className="mb-2 flex items-center gap-1.5">
                    <p className="text-muted-foreground text-xs font-medium uppercase">
                        들어오는 관계
                    </p>
                    <CountBadge count={incomingTriples.length} />
                </div>
                {incomingTriples.length === 0 ? (
                    <p className="text-muted-foreground text-xs">없음</p>
                ) : (
                    <div className="space-y-1.5">
                        {incomingTriples.map((t) => (
                            <TripleCard
                                key={t.id}
                                triple={t}
                                direction="incoming"
                                isViolating={violatingTripleIds.has(t.id)}
                                nodeLabelById={nodeLabelById}
                                onFocusNode={onFocusNode}
                                onEditTriple={onEditTriple}
                                onDeleteTriple={onDeleteTriple}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
