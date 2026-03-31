import { describe, it, expect } from "vitest";
import { fuzzyMatch, commandFilter, findMatchingNodeIds } from "@/lib/search-match";
import type { Node } from "@knowledgeview/kg-core";

const nodes: Node[] = [
  { id: "1", label: "Worxphere", type: "브랜드" },
  { id: "2", label: "Primary Blue (#0055FF)", type: "컬러" },
  { id: "3", label: "Sub Orange (#FF8800)", type: "컬러" },
  { id: "4", label: "Pretendard (한글)", type: "서체" },
  { id: "5", label: "로고타입 디자인", type: "로고" },
];

describe("fuzzyMatch", () => {
  it("대소문자 무시 부분 문자열 매칭", () => {
    expect(fuzzyMatch("Primary Blue", "blue")).toBe(true);
    expect(fuzzyMatch("Primary Blue", "BLUE")).toBe(true);
  });

  it("한글 초성 매칭", () => {
    expect(fuzzyMatch("컬러", "ㅋㄹ")).toBe(true);
    expect(fuzzyMatch("브랜드", "ㅂㄹㄷ")).toBe(true);
  });

  it("초성이 일치하지 않으면 false", () => {
    expect(fuzzyMatch("컬러", "ㅎㄱ")).toBe(false);
  });

  it("빈 쿼리는 true 반환", () => {
    expect(fuzzyMatch("anything", "")).toBe(true);
  });

  it("매칭 없으면 false", () => {
    expect(fuzzyMatch("컬러", "서체")).toBe(false);
  });
});

describe("commandFilter", () => {
  it("매칭 시 1, 미매칭 시 0 반환", () => {
    expect(commandFilter("컬러 팔레트", "ㅋㄹ")).toBe(1);
    expect(commandFilter("컬러 팔레트", "서체")).toBe(0);
  });
});

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
