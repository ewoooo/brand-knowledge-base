import type { KnowledgeGraph, ValidationResult } from "./types";

function validateRules(graph: KnowledgeGraph): ValidationResult[] {
    return graph.rules.map((rule) => {
        const targetNodes = graph.nodes.filter(
            (n) => n.type === rule.condition.nodeType,
        );
        const violations: ValidationResult["violations"] = [];

        switch (rule.condition.operator) {
            case "must_have": {
                for (const node of targetNodes) {
                    const hasRelation = graph.triples.some(
                        (t) =>
                            t.subject === node.id &&
                            t.predicate === rule.condition.predicate,
                    );
                    if (!hasRelation) {
                        violations.push({
                            nodeId: node.id,
                            message: `${node.label}에 ${rule.condition.predicate} 관계가 없습니다`,
                        });
                    }
                }
                break;
            }

            case "must_not_have": {
                for (const node of targetNodes) {
                    const forbidden = graph.triples.find(
                        (t) =>
                            t.subject === node.id &&
                            t.predicate === rule.condition.predicate,
                    );
                    if (forbidden) {
                        violations.push({
                            nodeId: node.id,
                            message: `${node.label}에 금지된 ${rule.condition.predicate} 관계가 있습니다`,
                            relatedTripleId: forbidden.id,
                        });
                    }
                }
                break;
            }

            case "conflicts_with": {
                for (const node of targetNodes) {
                    const primaryObjects = graph.triples
                        .filter(
                            (t) =>
                                t.subject === node.id &&
                                t.predicate === rule.condition.predicate,
                        )
                        .map((t) => t.object);

                    const conflicting = graph.triples.find(
                        (t) =>
                            t.subject === node.id &&
                            t.predicate === rule.condition.conflictPredicate &&
                            primaryObjects.includes(t.object),
                    );

                    if (conflicting) {
                        violations.push({
                            nodeId: node.id,
                            message: `${node.label}의 ${rule.condition.predicate}와 ${rule.condition.conflictPredicate}가 같은 대상(${conflicting.object})을 가리킵니다`,
                            relatedTripleId: conflicting.id,
                        });
                    }
                }
                break;
            }
        }

        return {
            ruleId: rule.id,
            ruleName: rule.name,
            status: violations.length === 0 ? "pass" : "fail",
            violations,
        } satisfies ValidationResult;
    });
}

function validateSchema(graph: KnowledgeGraph): ValidationResult[] {
    if (!graph.schema) return [];

    const results: ValidationResult[] = [];
    const validTypes = new Set(graph.schema.nodeTypes.map((nt) => nt.type));
    const validPredicates = new Set(graph.schema.linkTypes.map((lt) => lt.predicate));

    // 노드 타입 검증
    const nodeTypeViolations: ValidationResult["violations"] = [];
    for (const node of graph.nodes) {
        if (!validTypes.has(node.type)) {
            nodeTypeViolations.push({
                nodeId: node.id,
                message: `노드 "${node.label}"의 타입 "${node.type}"이 스키마에 정의되지 않았습니다`,
            });
        }
    }
    results.push({
        ruleId: "schema:node-type",
        ruleName: "노드 타입 스키마 검증",
        status: nodeTypeViolations.length === 0 ? "pass" : "fail",
        violations: nodeTypeViolations,
    });

    // 필수 속성 검증
    const propViolations: ValidationResult["violations"] = [];
    for (const node of graph.nodes) {
        const nodeType = graph.schema.nodeTypes.find((nt) => nt.type === node.type);
        if (!nodeType) continue;
        for (const propDef of nodeType.properties) {
            if (propDef.required && (node.props == null || !(propDef.key in node.props))) {
                propViolations.push({
                    nodeId: node.id,
                    message: `노드 "${node.label}"에 필수 속성 "${propDef.key}"이 없습니다`,
                });
            }
        }
    }
    results.push({
        ruleId: "schema:required-props",
        ruleName: "필수 속성 검증",
        status: propViolations.length === 0 ? "pass" : "fail",
        violations: propViolations,
    });

    // 관계 타입 검증
    const linkViolations: ValidationResult["violations"] = [];
    for (const triple of graph.triples) {
        if (!validPredicates.has(triple.predicate)) {
            linkViolations.push({
                nodeId: triple.subject,
                message: `관계 "${triple.predicate}"가 스키마에 정의되지 않았습니다`,
                relatedTripleId: triple.id,
            });
        }
    }
    results.push({
        ruleId: "schema:link-type",
        ruleName: "관계 타입 스키마 검증",
        status: linkViolations.length === 0 ? "pass" : "fail",
        violations: linkViolations,
    });

    return results;
}

export function validate(graph: KnowledgeGraph): ValidationResult[] {
    return [...validateSchema(graph), ...validateRules(graph)];
}
