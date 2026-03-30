import type { RefObject } from "react";
import * as d3 from "d3";
import type { SimNode, SimLink } from "../canvas-types";
import { nodeColor, hexToRgba } from "../canvas-types";

interface UpdateStylesParams {
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    violatedNodeIds: Set<string>;
    violatedTripleIds: Set<string>;
    focusedNodeId: string | null;
    highlightedNodeIds: Set<string> | null;
    zoomRef: RefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>;
    simulationRef: RefObject<d3.Simulation<SimNode, SimLink> | null>;
    svgEl: SVGSVGElement;
}

/**
 * 선택/위반/포커스/검색 상태에 따른 시각적 스타일 업데이트
 * (DOM 구조는 변경하지 않고 속성만 업데이트)
 */
export function updateStyles({
    svg,
    selectedNodeId,
    selectedEdgeId,
    violatedNodeIds,
    violatedTripleIds,
    focusedNodeId,
    highlightedNodeIds,
    zoomRef,
    simulationRef,
    svgEl,
}: UpdateStylesParams) {
    // 선택된 노드에 연결된 엣지 수집
    const selectedNodeEdgeIds = new Set<string>();
    if (selectedNodeId) {
        svg.selectAll<SVGLineElement, SimLink>("g.links line").each(function (d) {
            const sourceId =
                typeof d.source === "object" ? (d.source as SimNode).id : d.source;
            const targetId =
                typeof d.target === "object" ? (d.target as SimNode).id : d.target;
            if (sourceId === selectedNodeId || targetId === selectedNodeId) {
                selectedNodeEdgeIds.add(d.id);
            }
        });
    }

    // 노드 스타일
    svg.selectAll<SVGGElement, SimNode>("g.nodes g").each(function (d) {
        const circle = d3.select(this).select("circle");
        if (selectedNodeId === d.id) {
            circle
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 3)
                .attr("stroke-dasharray", "none")
                .attr("filter", "none");
        } else if (violatedNodeIds.has(d.id)) {
            circle
                .attr("stroke", "#ff6464")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "6 3")
                .attr("filter", "none");
        } else {
            circle
                .attr("stroke", hexToRgba(nodeColor(d.type), 0.6))
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "none")
                .attr("filter", "none");
        }
    });

    // 엣지 스타일
    svg.selectAll<SVGLineElement, SimLink>("g.links line").each(function (d) {
        const line = d3.select(this);
        const isViolated = violatedTripleIds.has(d.id);
        const isSelected = selectedEdgeId === d.id;
        const isConnectedToSelected = selectedNodeEdgeIds.has(d.id);

        if (isViolated) {
            line.attr("stroke", "rgba(255,100,100,0.5)")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "6 3")
                .attr("marker-end", "url(#arrow-violated)")
                .attr("filter", "none");
        } else if (isConnectedToSelected || isSelected) {
            line.attr("stroke", "rgba(255,255,255,0.6)")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "none")
                .attr("marker-end", "url(#arrow-normal)")
                .attr("filter", "url(#glow)");
        } else {
            line.attr("stroke", "rgba(255,255,255,0.2)")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "none")
                .attr("marker-end", "url(#arrow-normal)")
                .attr("filter", "none");
        }
    });

    // 검색 하이라이트 (최고 우선순위)
    if (highlightedNodeIds) {
        applySearchHighlight(svg, highlightedNodeIds);
    } else if (focusedNodeId) {
        applyFocusMode(svg, focusedNodeId, zoomRef, simulationRef, svgEl);
    } else {
        resetOpacity(svg);
    }
}

