import { describe, it, expect } from "vitest";
import { findMatchingNodeIds } from "@/lib/search-match";
import type { Node } from "@knowledgeview/kg-core";

const nodes: Node[] = [
  { id: "1", label: "Worxphere", type: "브랜드" },
  { id: "2", label: "Primary Blue (#0055FF)", type: "컬러" },
  { id: "3", label: "Sub Orange (#FF8800)", type: "컬러" },
  { id: "4", label: "Pretendard (한글)", type: "서체" },
  { id: "5", label: "로고타입 디자인", type: "로고" },
];

describe("findMatchingNodeIds", () => {
  it("라벨에 매칭되는 노드 ID를 반환한다", () => {
    const result = findMatchingNodeIds(nodes, "blue");
    expect(result).toEqual(new Set(["2"]));
  });

  it("타입에 매칭되는 노드 ID를 반환한다", () => {
    const result = findMatchingNodeIds(nodes, "컬러");
    expect(result).toEqual(new Set(["2", "3"]));
  });

  it("대소문자를 무시한다", () => {
    const result = findMatchingNodeIds(nodes, "WORXPHERE");
    expect(result).toEqual(new Set(["1"]));
  });

  it("라벨과 타입 모두에서 매칭을 찾는다", () => {
    const result = findMatchingNodeIds(nodes, "로고");
    expect(result).toEqual(new Set(["5"]));
  });

  it("매칭이 없으면 빈 Set을 반환한다", () => {
    const result = findMatchingNodeIds(nodes, "존재하지않는검색어");
    expect(result).toEqual(new Set());
  });

  it("빈 쿼리는 null을 반환한다", () => {
    const result = findMatchingNodeIds(nodes, "");
    expect(result).toBeNull();
  });

  it("공백만 있는 쿼리는 null을 반환한다", () => {
    const result = findMatchingNodeIds(nodes, "   ");
    expect(result).toBeNull();
  });
});
