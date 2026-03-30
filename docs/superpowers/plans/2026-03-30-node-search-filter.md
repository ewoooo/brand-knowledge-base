# 노드 검색 필터 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 캔버스에서 Cmd+K로 노드를 실시간 텍스트 검색하여 매칭 노드를 하이라이트하는 기능 추가

**Architecture:** page.tsx가 검색 상태를 소유하고 useMemo로 매칭 노드 ID Set을 파생한다. Canvas의 기존 focusMode 스타일 useEffect를 확장하여 highlightedNodeIds prop으로 dim 처리한다. SearchOverlay는 캔버스 위에 오버레이되는 독립 컴포넌트다.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS 4, Vitest, D3 v7

**Spec:** `docs/superpowers/specs/2026-03-30-node-search-filter-design.md`

---

## File Structure

| 파일 | 역할 | 변경 유형 |
|------|------|-----------|
| `apps/editor/src/components/graph/search-overlay.tsx` | 검색 오버레이 UI 컴포넌트 | 신규 생성 |
| `apps/editor/src/components/graph/canvas.tsx` | D3 그래프 시각화 — highlightedNodeIds 하이라이트 | 수정 |
| `apps/editor/src/app/page.tsx` | 검색 상태 관리, 매칭 로직, 키보드 리스너 | 수정 |
| `apps/editor/src/__tests__/search-match.test.ts` | 매칭 로직 단위 테스트 | 신규 생성 |

---

### Task 1: 매칭 로직 함수 추출 및 테스트

매칭 로직을 순수 함수로 추출하여 테스트한다. page.tsx의 useMemo에서 이 함수를 호출한다.

**Files:**
- Create: `apps/editor/src/__tests__/search-match.test.ts`
- Create: `apps/editor/src/lib/search-match.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// apps/editor/src/__tests__/search-match.test.ts
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm --filter @knowledgeview/editor exec vitest run src/__tests__/search-match.test.ts`
Expected: FAIL — `Cannot find module '@/lib/search-match'`

- [ ] **Step 3: 매칭 함수 구현**

```typescript
// apps/editor/src/lib/search-match.ts
import type { Node } from "@knowledgeview/kg-core";

/**
 * 노드 라벨과 타입에 대해 대소문자 무시 포함 매칭을 수행한다.
 * 빈 쿼리는 null 반환 (검색 비활성 상태).
 * 매칭 없으면 빈 Set 반환 (전체 dim 시각 피드백).
 */
export function findMatchingNodeIds(
  nodes: Node[],
  query: string,
): Set<string> | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const ids = new Set<string>();
  for (const node of nodes) {
    if (
      node.label.toLowerCase().includes(q) ||
      (node.type && node.type.toLowerCase().includes(q))
    ) {
      ids.add(node.id);
    }
  }
  return ids;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @knowledgeview/editor exec vitest run src/__tests__/search-match.test.ts`
Expected: 7 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/editor/src/lib/search-match.ts apps/editor/src/__tests__/search-match.test.ts
git commit -m "feat: 노드 검색 매칭 로직 추가"
```

---

### Task 2: SearchOverlay 컴포넌트 생성

캔버스 위에 오버레이되는 검색 UI 컴포넌트를 만든다.

**Files:**
- Create: `apps/editor/src/components/graph/search-overlay.tsx`

- [ ] **Step 1: SearchOverlay 컴포넌트 작성**

```tsx
// apps/editor/src/components/graph/search-overlay.tsx
"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface SearchOverlayProps {
  open: boolean;
  query: string;
  matchedCount: number;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}