function applySearchHighlight(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    highlightedNodeIds: Set<string>,
) {
    svg.selectAll<SVGGElement, SimNode>("g.nodes g").each(function (d) {
        d3.select(this)
            .transition()
            .duration(300)
            .attr("opacity", highlightedNodeIds.has(d.id) ? 1 : 0.15);
    });

    svg.selectAll<SVGLineElement, SimLink>("g.links line").each(function (d) {
        const sourceId =
            typeof d.source === "object" ? (d.source as SimNode).id : d.source;
        const targetId =
            typeof d.target === "object" ? (d.target as SimNode).id : d.target;
        const connected =
            highlightedNodeIds.has(sourceId as string) &&
            highlightedNodeIds.has(targetId as string);
        d3.select(this).transition().duration(300).attr("opacity", connected ? 1 : 0.05);
    });

    svg.selectAll<SVGGElement, SimLink>("g.link-label").each(function (d) {
        const sourceId =
            typeof d.source === "object" ? (d.source as SimNode).id : d.source;
        const targetId =
            typeof d.target === "object" ? (d.target as SimNode).id : d.target;
        const connected =
            highlightedNodeIds.has(sourceId as string) &&
            highlightedNodeIds.has(targetId as string);
        d3.select(this).transition().duration(300).attr("opacity", connected ? 1 : 0.05);
    });
}

function applyFocusMode(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    focusedNodeId: string,
    zoomRef: RefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>,
    simulationRef: RefObject<d3.Simulation<SimNode, SimLink> | null>,
    svgEl: SVGSVGElement,
) {
    // 포커스 노드로 줌
    const zoom = zoomRef.current;
    if (zoom) {
        const focusedNode = simulationRef.current
            ?.nodes()
            .find((n) => n.id === focusedNodeId);
        if (focusedNode && focusedNode.x != null && focusedNode.y != null) {
            const width = svgEl.clientWidth;
            const height = svgEl.clientHeight;
            const scale = 1.2;
            svg.transition()
                .duration(600)
                .call(
                    zoom.transform,
                    d3.zoomIdentity
                        .translate(width / 2, height / 2)
                        .scale(scale)
                        .translate(-focusedNode.x, -focusedNode.y),
                );
        }
    }

    // 이웃 노드 수집
    const neighborIds = new Set<string>();
    neighborIds.add(focusedNodeId);
    svg.selectAll<SVGLineElement, SimLink>("g.links line").each(function (d) {
        const sourceId =
            typeof d.source === "object" ? (d.source as SimNode).id : d.source;
        const targetId =
            typeof d.target === "object" ? (d.target as SimNode).id : d.target;
        if (sourceId === focusedNodeId) neighborIds.add(targetId as string);
        if (targetId === focusedNodeId) neighborIds.add(sourceId as string);
    });

    // 비이웃 dim
    svg.selectAll<SVGGElement, SimNode>("g.nodes g").each(function (d) {
        d3.select(this).attr("opacity", neighborIds.has(d.id) ? 1 : 0.15);
    });

    svg.selectAll<SVGLineElement, SimLink>("g.links line").each(function (d) {
        const sourceId =
            typeof d.source === "object" ? (d.source as SimNode).id : d.source;
        const targetId =
            typeof d.target === "object" ? (d.target as SimNode).id : d.target;
        const connected = sourceId === focusedNodeId || targetId === focusedNodeId;
        d3.select(this).attr("opacity", connected ? 1 : 0.05);
    });

    svg.selectAll<SVGGElement, SimLink>("g.link-label").each(function (d) {
        const sourceId =
            typeof d.source === "object" ? (d.source as SimNode).id : d.source;
        const targetId =
            typeof d.target === "object" ? (d.target as SimNode).id : d.target;
        const connected = sourceId === focusedNodeId || targetId === focusedNodeId;
        d3.select(this).attr("opacity", connected ? 1 : 0.05);
    });
}

function resetOpacity(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
) {
    svg.selectAll<SVGGElement, SimNode>("g.nodes g")
        .transition().duration(300).attr("opacity", 1);
    svg.selectAll<SVGLineElement, SimLink>("g.links line")
        .transition().duration(300).attr("opacity", 1);
    svg.selectAll<SVGGElement, SimLink>("g.link-label")
        .transition().duration(300).attr("opacity", 1);
}
