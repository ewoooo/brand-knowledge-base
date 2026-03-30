import type { KnowledgeGraph, ValidationResult } from "./types";

export function validate(graph: KnowledgeGraph): ValidationResult[] {
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
