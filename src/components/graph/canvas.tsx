"use client";

import { useRef, useEffect } from "react";
import * as d3 from "d3";
import type { KnowledgeGraph } from "@/lib/kg-core/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type?: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  predicate: string;
}

export interface CanvasProps {
  graph: KnowledgeGraph;
  violatedNodeIds: Set<string>;
  violatedTripleIds: Set<string>;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onClearSelection: () => void;
  onDoubleClickCanvas: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
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

function nodeColor(type?: string): string {
  return NODE_COLORS[type ?? "concept"] ?? NODE_COLORS.concept;
}

function nodeSize(type?: string): number {
  return NODE_SIZES[type ?? "concept"] ?? NODE_SIZES.concept;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Canvas({
  graph,
  violatedNodeIds,
  violatedTripleIds,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onClearSelection,
  onDoubleClickCanvas,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  // Store latest callbacks in refs so D3 event handlers always call the current version
  const onSelectNodeRef = useRef(onSelectNode);
  const onSelectEdgeRef = useRef(onSelectEdge);
  const onClearSelectionRef = useRef(onClearSelection);
  const onDoubleClickCanvasRef = useRef(onDoubleClickCanvas);

  onSelectNodeRef.current = onSelectNode;
  onSelectEdgeRef.current = onSelectEdge;
  onClearSelectionRef.current = onClearSelection;
  onDoubleClickCanvasRef.current = onDoubleClickCanvas;

  /* ---- build simulation (only when graph data changes) ------------ */
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    const { width, height } = svgEl.getBoundingClientRect();

    // Clear previous content
    svg.selectAll("*").remove();

    /* -- defs: arrow markers ---------------------------------------- */
    const defs = svg.append("defs");

    defs
      .append("marker")
      .attr("id", "arrow-normal")
      .attr("viewBox", "0 0 10 6")
      .attr("refX", 10)
      .attr("refY", 3)
      .attr("markerWidth", 10)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L10,3 L0,6")
      .attr("fill", "rgba(255,255,255,0.2)");

    defs
      .append("marker")
      .attr("id", "arrow-violated")
      .attr("viewBox", "0 0 10 6")
      .attr("refX", 10)
      .attr("refY", 3)
      .attr("markerWidth", 10)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L10,3 L0,6")
      .attr("fill", "rgba(255,100,100,0.5)");

    /* -- data ------------------------------------------------------- */
    const nodes: SimNode[] = graph.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = graph.triples
      .filter((t) => nodeMap.has(t.subject) && nodeMap.has(t.object))
      .map((t) => ({
        id: t.id,
        source: nodeMap.get(t.subject)!,
        target: nodeMap.get(t.object)!,
        predicate: t.predicate,
      }));

    /* -- zoom ------------------------------------------------------- */
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    /* -- click background ------------------------------------------- */
    svg.on("click", (event) => {
      if (event.target === svgEl) {
        onClearSelectionRef.current();
      }
    });

    svg.on("dblclick.zoom", null);
    svg.on("dblclick", (event) => {
      if (event.target === svgEl) {
        onDoubleClickCanvasRef.current();
      }
    });

    /* -- edges ------------------------------------------------------ */
    const linkGroup = g.append("g").attr("class", "links");

    linkGroup
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links, (d) => d.id)
      .join("line")
      .attr("data-id", (d) => d.id)
      .attr("stroke", "rgba(255,255,255,0.2)")
      .attr("stroke-width", 1)
      .attr("marker-end", "url(#arrow-normal)")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onSelectEdgeRef.current(d.id);
      });

    /* -- edge labels ------------------------------------------------ */
    linkGroup
      .selectAll<SVGTextElement, SimLink>("text")
      .data(links, (d) => d.id)
      .join("text")
      .attr("data-link-id", (d) => d.id)
      .text((d) => d.predicate)
      .attr("fill", "rgba(255,255,255,0.7)")
      .attr("font-size", 12)
      .attr("text-anchor", "middle")
      .attr("dy", -4)
      .attr("pointer-events", "none");

    /* -- nodes ------------------------------------------------------ */
    const nodeGroup = g.append("g").attr("class", "nodes");