export function SearchOverlay({
  open,
  query,
  matchedCount,
  onQueryChange,
  onClose,
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // 약간의 지연 후 포커스 (DOM 렌더 이후)
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="absolute top-4 left-1/2 z-20 w-[320px] -translate-x-1/2">
      <div className="bg-background/90 rounded-lg border p-3 shadow-2xl backdrop-blur-sm">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
          placeholder="노드 검색..."
          className="h-9 text-sm"
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {query.trim()
              ? `${matchedCount}개 매칭`
              : "라벨 또는 타입으로 검색"}
          </span>
          <span className="text-muted-foreground">
            ⌘K 열기 · Esc 닫기
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `pnpm --filter @knowledgeview/editor build`
Expected: 빌드 성공 (아직 어디서도 import하지 않지만 문법 오류가 없는지 확인)

- [ ] **Step 3: 커밋**

```bash
git add apps/editor/src/components/graph/search-overlay.tsx
git commit -m "feat: SearchOverlay 컴포넌트 생성"
```

---

### Task 3: Canvas에 highlightedNodeIds prop 추가

Canvas 스타일 useEffect를 확장하여 검색 하이라이트 모드를 지원한다.

**Files:**
- Modify: `apps/editor/src/components/graph/canvas.tsx`

- [ ] **Step 1: CanvasProps에 highlightedNodeIds 추가**

`apps/editor/src/components/graph/canvas.tsx`의 `CanvasProps` 인터페이스(22행~36행)를 수정한다:

```typescript
export interface CanvasProps {
    graph: KnowledgeGraph;
    hiddenTypes: Set<string>;
    violatedNodeIds: Set<string>;
    violatedTripleIds: Set<string>;
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    focusedNodeId: string | null;
    highlightedNodeIds: Set<string> | null;  // 추가
    onSelectNode: (id: string) => void;
    onSelectEdge: (id: string) => void;
    onClearSelection: () => void;
    onDoubleClickCanvas: () => void;
    onFocusNode: (nodeId: string | null) => void;
    onContextMenu: (nodeId: string, position: { x: number; y: number }) => void;
}
```

- [ ] **Step 2: 함수 시그니처에서 highlightedNodeIds 디스트럭처링**

`Canvas` 함수의 파라미터 디스트럭처링(75행~89행)에 `highlightedNodeIds`를 추가한다:

```typescript
export default function Canvas({
    graph,
    hiddenTypes,
    violatedNodeIds,
    violatedTripleIds,
    selectedNodeId,
    selectedEdgeId,
    focusedNodeId,
    highlightedNodeIds,  // 추가
    onSelectNode,
    onSelectEdge,
    onClearSelection,
    onDoubleClickCanvas,
    onFocusNode,
    onContextMenu,
}: CanvasProps) {
```

- [ ] **Step 3: 스타일 useEffect에 highlightedNodeIds 로직 추가**

스타일 useEffect(550행~)의 focusMode 블록(634행~) 앞에 highlightedNodeIds 처리를 추가한다. 기존 focusMode 블록은 `else if`로 연결한다.

기존 코드 (634행~708행):

```typescript
        // Focus mode
        if (focusedNodeId) {
            // ... 기존 focusMode 로직 ...
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
```

변경 후:

```typescript
        // Search highlight mode (highest priority)
        if (highlightedNodeIds) {
            // Dim non-matching nodes
            svg.selectAll<SVGGElement, SimNode>("g.nodes g").each(function (d) {
                d3.select(this).attr(
                    "opacity",
                    highlightedNodeIds.has(d.id) ? 1 : 0.15,
                );
            });

            // Dim edges where both endpoints are not matched
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
                        highlightedNodeIds.has(sourceId as string) &&
                        highlightedNodeIds.has(targetId as string);
                    d3.select(this).attr("opacity", connected ? 1 : 0.05);
                },
            );

            // Dim edge labels
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
                        highlightedNodeIds.has(sourceId as string) &&
                        highlightedNodeIds.has(targetId as string);
                    d3.select(this).attr("opacity", connected ? 1 : 0.05);
                },
            );
        // Focus mode (lower priority)
        } else if (focusedNodeId) {
            // ... 기존 focusMode 로직 그대로 유지 ...
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
```

- [ ] **Step 4: useEffect deps에 highlightedNodeIds 추가**

스타일 useEffect의 의존성 배열(710행~716행)에 `highlightedNodeIds`를 추가한다:

```typescript
    }, [
        selectedNodeId,
        selectedEdgeId,
        violatedNodeIds,
        violatedTripleIds,
        focusedNodeId,
        highlightedNodeIds,  // 추가
    ]);
```

- [ ] **Step 5: 빌드 확인**

Run: `pnpm --filter @knowledgeview/editor build`
Expected: 빌드 실패 — page.tsx에서 Canvas에 `highlightedNodeIds` prop을 아직 전달하지 않음. 이것은 예상된 상태이며 Task 4에서 해결한다.

- [ ] **Step 6: 커밋**

```bash
git add apps/editor/src/components/graph/canvas.tsx
git commit -m "feat: Canvas에 highlightedNodeIds 하이라이트 모드 추가"
```

---

### Task 4: page.tsx 통합

검색 상태, 매칭 로직, 키보드 리스너를 page.tsx에 통합하고 Canvas와 SearchOverlay를 연결한다.

**Files:**
- Modify: `apps/editor/src/app/page.tsx`

- [ ] **Step 1: import 추가**

`apps/editor/src/app/page.tsx` 상단(1행~15행)에 import를 추가한다:

```typescript
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";  // useMemo, useEffect 추가
import Canvas from "@/components/graph/canvas";
import { NodeContextMenu } from "@/components/graph/node-context-menu";
import { Sidebar } from "@/components/panels/sidebar";
import { DetailPanel } from "@/components/panels/detail-panel";
import { NodeForm } from "@/components/forms/node-form";
import { TripleForm } from "@/components/forms/triple-form";
import { RuleForm } from "@/components/forms/rule-form";
import { useGraph } from "@/hooks/use-graph";
import { useSelection } from "@/hooks/use-selection";
import { useRules } from "@/hooks/use-rules";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SearchOverlay } from "@/components/graph/search-overlay";  // 추가
import { findMatchingNodeIds } from "@/lib/search-match";           // 추가
```

- [ ] **Step 2: 검색 상태 추가**

`Home` 컴포넌트 내부, 기존 Filter state(39행) 아래에 검색 상태를 추가한다:

```typescript
    // Filter state
    const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

    // Search state
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const matchedNodeIds = useMemo(
        () => (graph ? findMatchingNodeIds(graph.nodes, searchQuery) : null),
        [graph, searchQuery],
    );

    // searchOpen이 false면 검색 결과를 Canvas에 전달하지 않음
    const highlightedNodeIds = searchOpen ? matchedNodeIds : null;
```

- [ ] **Step 3: 검색 핸들러 추가**

기존 `handleClearSelection` 함수(181행) 아래에 검색 핸들러를 추가한다:

```typescript
    const handleSearchClose = useCallback(() => {
        setSearchOpen(false);
        setSearchQuery("");
    }, []);
```

- [ ] **Step 4: 글로벌 키보드 리스너 추가**

검색 핸들러 아래에 useEffect를 추가한다:

```typescript
    // Global keyboard shortcut: Cmd+K / Ctrl+K to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
                setFocusedNodeId(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);
```

- [ ] **Step 5: Canvas에 highlightedNodeIds prop 전달**

두 군데의 `<Canvas>` 렌더링(271행, 그리고 그래프 미로드 시에는 Canvas가 없으므로 메인 레이아웃의 Canvas만)에 prop을 추가한다:

```tsx
                    <Canvas
                        graph={graph}
                        hiddenTypes={hiddenTypes}
                        violatedNodeIds={violatedNodeIds}
                        violatedTripleIds={violatedTripleIds}
                        selectedNodeId={selectedNodeId}
                        selectedEdgeId={selectedEdgeId}
                        focusedNodeId={focusedNodeId}
                        highlightedNodeIds={highlightedNodeIds}  // 추가
                        onSelectNode={selectNode}
                        onSelectEdge={selectEdge}
                        onClearSelection={handleClearSelection}
                        onDoubleClickCanvas={handleDoubleClickCanvas}
                        onFocusNode={handleFocusNode}
                        onContextMenu={handleContextMenu}
                    />
```

- [ ] **Step 6: SearchOverlay 렌더링 추가**

Canvas를 감싸는 `<div className="relative flex-1">` 안에, Canvas 바로 위에 SearchOverlay를 추가한다 (violation banner 위):

```tsx
                <div className="relative flex-1">
                    {/* Search overlay */}
                    <SearchOverlay
                        open={searchOpen}
                        query={searchQuery}
                        matchedCount={highlightedNodeIds?.size ?? 0}
                        onQueryChange={setSearchQuery}
                        onClose={handleSearchClose}
                    />

                    {/* Violation banner at bottom-left */}
                    {failCount > 0 && (
                        ...
                    )}

                    <Canvas ... />
                </div>
```

- [ ] **Step 7: 빌드 확인**

Run: `pnpm --filter @knowledgeview/editor build`
Expected: 빌드 성공

- [ ] **Step 8: 전체 테스트 확인**

Run: `pnpm test`
Expected: 전체 테스트 통과 (기존 44개 + 새로 추가한 7개 = 51개)

- [ ] **Step 9: 커밋**

```bash
git add apps/editor/src/app/page.tsx
git commit -m "feat: page.tsx에 검색 상태 관리 및 SearchOverlay 통합"
```
