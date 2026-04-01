"use client";

import { useState } from "react";
import Canvas from "@/components/graph/canvas";
import { NodeContextMenu } from "@/components/graph/node-context-menu";
import { SearchOverlay } from "@/components/graph/search-overlay";
import { Sidebar } from "@/components/panels/sidebar";
import { DetailPanel } from "@/components/panels/detail-panel";
import { NodeForm } from "@/components/forms/node-form";
import { TripleForm } from "@/components/forms/triple-form";
import { RuleForm } from "@/components/forms/rule-form";
import { useGraph } from "@/hooks/use-graph";
import { useSelection } from "@/hooks/use-selection";
import { useValidation } from "@/hooks/use-validation";
import { useNode } from "@/hooks/use-node";
import { useTriple } from "@/hooks/use-triple";
import { useRule } from "@/hooks/use-rule";
import { useDialog } from "@/hooks/use-dialog";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useSearch } from "@/hooks/use-search";
import { Button } from "@/components/ui/primitives/button";
import { Alert, AlertDescription } from "@/components/ui/patterns/alert";

export default function Home() {
    const {
        graph,
        filename,
        isDirty,
        stats,
        systemPrompt,
        linkTypes,
        load,
        save,
        addNode,
        removeNode,
        updateNode,
        addTriple,
        removeTriple,
        updateTriple,
        addRule,
        updateRule,
        removeRule,
        updateSystemPrompt,
        addPropertyDef,
        removePropertyDef,
    } = useGraph(null);

    const { selection, selectNode, selectEdge, clearSelection } =
        useSelection();
    const { results, violatedNodeIds, violatedTripleIds, failCount } =
        useValidation(graph);

    // 도메인 훅 (데이터)
    const nodeCrud = useNode({ graph, addNode, updateNode, removeNode });
    const tripleCrud = useTriple({ graph, addTriple, updateTriple, removeTriple });
    const ruleCrud = useRule({
        graph, addRule, updateRule, removeRule,
        validationResults: results,
    });

    // 다이얼로그 (UI 상태)
    const nodeDialog = useDialog();
    const tripleDialog = useDialog();
    const ruleDialog = useDialog();

    const { contextMenu, openContextMenu, closeContextMenu } =
        useContextMenu();

    const clearFocus = () => setFocusedNodeId(null);
    const search = useSearch(graph?.nodes ?? null, { onOpen: clearFocus });

    // Filter state
    const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

    const toggleTypeFilter = (type: string) => {
        setHiddenTypes((prev) => {
            const next = new Set(prev);
            if (next.has(type)) {
                next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
    };

    // Focus state
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

    const handleFocusNode = (nodeId: string | null) => {
        setFocusedNodeId((prev) => (prev === nodeId ? null : nodeId));
    };

    // Derive selected IDs from selection
    const selectedNodeId = selection?.type === "node" ? selection.id : null;
    const selectedEdgeId = selection?.type === "edge" ? selection.id : null;

    // --- Derived editing entities ---
    const editingNode = nodeCrud.getNode(nodeDialog.editingId);
    const editingTriple = tripleCrud.getTriple(tripleDialog.editingId);
    const editingRule = ruleCrud.getRule(ruleDialog.editingId);

    // --- Selected entities ---
    const selectedNode = nodeCrud.getNode(selectedNodeId);
    const selectedTriple = tripleCrud.getTriple(selectedEdgeId);
    const selectedNodeRelations = selectedNode
        ? nodeCrud.getRelations(selectedNode.id, tripleCrud.triples)
        : { outgoing: [], incoming: [] };

    // --- Handlers ---

    const handleCreateGraph = async () => {
        const name = prompt("그래프 이름을 입력하세요:");
        if (!name?.trim()) return;

        const res = await fetch("/api/graphs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim() }),
        });

        if (!res.ok) return;
        const data = await res.json();
        await load(data.filename);
    };

    const handleClearSelection = () => {
        clearSelection();
        setFocusedNodeId(null);
        closeContextMenu();
    };

    const handleSearchClose = () => search.closeSearch();

    // --- Submit handlers ---

    const handleNodeSubmit = (data: Parameters<typeof nodeCrud.handleSubmit>[1]) => {
        nodeCrud.handleSubmit(nodeDialog.editingId, data);
    };

    const handleTripleSubmit = (data: Parameters<typeof tripleCrud.handleSubmit>[1]) => {
        tripleCrud.handleSubmit(tripleDialog.editingId, data);
    };

    const handleRuleSubmit = (data: Parameters<typeof ruleCrud.handleSubmit>[1]) => {
        ruleCrud.handleSubmit(ruleDialog.editingId, data);
    };

    // --- No graph loaded state ---
    if (!graph) {
        return (
            <div className="flex h-screen">
                <Sidebar
                    currentFile={filename}
                    onSelectFile={load}
                    onCreateGraph={handleCreateGraph}
                    stats={null}
                    nodeTypes={[]}
                    ruleResults={ruleCrud.results}
                    onAddRule={ruleDialog.openCreate}
                    onEditRule={ruleDialog.openEdit}
                    onDeleteRule={ruleCrud.remove}
                    hiddenTypes={hiddenTypes}
                    onToggleType={toggleTypeFilter}
                />
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-muted-foreground">
                        좌측에서 그래프를 선택하거나 새로 만드세요
                    </p>
                </div>
            </div>
        );
    }

    // --- Main layout ---
    return (
        <div className="flex h-screen">
            <Sidebar
                currentFile={filename}
                onSelectFile={load}
                onCreateGraph={handleCreateGraph}
                stats={stats}
                nodeTypes={nodeCrud.nodeTypes}
                ruleResults={ruleCrud.results}
                onAddRule={ruleDialog.openCreate}
                onEditRule={ruleDialog.openEdit}
                onDeleteRule={ruleCrud.remove}
                hiddenTypes={hiddenTypes}
                onToggleType={toggleTypeFilter}
            />

            <div className="flex flex-1 flex-col">
                {/* Toolbar */}
                <div className="flex items-center gap-2 border-b px-4 py-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={nodeDialog.openCreate}
                    >
                        + 노드
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={tripleDialog.openCreate}
                    >
                        + 관계
                    </Button>
                    <div className="flex-1" />
                    <Button size="sm" onClick={save} disabled={!isDirty}>
                        저장
                    </Button>
                </div>

                {/* Canvas + violation banner */}
                <div className="relative flex-1">
                    <SearchOverlay
                        open={search.searchOpen}
                        query={search.searchQuery}
                        matchedCount={search.matchedCount}
                        onQueryChange={search.setSearchQuery}
                        onClose={handleSearchClose}
                    />

                    {failCount > 0 && (
                        <div className="absolute bottom-4 left-4 z-10">
                            <Alert variant="destructive" className="w-auto">
                                <AlertDescription>
                                    {failCount}건의 규칙 위반이 있습니다
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    <Canvas
                        graph={graph}
                        hiddenTypes={hiddenTypes}
                        violatedNodeIds={violatedNodeIds}
                        violatedTripleIds={violatedTripleIds}
                        selectedNodeId={selectedNodeId}
                        selectedEdgeId={selectedEdgeId}
                        focusedNodeId={focusedNodeId}
                        highlightedNodeIds={search.highlightedNodeIds}
                        onSelectNode={selectNode}
                        onSelectEdge={selectEdge}
                        onClearSelection={handleClearSelection}
                        onDoubleClickCanvas={nodeDialog.openCreate}
                        onFocusNode={handleFocusNode}
                        onContextMenu={openContextMenu}
                    />
                </div>
            </div>

            <DetailPanel
                selectedNode={selectedNode}
                selectedTriple={selectedTriple}
                schema={nodeCrud.schema}
                validationResults={results}
                onEditNode={nodeDialog.openEdit}
                onDeleteNode={nodeCrud.remove}
                onEditTriple={tripleDialog.openEdit}
                onDeleteTriple={tripleCrud.remove}
                onFocusNode={(nodeId: string) => {
                    selectNode(nodeId);
                    handleFocusNode(nodeId);
                }}
                onUpdateSystemPrompt={updateSystemPrompt}
                onAddPropertyDef={addPropertyDef}
                onRemovePropertyDef={removePropertyDef}
                nodes={nodeCrud.nodes}
                systemPrompt={systemPrompt}
                chatGraph={graph}
                outgoingTriples={selectedNodeRelations.outgoing}
                incomingTriples={selectedNodeRelations.incoming}
                getNodeLabel={nodeCrud.getNodeLabel}
            />

            {/* Context menu */}
            {contextMenu && (
                <NodeContextMenu
                    nodeId={contextMenu.nodeId}
                    nodeLabel={nodeCrud.getNodeLabel(contextMenu.nodeId)}
                    position={contextMenu.position}
                    onClose={closeContextMenu}
                    onAddRelation={tripleDialog.openCreate}
                    onEditNode={nodeDialog.openEdit}
                    onDeleteNode={(id) => {
                        nodeCrud.remove(id);
                        clearSelection();
                    }}
                />
            )}

            {/* Dialogs */}
            <NodeForm
                open={nodeDialog.open}
                onClose={nodeDialog.close}
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
                existingTypes={nodeCrud.existingTypes}
                schema={nodeCrud.schema}
            />

            <TripleForm
                open={tripleDialog.open}
                onClose={tripleDialog.close}
                onSubmit={handleTripleSubmit}
                nodes={nodeCrud.nodes}
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
                onClose={ruleDialog.close}
                onSubmit={handleRuleSubmit}
                nodeTypes={nodeCrud.existingTypes}
                predicates={tripleCrud.predicates}
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
        </div>
    );
}