    const nodeGs = nodeGroup
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes, (d) => d.id)
      .join("g")
      .attr("data-id", (d) => d.id)
      .attr("cursor", "grab")
      .on("click", (event, d) => {
        event.stopPropagation();
        onSelectNodeRef.current(d.id);
      });

    nodeGs
      .append("circle")
      .attr("r", (d) => nodeSize(d.type))
      .attr("fill", (d) => hexToRgba(nodeColor(d.type), 0.2))
      .attr("stroke", (d) => hexToRgba(nodeColor(d.type), 0.6))
      .attr("stroke-width", 2);

    nodeGs
      .append("text")
      .text((d) => d.label)
      .attr("fill", "#ffffff")
      .attr("font-size", 12)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("pointer-events", "none");

    /* -- drag ------------------------------------------------------- */
    const drag = d3
      .drag<SVGGElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGs.call(drag);

    /* -- simulation ------------------------------------------------- */
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(160)
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<SimNode>().radius((d) => nodeSize(d.type) + 12))
      .on("tick", () => {
        linkGroup
          .selectAll<SVGLineElement, SimLink>("line")
          .attr("x1", (d) => (d.source as SimNode).x ?? 0)
          .attr("y1", (d) => (d.source as SimNode).y ?? 0)
          .attr("x2", (d) => (d.target as SimNode).x ?? 0)
          .attr("y2", (d) => (d.target as SimNode).y ?? 0);

        linkGroup
          .selectAll<SVGTextElement, SimLink>("text")
          .attr("x", (d) => {
            const sx = (d.source as SimNode).x ?? 0;
            const tx = (d.target as SimNode).x ?? 0;
            return (sx + tx) / 2;
          })
          .attr("y", (d) => {
            const sy = (d.source as SimNode).y ?? 0;
            const ty = (d.target as SimNode).y ?? 0;
            return (sy + ty) / 2;
          });

        nodeGs.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    simulationRef.current = simulation;

    // Fit to view when simulation settles
    simulation.on("end", () => {
      const padding = 60;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach((n) => {
        const r = nodeSize(n.type);
        if ((n.x ?? 0) - r < minX) minX = (n.x ?? 0) - r;
        if ((n.y ?? 0) - r < minY) minY = (n.y ?? 0) - r;
        if ((n.x ?? 0) + r > maxX) maxX = (n.x ?? 0) + r;
        if ((n.y ?? 0) + r > maxY) maxY = (n.y ?? 0) + r;
      });

      if (!isFinite(minX)) return;

      const graphWidth = maxX - minX + padding * 2;
      const graphHeight = maxY - minY + padding * 2;
      const scale = Math.min(width / graphWidth, height / graphHeight, 1.5);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(scale)
          .translate(-cx, -cy)
      );
    });

    return () => {
      simulation.stop();
    };
  // Only rebuild simulation when graph structure changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  /* ---- update styles (selection/violation) without rebuilding ------ */
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);

    // Update node styles
    svg.selectAll<SVGGElement, SimNode>("g.nodes g").each(function (d) {
      const circle = d3.select(this).select("circle");
      if (selectedNodeId === d.id) {
        circle.attr("stroke", "#ffffff").attr("stroke-width", 3).attr("stroke-dasharray", "none");
      } else if (violatedNodeIds.has(d.id)) {
        circle.attr("stroke", "#ff6464").attr("stroke-width", 2).attr("stroke-dasharray", "6 3");
      } else {
        circle.attr("stroke", hexToRgba(nodeColor(d.type), 0.6)).attr("stroke-width", 2).attr("stroke-dasharray", "none");
      }
    });

    // Update edge styles
    svg.selectAll<SVGLineElement, SimLink>("g.links line").each(function (d) {
      const line = d3.select(this);
      const isViolated = violatedTripleIds.has(d.id);
      const isSelected = selectedEdgeId === d.id;

      line
        .attr("stroke", isViolated ? "rgba(255,100,100,0.5)" : "rgba(255,255,255,0.2)")
        .attr("stroke-width", isSelected ? 3 : 1)
        .attr("stroke-dasharray", isViolated ? "6 3" : "none")
        .attr("marker-end", isViolated ? "url(#arrow-violated)" : "url(#arrow-normal)");
    });
  }, [selectedNodeId, selectedEdgeId, violatedNodeIds, violatedTripleIds]);

  /* ---- JSX -------------------------------------------------------- */
  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "100%", display: "block", background: "transparent" }}
    />
  );
}
