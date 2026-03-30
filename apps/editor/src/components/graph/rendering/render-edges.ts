import * as d3 from "d3";
import type { SimNode, SimLink, CallbackRefs } from "../canvas-types";

/**
 * 엣지(선) + 엣지 라벨 렌더링
 */
export function renderEdges(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    links: SimLink[],
    refs: Pick<CallbackRefs, "onSelectEdge">,
) {
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
            refs.onSelectEdge.current(d.id);
        });

    // 엣지 라벨
    const linkLabelGs = linkGroup
        .selectAll<SVGGElement, SimLink>("g.link-label")
        .data(links, (d) => d.id)
        .join("g")
        .attr("class", "link-label")
        .attr("data-link-id", (d) => d.id)
        .attr("pointer-events", "none");

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

    // 배경 rect를 텍스트에 맞춤
    linkLabelTexts.each(function () {
        const bbox = this.getBBox();
        const rect = d3.select(this.parentNode as Element).select("rect");
        rect.attr("x", bbox.x - 4)
            .attr("y", bbox.y - 2)
            .attr("width", bbox.width + 8)
            .attr("height", bbox.height + 4);
    });

    return linkGroup;
}
