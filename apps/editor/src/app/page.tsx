"use client";

import { useState, useCallback } from "react";
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
import { useRules } from "@/hooks/use-rules";
import { useDialogs } from "@/hooks/use-dialogs";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useSearch } from "@/hooks/use-search";
import { Button } from "@/components/ui/primitives/button";
import { Alert, AlertDescription } from "@/components/ui/patterns/alert";

export default function Home() {
    const {
        graph,
        filename,
        isDirty,
        load,
        save,
        addNode,
        removeNode,
        updateNode,
        addTriple,
        removeTriple,
        updateTriple,
        addRule,
        updateSystemPrompt,
        addPropertyDef,
        removePropertyDef,
    } = useGraph(null);

    const { selection, selectNode, selectEdge, clearSelection } =
        useSelection();
    const { results, violatedNodeIds, violatedTripleIds, failCount } =
        useRules(graph);

    const dialogs = useDialogs({
        graph,
        addNode,
        updateNode,
        addTriple,
        updateTriple,
        addRule,
    });

    const { contextMenu, openContextMenu, closeContextMenu } =
        useContextMenu();

    const clearFocus = useCallback(() => setFocusedNodeId(null), []);
    const search = useSearch(graph?.nodes ?? null, { onOpen: clearFocus });

    // Filter state
    const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

    const toggleTypeFilter = useCallback((type: string) => {
        setHiddenTypes((prev) => {
            const next = new Set(prev);
            if (next.has(type)) {
                next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
    }, []);

    // Focus state
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

    const handleFocusNode = useCallback((nodeId: string | null) => {
        setFocusedNodeId((prev) => (prev === nodeId ? null : nodeId));
    }, []);

    // Derive selected IDs from selection
    const selectedNodeId = selection?.type === "node" ? selection.id : null;
    const selectedEdgeId = selection?.type === "edge" ? selection.id : null;

    // --- Handlers ---

    const handleCreateGraph = useCallback(async () => {
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
    }, [load]);

    const handleClearSelection = useCallback(() => {
        clearSelection();
        setFocusedNodeId(null);
        closeContextMenu();
    }, [clearSelection, closeContextMenu]);

    const handleSearchClose = useCallback(() => {
        search.closeSearch();
    }, [search.closeSearch]);

    // --- No graph loaded state ---
    if (!graph) {
        return (
            <div className="flex h-screen">
                <Sidebar
                    currentFile={filename}
                    onSelectFile={load}
                    onCreateGraph={handleCreateGraph}
                    validationResults={results}
                    onAddRule={dialogs.openRuleCreate}
                    graph={null}
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
                validationResults={results}
                onAddRule={dialogs.openRuleCreate}
                graph={graph}
                schema={graph.schema}
                hiddenTypes={hiddenTypes}
                onToggleType={toggleTypeFilter}
            />

            <div className="flex flex-1 flex-col">
                {/* Toolbar */}
                <div className="flex items-center gap-2 border-b px-4 py-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={dialogs.openNodeCreate}
                    >
                        + 노드
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={dialogs.openTripleCreate}
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
                        onDoubleClickCanvas={dialogs.openNodeCreate}
                        onFocusNode={handleFocusNode}
                        onContextMenu={openContextMenu}
                    />
                </div>
            </div>

            <DetailPanel
                graph={graph}
                schema={graph.schema}
                selectedNodeId={selectedNodeId}
                selectedEdgeId={selectedEdgeId}
                validationResults={results}
                onEditNode={dialogs.openNodeEdit}
                onDeleteNode={removeNode}
                onEditTriple={dialogs.openTripleEdit}
                onDeleteTriple={removeTriple}
                onFocusNode={(nodeId: string) => {
                    selectNode(nodeId);
                    handleFocusNode(nodeId);
                }}
                onUpdateSystemPrompt={updateSystemPrompt}
                onAddPropertyDef={addPropertyDef}
                onRemovePropertyDef={removePropertyDef}
            />

            {/* Context menu */}
            {contextMenu && (
                <NodeContextMenu
                    nodeId={contextMenu.nodeId}
                    nodeLabel={
                        graph.nodes.find((n) => n.id === contextMenu.nodeId)
                            ?.label ?? ""
                    }
                    position={contextMenu.position}
                    onClose={closeContextMenu}
                    onAddRelation={() => {
                        dialogs.openTripleCreate();
                    }}
                    onEditNode={dialogs.openNodeEdit}
                    onDeleteNode={(id) => {
                        removeNode(id);
                        clearSelection();
                    }}
                />
            )}

            {/* Dialogs */}
            <NodeForm
                open={dialogs.nodeFormOpen}
                onClose={dialogs.closeNodeForm}
                onSubmit={dialogs.handleNodeSubmit}
                initial={
                    dialogs.editingNode
                        ? {
                              label: dialogs.editingNode.label,
                              type: dialogs.editingNode.type,
                              description: dialogs.editingNode.description,
                              props: dialogs.editingNode.props,
                          }
                        : undefined
                }
                existingTypes={[...new Set(graph.nodes.map((n) => n.type))]}
                schema={graph.schema}
            />

            <TripleForm
                open={dialogs.tripleFormOpen}
                onClose={dialogs.closeTripleForm}
                onSubmit={dialogs.handleTripleSubmit}
                nodes={graph.nodes}
                linkTypes={graph.schema?.linkTypes}
                initial={
                    dialogs.editingTriple
                        ? {
                              subject: dialogs.editingTriple.subject,
                              predicate: dialogs.editingTriple.predicate,
                              object: dialogs.editingTriple.object,
                          }
                        : undefined
                }
            />

            <RuleForm
                open={dialogs.ruleFormOpen}
                onClose={dialogs.closeRuleForm}
                onSubmit={dialogs.handleRuleSubmit}
                graph={graph}
            />
        </div>
    );
}
