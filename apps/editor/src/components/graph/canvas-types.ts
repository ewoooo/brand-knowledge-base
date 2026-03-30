import type * as d3 from "d3";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";

/* ------------------------------------------------------------------ */
/*  Simulation types                                                   */
/* ------------------------------------------------------------------ */

export interface SimNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    type?: string;
}

export interface SimLink extends d3.SimulationLinkDatum<SimNode> {
    id: string;
    predicate: string;
}

/* ------------------------------------------------------------------ */
/*  Component props                                                    */
/* ------------------------------------------------------------------ */

export interface CanvasProps {
    graph: KnowledgeGraph;
    hiddenTypes: Set<string>;
    violatedNodeIds: Set<string>;
    violatedTripleIds: Set<string>;
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    focusedNodeId: string | null;
    highlightedNodeIds: Set<string> | null;
    onSelectNode: (id: string) => void;
    onSelectEdge: (id: string) => void;
    onClearSelection: () => void;
    onDoubleClickCanvas: () => void;
    onFocusNode: (nodeId: string | null) => void;
    onContextMenu: (nodeId: string, position: { x: number; y: number }) => void;
}

/* ------------------------------------------------------------------ */
/*  Callback refs (shared between effects and event handlers)          */
/* ------------------------------------------------------------------ */

export interface CallbackRefs {
    onSelectNode: React.RefObject<(id: string) => void>;
    onSelectEdge: React.RefObject<(id: string) => void>;
    onClearSelection: React.RefObject<() => void>;
    onDoubleClickCanvas: React.RefObject<() => void>;
    onFocusNode: React.RefObject<(nodeId: string | null) => void>;
    onContextMenu: React.RefObject<(nodeId: string, position: { x: number; y: number }) => void>;
}

/* ------------------------------------------------------------------ */
/*  Node appearance helpers                                            */
/* ------------------------------------------------------------------ */

const NODE_COLORS: Record<string, string> = {
    brand: "#6496ff",
    color: "#ff5733",
    typography: "#64ff96",
    concept: "#888888",
};

const NODE_SIZES: Record<string, number> = {
    brand: 36,
    color: 26,
    typography: 26,
    concept: 22,
};

export function nodeColor(type?: string): string {
    return NODE_COLORS[type ?? "concept"] ?? NODE_COLORS.concept;
}

export function nodeSize(type?: string): number {
    return NODE_SIZES[type ?? "concept"] ?? NODE_SIZES.concept;
}

export function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
