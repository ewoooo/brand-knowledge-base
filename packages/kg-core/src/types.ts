// --- Semantic Layer: 스키마 정의 ---

export interface PropertyDef {
    key: string;
    displayName: string;
    valueType: "string" | "text" | "number" | "boolean" | "date" | "url" | "enum" | "array";
    required?: boolean;
    enumValues?: string[];
    description?: string;
}

export interface NodeType {
    type: string;
    displayName: string;
    description: string;
    properties: PropertyDef[];
    visual?: {
        color?: string;
        size?: number;
        icon?: string;
    };
}

export interface LinkType {
    predicate: string;
    displayName: string;
    description?: string;
    sourceTypes: string[];
    targetTypes: string[];
    cardinality: "1:1" | "1:N" | "N:1" | "N:N";
    inverseDisplayName?: string;
}

export interface TypeRegistry {
    nodeTypes: NodeType[];
    linkTypes: LinkType[];
}

export interface TripleMetadata {
    confidence?: number;
    source?: string;
    createdAt?: string;
    note?: string;
}

// --- 데이터 모델 ---

export interface Triple {
    id: string;
    subject: string;
    predicate: string;
    object: string;
    metadata?: TripleMetadata;
}

export interface Node {
    id: string;
    label: string;
    type: string;
    description?: string;
    props?: Record<string, unknown>;
}

export interface RuleCondition {
    nodeType: string;
    predicate: string;
    operator: "must_have" | "must_not_have" | "conflicts_with";
    conflictPredicate?: string;
}

export interface Rule {
    id: string;
    name: string;
    expression: string;
    type: "constraint" | "inference" | "validation";
    condition: RuleCondition;
}

export interface KnowledgeGraph {
    metadata: {
        name: string;
        created: string;
        updated: string;
        schemaVersion?: string;
        systemPrompt?: string;
    };
    schema?: TypeRegistry;
    nodes: Node[];
    triples: Triple[];
    rules: Rule[];
}

export interface ValidationResult {
    ruleId: string;
    ruleName: string;
    status: "pass" | "fail";
    violations: {
        nodeId: string;
        message: string;
        relatedTripleId?: string;
    }[];
}
