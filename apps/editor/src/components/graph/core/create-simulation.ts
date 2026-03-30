import * as d3 from "d3";
import type { SimNode, SimLink } from "../canvas-types";
import { nodeSize } from "../canvas-types";

/**
 * D3 force simulation 생성 + tick 핸들러 + 드래그 동작
 */
export function createSimulation(
    nodes: SimNode[],
    links: SimLink[],
    width: number,
    height: number,
    linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    nodeGs: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>,
) {
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
            // 엣지 위치 업데이트 (원 둘레 기준)
            linkGroup
                .selectAll<SVGLineElement, SimLink>("line")
                .attr("x1", (d) => {
                    const s = d.source as SimNode;
                    const t = d.target as SimNode;
                    const dx = (t.x ?? 0) - (s.x ?? 0);
                    const dy = (t.y ?? 0) - (s.y ?? 0);
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    return (s.x ?? 0) + (dx / dist) * nodeSize(s.type);
                })
                .attr("y1", (d) => {
                    const s = d.source as SimNode;
                    const t = d.target as SimNode;
                    const dx = (t.x ?? 0) - (s.x ?? 0);
                    const dy = (t.y ?? 0) - (s.y ?? 0);
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    return (s.y ?? 0) + (dy / dist) * nodeSize(s.type);
                })
                .attr("x2", (d) => {
                    const s = d.source as SimNode;
                    const t = d.target as SimNode;
                    const dx = (s.x ?? 0) - (t.x ?? 0);
                    const dy = (s.y ?? 0) - (t.y ?? 0);
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    return (t.x ?? 0) + (dx / dist) * nodeSize(t.type);
                })
                .attr("y2", (d) => {
                    const s = d.source as SimNode;
                    const t = d.target as SimNode;
                    const dx = (s.x ?? 0) - (t.x ?? 0);
                    const dy = (s.y ?? 0) - (t.y ?? 0);
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    return (t.y ?? 0) + (dy / dist) * nodeSize(t.type);
                });

            // 엣지 라벨 위치
            linkGroup
                .selectAll<SVGGElement, SimLink>("g.link-label")
                .attr("transform", (d) => {
                    const sx = (d.source as SimNode).x ?? 0;
                    const sy = (d.source as SimNode).y ?? 0;
                    const tx = (d.target as SimNode).x ?? 0;
                    const ty = (d.target as SimNode).y ?? 0;
                    return `translate(${(sx + tx) / 2},${(sy + ty) / 2 - 8})`;
                });

            // 노드 위치
            nodeGs.attr(
                "transform",
                (d) => `translate(${d.x ?? 0},${d.y ?? 0})`,
            );
        });

    // 드래그
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

    return simulation;
}
