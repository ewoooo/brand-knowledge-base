"use client";

import { useEffect } from "react";
import Canvas from "@/components/graph/canvas";
import { NodeContextMenu } from "@/components/graph/node-context-menu";
import { SearchOverlay } from "@/components/patterns/search-overlay";
import { GraphHeader } from "@/components/layout/graph-header";
import { Alert, AlertDescription } from "@/components/patterns/alert";
import { useGraphStore } from "@/store/graph-store";
import { useUIStore } from "@/store/ui-store";
import { useValidationStore } from "@/store/validation-store";
import { selectNodes } from "@/store/selectors/node-selectors";
import { findMatchingNodeIds } from "@/lib/match-search-query";

export function AppGraph() {
    const graph = useGraphStore((s) => s.graph);
    const nodes = useGraphStore(selectNodes);
    const selection = useUIStore((s) => s.selection);
    const hiddenTypes = useUIStore((s) => s.hiddenTypes);
    const focusedNodeId = useUIStore((s) => s.focusedNodeId);
    const searchOpen = useUIStore((s) => s.searchOpen);
    const searchQuery = useUIStore((s) => s.searchQuery);
    const contextMenu = useUIStore((s) => s.contextMenu);
    const { violatedNodeIds, violatedTripleIds, failCount } =
        useValidationStore();

    const selectedNodeId =
        selection?.type === "node" ? selection.id : null;
    const selectedEdgeId =
        selection?.type === "edge" ? selection.id : null;

    // Search highlighting
    const matchedNodeIds = findMatchingNodeIds(nodes, searchQuery);
    const highlightedNodeIds = searchOpen ? matchedNodeIds : null;

    // Global keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                useUIStore.getState().openSearch();
                useUIStore.getState().setFocusedNodeId(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleClearSelection = () => {
        useUIStore.getState().clearSelection();
        useUIStore.getState().setFocusedNodeId(null);
        useUIStore.getState().closeContextMenu();
    };

    const handleFocusNode = (nodeId: string | null) => {
        const current = useUIStore.getState().focusedNodeId;
        useUIStore.getState().setFocusedNodeId(
            current === nodeId ? null : nodeId,
        );
    };

    const handleSearchSelect = (nodeId: string) => {
        useUIStore.getState().selectNode(nodeId);
        handleFocusNode(nodeId);
    };

    const getNodeLabel = (id: string) =>
        graph?.nodes.find((n) => n.id === id)?.label ?? id;

    if (!graph) return null;

    return (
        <div className="flex flex-1 flex-col">
            <GraphHeader />

            <div className="relative flex-1">
                <SearchOverlay
                    open={searchOpen}
                    onClose={() => useUIStore.getState().closeSearch()}
                    nodes={nodes}
                    onSelectNode={handleSearchSelect}
                    onQueryChange={(q) =>
                        useUIStore.getState().setSearchQuery(q)
                    }
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
                    highlightedNodeIds={highlightedNodeIds}
                    onSelectNode={(id) =>
                        useUIStore.getState().selectNode(id)
                    }
                    onSelectEdge={(id) =>
                        useUIStore.getState().selectEdge(id)
                    }
                    onClearSelection={handleClearSelection}
                    onDoubleClickCanvas={() =>
                        useUIStore.getState().openDialog("node")
                    }
                    onFocusNode={handleFocusNode}
                    onContextMenu={(nodeId, position) =>
                        useUIStore.getState().openContextMenu(nodeId, position)
                    }
                />
            </div>

            {contextMenu && (
                <NodeContextMenu
                    nodeId={contextMenu.nodeId}
                    nodeLabel={getNodeLabel(contextMenu.nodeId)}
                    position={contextMenu.position}
                    onClose={() =>
                        useUIStore.getState().closeContextMenu()
                    }
                    onAddRelation={() =>
                        useUIStore.getState().openDialog("triple")
                    }
                    onEditNode={(id) =>
                        useUIStore.getState().openDialog("node", id)
                    }
                    onDeleteNode={(id) => {
                        useGraphStore.getState().removeNode(id);
                        useUIStore.getState().clearSelection();
                    }}
                />
            )}
        </div>
    );
}
