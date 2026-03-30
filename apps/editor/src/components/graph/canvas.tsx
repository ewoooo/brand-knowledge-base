"use client";

import { useRef, useEffect } from "react";
import * as d3 from "d3";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";

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
    hiddenTypes: Set<string>;
    violatedNodeIds: Set<string>;
    violatedTripleIds: Set<string>;
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    focusedNodeId: string | null;
    onSelectNode: (id: string) => void;
    onSelectEdge: (id: string) => void;
    onClearSelection: () => void;
    onDoubleClickCanvas: () => void;
    onFocusNode: (nodeId: string | null) => void;
    onContextMenu: (nodeId: string, position: { x: number; y: number }) => void;
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
    hiddenTypes,
    violatedNodeIds,
    violatedTripleIds,
    selectedNodeId,
    selectedEdgeId,
    focusedNodeId,
    onSelectNode,
    onSelectEdge,
    onClearSelection,
    onDoubleClickCanvas,
    onFocusNode,
    onContextMenu,
}: CanvasProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
    // Store latest callbacks in refs so D3 event handlers always call the current version
    const onSelectNodeRef = useRef(onSelectNode);
    const onSelectEdgeRef = useRef(onSelectEdge);
    const onClearSelectionRef = useRef(onClearSelection);
    const onDoubleClickCanvasRef = useRef(onDoubleClickCanvas);
    const onFocusNodeRef = useRef(onFocusNode);
    const onContextMenuRef = useRef(onContextMenu);

    onSelectNodeRef.current = onSelectNode;
    onSelectEdgeRef.current = onSelectEdge;
    onClearSelectionRef.current = onClearSelection;
    onDoubleClickCanvasRef.current = onDoubleClickCanvas;
    onFocusNodeRef.current = onFocusNode;
    onContextMenuRef.current = onContextMenu;

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

        // ─── 화살표 마커 설정 ─────────────────────────────────
        //
        // viewBox: 마커 내부 좌표계. "0 0 12 8" → 가로 12, 세로 8
        //
        // refX, refY: 마커의 어느 지점이 선 끝점(line endpoint)에 붙는가
        //   - 선 끝점은 tick 핸들러에서 원 둘레로 계산됨 (아래 참고)
        //   - refX=12 → 화살표 TIP이 선 끝점에 위치 (원 둘레에 tip이 닿음)
        //   - refX=6  → 화살표 중간이 선 끝점에 위치
        //   - refX=0  → 화살표 꼬리가 선 끝점에 위치 (tip이 원 안으로 들어감) ← 현재 문제
        //
        // markerWidth, markerHeight: 화면에 그려지는 마커의 실제 크기 (px)
        //
        // orient="auto": 선 방향에 맞춰 자동 회전
        //
        // path "M0,0 L12,4 L0,8 L3,4 Z":
        //   (0,0)───→(12,4)  ← tip (뾰족한 끝)
        //     ↑         ↓
        //   (0,8)←──(3,4)   ← 안쪽 움푹
        //
        // 현재 refX=1 → tip(12,4)이 선 끝점에서 11만큼 앞으로 나감 → 원 안으로 침투
        // 수정: refX=12 → tip이 정확히 선 끝점(원 둘레)에 위치
        //
        defs.append("marker")
            .attr("id", "arrow-normal")
            .attr("viewBox", "0 0 12 8") // 마커 내부 좌표 공간
            .attr("refX", 12) // ← tip(12,4)이 선 끝점(원 둘레)에 붙음
            .attr("refY", 4) // 세로 중앙 (8/2 = 4)
            .attr("markerWidth", 10) // 화면 렌더링 가로 크기
            .attr("markerHeight", 8) // 화면 렌더링 세로 크기
            .attr("orient", "auto") // 선 방향에 맞춰 회전
            .append("path")
            .attr("d", "M0,0 L12,4 L0,8 L3,4 Z") // 화살표 모양
            .attr("fill", "rgba(255,255,255,0.35)");

        defs.append("marker")
            .attr("id", "arrow-violated")
            .attr("viewBox", "0 0 12 8")
            .attr("refX", 12) // ← 동일하게 tip이 선 끝점에
            .attr("refY", 4)
            .attr("markerWidth", 10)
            .attr("markerHeight", 8)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,0 L12,4 L0,8 L3,4 Z")
            .attr("fill", "rgba(255,100,100,0.6)");

        // Glow filter — strong (click/select)
        defs.append("filter")
            .attr("id", "glow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%")
            .append("feGaussianBlur")
            .attr("stdDeviation", "4")
            .attr("result", "blur");

        defs.select("#glow")
            .append("feMerge")
            .call((merge) => {
                merge.append("feMergeNode").attr("in", "blur");
                merge.append("feMergeNode").attr("in", "SourceGraphic");
            });

        // Glow filter — weak (hover)
        defs.append("filter")
            .attr("id", "glow-weak")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%")
            .append("feGaussianBlur")
            .attr("stdDeviation", "2")
            .attr("result", "blur");

        defs.select("#glow-weak")
            .append("feMerge")
            .call((merge) => {
                merge.append("feMergeNode").attr("in", "blur");
                merge.append("feMergeNode").attr("in", "SourceGraphic");
            });

        /* -- data ------------------------------------------------------- */
        const nodes: SimNode[] = graph.nodes
            .filter((n) => !hiddenTypes.has(n.type ?? ""))
            .map((n) => ({
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
            .style("transition", "stroke 0.25s ease, filter 0.25s ease")
            .on("click", (event, d) => {
                event.stopPropagation();
                onSelectEdgeRef.current(d.id);
            });

        /* -- edge labels ------------------------------------------------ */
        const linkLabelGs = linkGroup
            .selectAll<SVGGElement, SimLink>("g.link-label")
            .data(links, (d) => d.id)
            .join("g")
            .attr("class", "link-label")
            .attr("data-link-id", (d) => d.id)
            .attr("pointer-events", "none");

        // Background rect (sized after text is rendered)
        linkLabelGs
            .append("rect")
            .attr("fill", "rgba(0,0,0,0.6)")
            .attr("rx", 3)
            .attr("ry", 3);

        const linkLabelTexts = linkLabelGs
            .append("text")
            .text((d) => d.predicate)
            .attr("fill", "rgba(255,255,255,0.85)")
            .attr("font-size", 11)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central");

        // Size background rects to fit text
        linkLabelTexts.each(function () {
            const bbox = this.getBBox();
            const rect = d3.select(this.parentNode as Element).select("rect");
            rect.attr("x", bbox.x - 4)
                .attr("y", bbox.y - 2)
                .attr("width", bbox.width + 8)
                .attr("height", bbox.height + 4);
        });

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
            })
            .on("contextmenu", (event: MouseEvent, d: SimNode) => {
                event.preventDefault();
                event.stopPropagation();
                onContextMenuRef.current(d.id, {
                    x: event.clientX,
                    y: event.clientY,
                });
            })
            .on("dblclick", (event: MouseEvent, d: SimNode) => {
                event.preventDefault();
                event.stopPropagation();
                onFocusNodeRef.current(d.id);
            })
            .on("mouseover", function (_event, d) {
                // Hover glow on connected edges (weak)
                linkGroup
                    .selectAll<SVGLineElement, SimLink>("line")
                    .each(function (ld) {
                        const srcId =
                            typeof ld.source === "object"
                                ? (ld.source as SimNode).id
                                : ld.source;
                        const tgtId =
                            typeof ld.target === "object"
                                ? (ld.target as SimNode).id
                                : ld.target;
                        if (srcId === d.id || tgtId === d.id) {
                            const line = d3.select(this);
                            // Don't override strong glow from selection
                            if (line.attr("filter") !== "url(#glow)") {
                                line.attr(
                                    "stroke",
                                    "rgba(255,255,255,0.4)",
                                ).attr("filter", "url(#glow-weak)");
                            }
                        }
                    });
            })
            .on("mouseout", function (_event, d) {
                // Reset hover glow — let the style useEffect handle correct state on next render
                linkGroup
                    .selectAll<SVGLineElement, SimLink>("line")
                    .each(function (ld) {
                        const srcId =
                            typeof ld.source === "object"
                                ? (ld.source as SimNode).id
                                : ld.source;
                        const tgtId =
                            typeof ld.target === "object"
                                ? (ld.target as SimNode).id
                                : ld.target;
                        if (srcId === d.id || tgtId === d.id) {
                            const line = d3.select(this);
                            // Only reset if it's the weak glow (not strong selection glow)
                            if (line.attr("filter") === "url(#glow-weak)") {
                                line.attr(
                                    "stroke",
                                    "rgba(255,255,255,0.2)",
                                ).attr("filter", "none");
                            }
                        }
                    });
            });

        nodeGs
            .append("circle")
            .attr("r", (d) => nodeSize(d.type))
            .attr("fill", (d) => hexToRgba(nodeColor(d.type), 0.2))
            .attr("stroke", (d) => hexToRgba(nodeColor(d.type), 0.6))
            .attr("stroke-width", 2);

        // Short label inside circle (type abbreviation or first 2 chars)
        nodeGs
            .append("text")
            .text((d) => {
                if (d.type === "brand") return "B";
                if (d.type === "color") return "●";
                if (d.type === "typography") return "Aa";
                return "◇";
            })
            .attr("fill", "rgba(255,255,255,0.7)")
            .attr("font-size", (d) => (d.type === "brand" ? 14 : 12))
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("pointer-events", "none");

        // Full label below circle
        nodeGs
            .append("text")
            .text((d) => d.label)
            .attr("fill", "rgba(255,255,255,0.9)")
            .attr("font-size", 11)
            .attr("text-anchor", "middle")
            .attr("dy", (d) => nodeSize(d.type) + 14)
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
                    .distance(160),
            )
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force(
                "collide",
                d3.forceCollide<SimNode>().radius((d) => nodeSize(d.type) + 20),
            )
            .on("tick", () => {
                linkGroup
                    .selectAll<SVGLineElement, SimLink>("line")
                    .attr("x1", (d) => {
                        const s = d.source as SimNode;
                        const t = d.target as SimNode;
                        const dx = (t.x ?? 0) - (s.x ?? 0);
                        const dy = (t.y ?? 0) - (s.y ?? 0);
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const r = nodeSize(s.type);
                        return (s.x ?? 0) + (dx / dist) * r;
                    })
                    .attr("y1", (d) => {
                        const s = d.source as SimNode;
                        const t = d.target as SimNode;
                        const dx = (t.x ?? 0) - (s.x ?? 0);
                        const dy = (t.y ?? 0) - (s.y ?? 0);
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const r = nodeSize(s.type);
                        return (s.y ?? 0) + (dy / dist) * r;
                    })
                    .attr("x2", (d) => {
                        const s = d.source as SimNode;
                        const t = d.target as SimNode;
                        const dx = (s.x ?? 0) - (t.x ?? 0);
                        const dy = (s.y ?? 0) - (t.y ?? 0);
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const r = nodeSize(t.type);
                        return (t.x ?? 0) + (dx / dist) * r;
                    })
                    .attr("y2", (d) => {
                        const s = d.source as SimNode;
                        const t = d.target as SimNode;
                        const dx = (s.x ?? 0) - (t.x ?? 0);
                        const dy = (s.y ?? 0) - (t.y ?? 0);
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const r = nodeSize(t.type);
                        return (t.y ?? 0) + (dy / dist) * r;
                    });

                linkGroup
                    .selectAll<SVGGElement, SimLink>("g.link-label")
                    .attr("transform", (d) => {
                        const sx = (d.source as SimNode).x ?? 0;
                        const sy = (d.source as SimNode).y ?? 0;
                        const tx = (d.target as SimNode).x ?? 0;
                        const ty = (d.target as SimNode).y ?? 0;
                        return `translate(${(sx + tx) / 2},${(sy + ty) / 2 - 8})`;
                    });

                nodeGs.attr(
                    "transform",
                    (d) => `translate(${d.x ?? 0},${d.y ?? 0})`,
                );
            });

        simulationRef.current = simulation;

        // Fit to view when simulation settles
        simulation.on("end", () => {
            const padding = 60;
            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;
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
            const scale = Math.min(
                width / graphWidth,
                height / graphHeight,
                1.5,
            );
            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;

            svg.transition()
                .duration(500)
                .call(
                    zoom.transform,
                    d3.zoomIdentity
                        .translate(width / 2, height / 2)
                        .scale(scale)
                        .translate(-cx, -cy),
                );
        });

        return () => {
            simulation.stop();
        };
        // Only rebuild simulation when graph structure or filters change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graph, hiddenTypes]);

    /* ---- update styles (selection/violation) without rebuilding ------ */
    useEffect(() => {
        const svgEl = svgRef.current;
        if (!svgEl) return;

        const svg = d3.select(svgEl);

        // Find edges connected to selected node
        const selectedNodeEdgeIds = new Set<string>();
        if (selectedNodeId) {
            svg.selectAll<SVGLineElement, SimLink>("g.links line").each(
                function (d) {
                    const sourceId =
                        typeof d.source === "object"
                            ? (d.source as SimNode).id
                            : d.source;
                    const targetId =
                        typeof d.target === "object"
                            ? (d.target as SimNode).id
                            : d.target;
                    if (
                        sourceId === selectedNodeId ||
                        targetId === selectedNodeId
                    ) {
                        selectedNodeEdgeIds.add(d.id);
                    }
                },
            );
        }

        // Update node styles
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

        // Update edge styles — glow on edges connected to selected node
        svg.selectAll<SVGLineElement, SimLink>("g.links line").each(
            function (d) {
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
            },
        );

        // Focus mode
        if (focusedNodeId) {
            // Find neighbor node IDs
            const neighborIds = new Set<string>();
            neighborIds.add(focusedNodeId);
            svg.selectAll<SVGLineElement, SimLink>("g.links line").each(
                function (d) {
                    const sourceId =
                        typeof d.source === "object"
                            ? (d.source as SimNode).id
                            : d.source;
                    const targetId =
                        typeof d.target === "object"
                            ? (d.target as SimNode).id
                            : d.target;
                    if (sourceId === focusedNodeId)
                        neighborIds.add(targetId as string);
                    if (targetId === focusedNodeId)
                        neighborIds.add(sourceId as string);
                },
            );

            // Dim non-neighbor nodes
            svg.selectAll<SVGGElement, SimNode>("g.nodes g").each(function (d) {
                d3.select(this).attr(
                    "opacity",
                    neighborIds.has(d.id) ? 1 : 0.15,
                );
            });

            // Dim non-connected edges
            svg.selectAll<SVGLineElement, SimLink>("g.links line").each(
                function (d) {
                    const sourceId =
                        typeof d.source === "object"
                            ? (d.source as SimNode).id
                            : d.source;
                    const targetId =
                        typeof d.target === "object"
                            ? (d.target as SimNode).id
                            : d.target;
                    const connected =
                        sourceId === focusedNodeId ||
                        targetId === focusedNodeId;
                    d3.select(this).attr("opacity", connected ? 1 : 0.05);
                },
            );

            // Dim non-connected edge labels
            svg.selectAll<SVGGElement, SimLink>("g.link-label").each(
                function (d) {
                    const sourceId =
                        typeof d.source === "object"
                            ? (d.source as SimNode).id
                            : d.source;
                    const targetId =
                        typeof d.target === "object"
                            ? (d.target as SimNode).id
                            : d.target;
                    const connected =
                        sourceId === focusedNodeId ||
                        targetId === focusedNodeId;
                    d3.select(this).attr("opacity", connected ? 1 : 0.05);
                },
            );
        } else {
            // Reset all opacities
            svg.selectAll<SVGGElement, SimNode>("g.nodes g").attr("opacity", 1);
            svg.selectAll<SVGLineElement, SimLink>("g.links line").attr(
                "opacity",
                1,
            );
            svg.selectAll<SVGGElement, SimLink>("g.link-label").attr(
                "opacity",
                1,
            );
        }
    }, [
        selectedNodeId,
        selectedEdgeId,
        violatedNodeIds,
        violatedTripleIds,
        focusedNodeId,
    ]);

    /* ---- JSX -------------------------------------------------------- */
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
