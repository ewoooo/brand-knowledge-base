"use client";

import { useState, useCallback } from "react";
import Canvas from "@/components/graph/canvas";
import { Sidebar } from "@/components/panels/sidebar";
import { DetailPanel } from "@/components/panels/detail-panel";
import { NodeForm } from "@/components/forms/node-form";
import { TripleForm } from "@/components/forms/triple-form";
import { RuleForm } from "@/components/forms/rule-form";
import { useGraph } from "@/hooks/use-graph";
import { useSelection } from "@/hooks/use-selection";
import { useRules } from "@/hooks/use-rules";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  } = useGraph(null);

  const { selection, selectNode, selectEdge, clearSelection } = useSelection();
  const { results, violatedNodeIds, violatedTripleIds, failCount } = useRules(graph);

  // Dialog state
  const [nodeFormOpen, setNodeFormOpen] = useState(false);
  const [tripleFormOpen, setTripleFormOpen] = useState(false);
  const [ruleFormOpen, setRuleFormOpen] = useState(false);

  // Editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingTripleId, setEditingTripleId] = useState<string | null>(null);

  // Derive selected IDs from selection
  const selectedNodeId = selection?.type === "node" ? selection.id : null;
  const selectedEdgeId = selection?.type === "edge" ? selection.id : null;

  // Find editing items from graph
  const editingNode = editingNodeId
    ? graph?.nodes.find((n) => n.id === editingNodeId) ?? null
    : null;

  const editingTriple = editingTripleId
    ? graph?.triples.find((t) => t.id === editingTripleId) ?? null
    : null;

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
    // data should contain the filename
    await load(data.filename);
  }, [load]);

  const handleEditNode = useCallback(
    (nodeId: string) => {
      setEditingNodeId(nodeId);
      setNodeFormOpen(true);
    },
    []
  );

  const handleEditTriple = useCallback(
    (tripleId: string) => {
      setEditingTripleId(tripleId);
      setTripleFormOpen(true);
    },
    []
  );

  const handleNodeFormClose = useCallback(() => {
    setNodeFormOpen(false);
    setEditingNodeId(null);
  }, []);

  const handleTripleFormClose = useCallback(() => {
    setTripleFormOpen(false);
    setEditingTripleId(null);
  }, []);

  const handleRuleFormClose = useCallback(() => {
    setRuleFormOpen(false);
  }, []);

  const handleNodeSubmit = useCallback(
    (data: { label: string; type?: string }) => {
      if (editingNodeId) {
        updateNode(editingNodeId, data);
      } else {
        addNode(data);
      }
    },
    [editingNodeId, updateNode, addNode]
  );

  const handleTripleSubmit = useCallback(
    (data: { subject: string; predicate: string; object: string }) => {
      if (editingTripleId) {
        updateTriple(editingTripleId, data);
      } else {
        addTriple(data);
      }
    },
    [editingTripleId, updateTriple, addTriple]
  );

  const handleRuleSubmit = useCallback(
    (data: {
      name: string;
      expression: string;
      type: "constraint" | "inference" | "validation";
      condition: { nodeType: string; predicate: string; operator: "must_have" | "must_not_have" | "conflicts_with"; conflictPredicate?: string };
    }) => {
      addRule(data);
    },
    [addRule]
  );

  const handleDoubleClickCanvas = useCallback(() => {
    setEditingNodeId(null);
    setNodeFormOpen(true);
  }, []);

  // --- No graph loaded state ---
  if (!graph) {
    return (
      <div className="flex h-screen">
        <Sidebar
          currentFile={filename}
          onSelectFile={load}
          onCreateGraph={handleCreateGraph}
          validationResults={results}
          onAddRule={() => setRuleFormOpen(true)}
          graph={null}
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
        onAddRule={() => setRuleFormOpen(true)}
        graph={graph}
      />

      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingNodeId(null); setNodeFormOpen(true); }}>
            + 노드
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setEditingTripleId(null); setTripleFormOpen(true); }}>
            + 트리플
          </Button>
          <div className="flex-1" />
          <Button size="sm" onClick={save} disabled={!isDirty}>
            저장
          </Button>
        </div>

        {/* Canvas + violation banner */}
        <div className="relative flex-1">
          {/* Violation banner at bottom-left */}
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
            violatedNodeIds={violatedNodeIds}
            violatedTripleIds={violatedTripleIds}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onSelectNode={selectNode}
            onSelectEdge={selectEdge}
            onClearSelection={clearSelection}
            onDoubleClickCanvas={handleDoubleClickCanvas}
          />
        </div>
      </div>

      <DetailPanel
        graph={graph}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        validationResults={results}
        onEditNode={handleEditNode}
        onDeleteNode={removeNode}
        onEditTriple={handleEditTriple}
        onDeleteTriple={removeTriple}
      />

      {/* Dialogs */}
      <NodeForm
        open={nodeFormOpen}
        onClose={handleNodeFormClose}
        onSubmit={handleNodeSubmit}
        initial={editingNode ? { label: editingNode.label, type: editingNode.type } : undefined}
        existingTypes={graph.nodes.map((n) => n.type).filter((t): t is string => !!t)}
      />

      <TripleForm
        open={tripleFormOpen}
        onClose={handleTripleFormClose}
        onSubmit={handleTripleSubmit}
        nodes={graph.nodes}
        initial={
          editingTriple
            ? { subject: editingTriple.subject, predicate: editingTriple.predicate, object: editingTriple.object }
            : undefined
        }
      />

      <RuleForm
        open={ruleFormOpen}
        onClose={handleRuleFormClose}
        onSubmit={handleRuleSubmit}
        graph={graph}
      />
    </div>
  );
}
