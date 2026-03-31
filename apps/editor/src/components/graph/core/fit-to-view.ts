import * as d3 from "d3";
import type { TypeRegistry } from "@knowledgeview/kg-core";
import type { SimNode } from "../canvas-types";
import { nodeSize } from "../canvas-types";

/**
 * 시뮬레이션 종료 후 모든 노드가 보이도록 뷰를 맞춤
 */
export function fitToView(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    zoom: d3.ZoomBehavior<SVGSVGElement, unknown>,
    nodes: SimNode[],
    width: number,
    height: number,
    schema?: TypeRegistry,
) {
    const padding = 60;
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

    nodes.forEach((n) => {
        const r = nodeSize(n.type, schema);
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

    svg.transition()
        .duration(500)
        .call(
            zoom.transform,
            d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(scale)
                .translate(-cx, -cy),
        );
}
