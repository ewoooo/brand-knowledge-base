"use client";

import { NodeForm } from "@/components/blocks/node/node-form";
import { TripleForm } from "@/components/blocks/triple/triple-form";
import { RuleForm } from "@/components/blocks/rule/rule-form";
import { useGraphStore } from "@/store/graph-store";
import { useUIStore } from "@/store/ui-store";
import { selectExistingTypes, selectSchema } from "@/store/selectors/node-selectors";
import { selectPredicates } from "@/store/selectors/triple-selectors";
import type { Node, Rule } from "@knowledgeview/kg-core";

export function Dialogs() {
    const nodeDialog = useUIStore((s) => s.nodeDialog);
    const tripleDialog = useUIStore((s) => s.tripleDialog);
    const ruleDialog = useUIStore((s) => s.ruleDialog);

    // graph를 구독하여 editingId에 해당하는 엔티티를 직접 파생
    const graph = useGraphStore((s) => s.graph);
    const schema = useGraphStore(selectSchema);
    const existingTypes = useGraphStore(selectExistingTypes);
    const nodes = useGraphStore((s) => s.graph?.nodes ?? []);
    const linkTypes = useGraphStore((s) => s.graph?.schema?.linkTypes);
    const predicates = useGraphStore(selectPredicates);

    const editingNode = nodeDialog.editingId
        ? (graph?.nodes.find((n) => n.id === nodeDialog.editingId) ?? null)
        : null;
    const editingTriple = tripleDialog.editingId
        ? (graph?.triples.find((t) => t.id === tripleDialog.editingId) ?? null)
        : null;
    const editingRule = ruleDialog.editingId
        ? (graph?.rules.find((r) => r.id === ruleDialog.editingId) ?? null)
        : null;

    const handleNodeSubmit = (data: Omit<Node, "id">) => {
        if (nodeDialog.editingId) {
            useGraphStore.getState().updateNode(nodeDialog.editingId, data);
        } else {
            useGraphStore.getState().addNode(data);
        }
    };

    const handleTripleSubmit = (data: {
        subject: string;
        predicate: string;
        object: string;
    }) => {
        if (tripleDialog.editingId) {
            useGraphStore.getState().updateTriple(tripleDialog.editingId, data);
        } else {
            useGraphStore.getState().addTriple(data);
        }
    };

    const handleRuleSubmit = (data: Omit<Rule, "id">) => {
        if (ruleDialog.editingId) {
            useGraphStore.getState().updateRule(ruleDialog.editingId, data);
        } else {
            useGraphStore.getState().addRule(data);
        }
    };

    return (
        <>
            <NodeForm
                open={nodeDialog.open}
                onClose={() => useUIStore.getState().closeDialog("node")}
                onSubmit={handleNodeSubmit}
                initial={
                    editingNode
                        ? {
                              label: editingNode.label,
                              type: editingNode.type,
                              description: editingNode.description,
                              props: editingNode.props,
                          }
                        : undefined
                }
                existingTypes={existingTypes}
                schema={schema}
            />

            <TripleForm
                open={tripleDialog.open}
                onClose={() => useUIStore.getState().closeDialog("triple")}
                onSubmit={handleTripleSubmit}
                nodes={nodes}
                linkTypes={linkTypes}
                initial={
                    editingTriple
                        ? {
                              subject: editingTriple.subject,
                              predicate: editingTriple.predicate,
                              object: editingTriple.object,
                          }
                        : undefined
                }
            />

            <RuleForm
                open={ruleDialog.open}
                onClose={() => useUIStore.getState().closeDialog("rule")}
                onSubmit={handleRuleSubmit}
                nodeTypes={existingTypes}
                predicates={predicates}
                initial={
                    editingRule
                        ? {
                              name: editingRule.name,
                              type: editingRule.type,
                              condition: { ...editingRule.condition },
                          }
                        : undefined
                }
            />
        </>
    );
}
