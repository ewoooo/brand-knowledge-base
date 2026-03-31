import * as d3 from "d3";
import type { TypeRegistry } from "@knowledgeview/kg-core";
import type { SimNode, SimLink, CallbackRefs } from "../canvas-types";
import { nodeColor, nodeSize, hexToRgba } from "../canvas-types";

/**
 * 노드 그룹 렌더링 + 이벤트 바인딩 (클릭, 더블클릭, 컨텍스트메뉴, 호버)
 */
export function renderNodes(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    nodes: SimNode[],
    linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    refs: Pick<CallbackRefs, "onSelectNode" | "onFocusNode" | "onContextMenu">,
    schema?: TypeRegistry,
) {
    const nodeGroup = g.append("g").attr("class", "nodes");

    const nodeGs = nodeGroup
        .selectAll<SVGGElement, SimNode>("g")
        .data(nodes, (d) => d.id)
        .join("g")
        .attr("data-id", (d) => d.id)
        .attr("cursor", "grab")
        .on("click", (event, d) => {
            event.stopPropagation();
            refs.onSelectNode.current(d.id);
        })
        .on("contextmenu", (event: MouseEvent, d: SimNode) => {
            event.preventDefault();
            event.stopPropagation();
            refs.onContextMenu.current(d.id, {
                x: event.clientX,
                y: event.clientY,
            });
        })
        .on("dblclick", (event: MouseEvent, d: SimNode) => {
            event.preventDefault();
            event.stopPropagation();
            refs.onFocusNode.current(d.id);
        })
        .on("mouseover", function (_event, d) {
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
                        if (line.attr("filter") !== "url(#glow)") {
                            line.attr("stroke", "rgba(255,255,255,0.4)")
                                .attr("filter", "url(#glow-weak)");
                        }
                    }
                });
        })
        .on("mouseout", function (_event, d) {
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
                        if (line.attr("filter") === "url(#glow-weak)") {
                            line.attr("stroke", "rgba(255,255,255,0.2)")
                                .attr("filter", "none");
                        }
                    }
                });
        });

    // 원형
    nodeGs
        .append("circle")
        .attr("r", (d) => nodeSize(d.type, schema))
        .attr("fill", (d) => hexToRgba(nodeColor(d.type, schema), 0.2))
        .attr("stroke", (d) => hexToRgba(nodeColor(d.type, schema), 0.6))
        .attr("stroke-width", 2);

    // 타입 약어 (원 내부)
    nodeGs
        .append("text")
        .attr("class", "node-icon")
        .text((d) => {
            if (d.type === "brand") return "B";
            if (d.type === "color") return "●";
            if (d.type === "typography") return "Aa";
            return "◇";
        })
        .attr("fill", "rgba(255,255,255,0.7)")
        .attr("font-size", (d) => (d.type === "brand" ? 14 : 12))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central");

    // 라벨 (원 아래)
    nodeGs
        .append("text")
        .attr("class", "node-label")
        .text((d) => d.label)
        .attr("fill", "rgba(255,255,255,0.9)")
        .attr("text-anchor", "middle")
        .attr("dy", (d) => nodeSize(d.type, schema) + 14)
        .attr("pointer-events", "none");

    return nodeGs;
}
