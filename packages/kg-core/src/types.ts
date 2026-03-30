export interface Triple {
    id: string;
    subject: string;
    predicate: string;
    object: string;
}

export interface Node {
    id: string;
    label: string;
    type?: string;
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
        systemPrompt?: string;
    };
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
