"use client";

import { useRef, useEffect } from "react";
import * as d3 from "d3";
import type { SimNode, SimLink, CanvasProps, CallbackRefs } from "./canvas-types";
import { createDefs } from "./rendering/create-defs";
import { renderEdges } from "./rendering/render-edges";
import { renderNodes } from "./rendering/render-nodes";
import { createSimulation } from "./core/create-simulation";
import { fitToView } from "./core/fit-to-view";
import { updateStyles } from "./styles/update-styles";

export type { CanvasProps } from "./canvas-types";

export default function Canvas({
    graph,
    hiddenTypes,
    violatedNodeIds,
    violatedTripleIds,
    selectedNodeId,
    selectedEdgeId,
    focusedNodeId,
    highlightedNodeIds,
    onSelectNode,
    onSelectEdge,
    onClearSelection,
    onDoubleClickCanvas,
    onFocusNode,
    onContextMenu,
}: CanvasProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    // Callback refs — D3 이벤트 핸들러가 항상 최신 콜백을 호출하도록
    const refs: CallbackRefs = {
        onSelectNode: useRef(onSelectNode),
        onSelectEdge: useRef(onSelectEdge),
        onClearSelection: useRef(onClearSelection),
        onDoubleClickCanvas: useRef(onDoubleClickCanvas),
        onFocusNode: useRef(onFocusNode),
        onContextMenu: useRef(onContextMenu),
    };

    refs.onSelectNode.current = onSelectNode;
    refs.onSelectEdge.current = onSelectEdge;
    refs.onClearSelection.current = onClearSelection;
    refs.onDoubleClickCanvas.current = onDoubleClickCanvas;
    refs.onFocusNode.current = onFocusNode;
    refs.onContextMenu.current = onContextMenu;

    /* ---- build simulation (only when graph data changes) ------------ */
    useEffect(() => {
        const svgEl = svgRef.current;
        if (!svgEl) return;

        const svg = d3.select(svgEl);
        const { width, height } = svgEl.getBoundingClientRect();
        svg.selectAll("*").remove();

        // SVG defs
        createDefs(svg);

        // 데이터 준비
        const nodes: SimNode[] = graph.nodes
            .filter((n) => !hiddenTypes.has(n.type ?? ""))
            .map((n) => ({ id: n.id, label: n.label, type: n.type }));

        const nodeMap = new Map(nodes.map((n) => [n.id, n]));

        const links: SimLink[] = graph.triples
            .filter((t) => nodeMap.has(t.subject) && nodeMap.has(t.object))
            .map((t) => ({
                id: t.id,
                source: nodeMap.get(t.subject)!,
                target: nodeMap.get(t.object)!,
                predicate: t.predicate,
            }));

        // 줌
        const g = svg.append("g");
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => g.attr("transform", event.transform));
        svg.call(zoom);
        zoomRef.current = zoom;

        // 배경 클릭/더블클릭
        svg.on("click", (event) => {
            if (event.target === svgEl) refs.onClearSelection.current();
        });
        svg.on("dblclick.zoom", null);
        svg.on("dblclick", (event) => {
            if (event.target === svgEl) refs.onDoubleClickCanvas.current();
        });

        // 렌더링
        const schema = graph.schema;
        const linkGroup = renderEdges(g, links, refs);
        const nodeGs = renderNodes(g, nodes, linkGroup, refs, schema);

        // 시뮬레이션
        const simulation = createSimulation(nodes, links, width, height, linkGroup, nodeGs, schema);
        simulationRef.current = simulation;

        // 뷰 맞춤
        simulation.on("end", () => fitToView(svg, zoom, nodes, width, height, schema));

        return () => { simulation.stop(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graph, hiddenTypes]);

    /* ---- update styles (selection/violation) without rebuilding ------ */
    useEffect(() => {
        const svgEl = svgRef.current;
        if (!svgEl) return;

        updateStyles({
            svg: d3.select(svgEl),
            selectedNodeId,
            selectedEdgeId,
            violatedNodeIds,
            violatedTripleIds,
            focusedNodeId,
            highlightedNodeIds,
            zoomRef,
            simulationRef,
            svgEl,
            schema: graph.schema,
        });
    }, [
        selectedNodeId,
        selectedEdgeId,
        violatedNodeIds,
        violatedTripleIds,
        focusedNodeId,
        highlightedNodeIds,
    ]);

    return (
        <svg
            ref={svgRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                background: "transparent",
            }}
        />
    );
}
