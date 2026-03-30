import type * as d3 from "d3";

/**
 * SVG defs 생성 — 화살표 마커 + 글로우 필터
 */
export function createDefs(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
    const defs = svg.append("defs");

    // 화살표 마커 — 일반
    defs.append("marker")
        .attr("id", "arrow-normal")
        .attr("viewBox", "0 0 12 8")
        .attr("refX", 12)
        .attr("refY", 4)
        .attr("markerWidth", 10)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,0 L12,4 L0,8 L3,4 Z")
        .attr("fill", "rgba(255,255,255,0.35)");

    // 화살표 마커 — 위반
    defs.append("marker")
        .attr("id", "arrow-violated")
        .attr("viewBox", "0 0 12 8")
        .attr("refX", 12)
        .attr("refY", 4)
        .attr("markerWidth", 10)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,0 L12,4 L0,8 L3,4 Z")
        .attr("fill", "rgba(255,100,100,0.6)");

    // 글로우 필터 — 강 (선택)
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

    // 글로우 필터 — 약 (호버)
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
}
