import { useState } from "react";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/patterns/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PanelSection } from "@/components/blocks/panel-section";
import { TripleSection } from "@/components/blocks/triple/triple-section";
import { AddPropertyDefForm } from "@/components/blocks/property/property-def-form";
import {
    PropertyField,
    getDisplayFields,
    getFieldsForType,
} from "@/components/blocks/property/property-field";
import { getNodeTypeDisplayName } from "@/lib/resolve-schema-display";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type {
    Node,
    Triple,
    PropertyDef,
    TypeRegistry,
    ValidationResult,
} from "@knowledgeview/kg-core";

/* ------------------------------------------------------------------ */
/*  NodeInfoPanel                                                      */
/* ------------------------------------------------------------------ */

interface NodeInfoPanelProps {
    node: Node;
    schema?: TypeRegistry;
    validationResults: ValidationResult[];
    outgoingTriples: Triple[];
    incomingTriples: Triple[];
    getNodeLabel: (id: string) => string;
    onEditNode: (nodeId: string) => void;
    onDeleteNode: (nodeId: string) => void;
    onEditTriple: (tripleId: string) => void;
    onDeleteTriple: (tripleId: string) => void;
    onFocusNode: (nodeId: string) => void;
    onAddPropertyDef?: (nodeType: string, prop: PropertyDef) => void;
    onRemovePropertyDef?: (nodeType: string, propertyKey: string) => void;
}

export function NodeInfoPanel({
    node,
    schema,
    validationResults,
    outgoingTriples,
    incomingTriples,
    getNodeLabel,
    onEditNode,
    onDeleteNode,
    onEditTriple,
    onDeleteTriple,
    onFocusNode,
    onAddPropertyDef,
    onRemovePropertyDef,
}: NodeInfoPanelProps) {
    const [showAddProp, setShowAddProp] = useState(false);

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

    const nodeLabelById = getNodeLabel;

    const schemaProperties = getFieldsForType(schema, node.type);
    const displayProperties = getDisplayFields(schemaProperties, node.props);
    const hasSchemaProps = displayProperties.length > 0;
    const hasFallbackProps =
        !hasSchemaProps && !!node.props && Object.keys(node.props).length > 0;
    const canAddProp = !!onAddPropertyDef && !!schema;

    return (
        <div className="max-w-full space-y-4 overflow-hidden p-4">
            {/* Header */}
            <NodeHeader
                node={node}
                schema={schema}
                onEdit={() => onEditNode(node.id)}
                onDelete={() => onDeleteNode(node.id)}
            />

            {/* Description */}
            {node.description && (
                <PanelSection title="설명">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {node.description}
                    </p>
                </PanelSection>
            )}

            {/* Properties */}
            <PanelSection
                title="속성"
                action={
                    canAddProp && hasSchemaProps ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() => setShowAddProp(true)}
                            title="속성 정의 추가"
                        >
                            <Plus className="size-3.5" />
                        </Button>
                    ) : undefined
                }
            >
                {hasSchemaProps && (
                    <PropertyList
                        properties={displayProperties}
                        values={node.props ?? {}}
                        nodeType={node.type}
                        onRemove={onRemovePropertyDef}
                    />
                )}

                {hasFallbackProps && (
                    <FallbackPropertyList props={node.props!} />
                )}

                {!hasSchemaProps &&
                    !hasFallbackProps &&
                    canAddProp &&
                    !showAddProp && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-7 w-full justify-start gap-1.5 text-xs"
                            onClick={() => setShowAddProp(true)}
                        >
                            <Plus className="size-3" />
                            속성 추가
                        </Button>
                    )}

                {showAddProp && onAddPropertyDef && (
                    <AddPropertyDefForm
                        onSubmit={(prop) => {
                            onAddPropertyDef(node.type, prop);
                            setShowAddProp(false);
                        }}
                        onCancel={() => setShowAddProp(false)}
                        existingKeys={schemaProperties.map((p) => p.key)}
                    />
                )}
            </PanelSection>

            {/* Violations */}
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

            {/* Triples */}
            <TripleSection
                title="나가는 관계"
                triples={outgoingTriples}
                direction="outgoing"
                violatingIds={violatingTripleIds}
                nodeLabelById={nodeLabelById}
                onFocusNode={onFocusNode}
                onEditTriple={onEditTriple}
                onDeleteTriple={onDeleteTriple}
            />

            <TripleSection
                title="들어오는 관계"
                triples={incomingTriples}
                direction="incoming"
                violatingIds={violatingTripleIds}
                nodeLabelById={nodeLabelById}
                onFocusNode={onFocusNode}
                onEditTriple={onEditTriple}
                onDeleteTriple={onDeleteTriple}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function NodeHeader({
    node,
    schema,
    onEdit,
    onDelete,
}: {
    node: Node;
    schema?: TypeRegistry;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
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
                    onClick={onEdit}
                >
                    <Pencil className="size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-red-400 hover:text-red-500"
                    onClick={onDelete}
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
    );
}

function PropertyList({
    properties,
    values,
    nodeType,
    onRemove,
}: {
    properties: PropertyDef[];
    values: Record<string, unknown>;
    nodeType: string;
    onRemove?: (nodeType: string, key: string) => void;
}) {
    return (
        <div className="space-y-2">
            {properties.map((prop) => (
                <div key={prop.key} className="group flex items-start gap-1">
                    <div className="min-w-0 flex-1">
                        <PropertyField
                            properties={[prop]}
                            values={values}
                            readOnly
                        />
                    </div>
                    {onRemove && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={() => onRemove(nodeType, prop.key)}
                            title={`'${prop.displayName}' 속성 정의 삭제`}
                        >
                            <X className="size-3 text-red-400" />
                        </Button>
                    )}
                </div>
            ))}
        </div>
    );
}

function FallbackPropertyList({ props }: { props: Record<string, unknown> }) {
    return (
        <div className="space-y-2">
            {Object.entries(props).map(([key, val]) => (
                <div key={key} className="space-y-0.5">
                    <p className="text-muted-foreground text-[11px]">{key}</p>
                    <p className="truncate text-sm" title={String(val)}>
                        {String(val)}
                    </p>
                </div>
            ))}
        </div>
    );
}
