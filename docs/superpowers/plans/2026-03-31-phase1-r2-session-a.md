# Phase 1 R2 세션 A: NodeForm 스키마 연동 + useDialogs props 전달

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NodeForm에서 schema 기반 타입 선택 + PropertyEditor로 props 편집 + useDialogs/page.tsx로 props 데이터 흐름 연결

**Architecture:** NodeForm에 `schema?: TypeRegistry` prop을 추가하여 타입 목록을 schema.nodeTypes에서 동적으로 생성. 타입 선택 시 해당 NodeType.properties를 PropertyEditor에 전달하여 props 편집. useDialogs는 props를 포함한 전체 Node 데이터를 addNode/updateNode로 전달. page.tsx는 NodeForm에 schema와 initial props를 연결.

**Tech Stack:** React 19, TypeScript, shadcn/ui (ScrollArea), PropertyEditor (R1에서 생성), kg-core types

**Design decisions:**
- 타입 변경 시 props 즉시 초기화 (D6)
- schema 있으면 정의된 타입만 허용 (+ 새 타입 버튼 숨김) (D2)
- schema 없으면 기존 동작 유지 (D3 from Phase 0)

**Branch:** `feat/phase1-node-form`
**Working directory:** `/Users/plusx/Documents/@KnowledgeView/.worktrees/feat-phase1-node-form`

---

## 파일 구조

| 파일 | 역할 | 작업 |
|------|------|------|
| `apps/editor/src/components/forms/node-form.tsx` | NodeForm — schema 연동 + PropertyEditor 통합 | 수정 |
| `apps/editor/src/hooks/use-dialogs.ts` | props 포함 데이터 전달 | 수정 |
| `apps/editor/src/app/page.tsx` | NodeForm에 schema/props 전달 | 수정 |

---

### Task 1: NodeForm에 schema prop 추가 + 타입 선택 변경

**Files:**
- Modify: `apps/editor/src/components/forms/node-form.tsx`

NodeForm이 schema를 받아 타입 목록을 동적으로 생성하도록 변경한다.

- [ ] **Step 1: NodeFormProps에 schema 추가 + onSubmit에 props 포함**

`apps/editor/src/components/forms/node-form.tsx` 전체를 다음으로 교체:

```tsx
"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PropertyEditor, getFieldsForType } from "./property-editor";
import type { TypeRegistry } from "@knowledgeview/kg-core";

interface NodeFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (node: { label: string; type: string; props?: Record<string, unknown> }) => void;
    initial?: { label: string; type?: string; props?: Record<string, unknown> };
    existingTypes?: string[];
    schema?: TypeRegistry;
}

const DEFAULT_TYPES = ["brand", "color", "typography", "concept"];

export function NodeForm({
    open,
    onClose,
    onSubmit,
    initial,
    existingTypes = [],
    schema,
}: NodeFormProps) {
    const [label, setLabel] = useState(initial?.label ?? "");
    const [type, setType] = useState<string>(initial?.type ?? "");
    const [customType, setCustomType] = useState("");
    const [isCustom, setIsCustom] = useState(false);
    const [props, setProps] = useState<Record<string, unknown>>(initial?.props ?? {});

    // schema가 있으면 schema.nodeTypes에서 타입 목록 생성
    const hasSchema = !!schema;
    const typeOptions = hasSchema
        ? schema.nodeTypes.map((nt) => ({ value: nt.type, label: nt.displayName }))
        : Array.from(new Set([...DEFAULT_TYPES, ...existingTypes]))
              .sort()
              .map((t) => ({ value: t, label: t }));

    // 현재 선택된 타입의 PropertyDef[]
    const currentType = isCustom ? customType.trim() : type;
    const propertyDefs = getFieldsForType(schema, currentType);

    useEffect(() => {
        if (open) {
            setLabel(initial?.label ?? "");
            setProps(initial?.props ?? {});
            const initialType = initial?.type ?? "";
            if (hasSchema) {
                // schema 모드: 정의된 타입만 허용
                setIsCustom(false);
                setCustomType("");
                setType(initialType);
            } else {
                if (
                    initialType &&
                    !DEFAULT_TYPES.includes(initialType) &&
                    !existingTypes.includes(initialType)
                ) {
                    setIsCustom(true);
                    setCustomType(initialType);
                    setType("");
                } else {
                    setIsCustom(false);
                    setCustomType("");
                    setType(initialType);
                }
            }
        }
    }, [open, initial, existingTypes, hasSchema]);

    // 타입 변경 시 props 초기화
    function handleTypeChange(newType: string) {
        setType(newType);
        setProps({});
    }

    function handlePropChange(key: string, value: unknown) {
        setProps((prev) => ({ ...prev, [key]: value }));
    }

    const isEditing = !!initial;

    function handleSubmit() {
        if (!label.trim()) return;
        const finalType = isCustom ? customType.trim() : type;
        if (!finalType) return;
        const hasProps = Object.keys(props).length > 0;
        onSubmit({
            label: label.trim(),
            type: finalType,
            ...(hasProps ? { props } : {}),
        });
        setLabel("");
        setType("");
        setCustomType("");
        setIsCustom(false);
        setProps({});
        onClose();
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "노드 편집" : "새 노드 추가"}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="flex flex-col gap-4 py-2 pr-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium">레이블</label>
                            <Input
                                placeholder="노드 이름 입력"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium">타입</label>
                            {!hasSchema && isCustom ? (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="새 타입 이름 입력"
                                        value={customType}
                                        onChange={(e) => setCustomType(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        autoFocus
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsCustom(false);
                                            setCustomType("");
                                        }}
                                    >
                                        취소
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Select value={type} onValueChange={handleTypeChange}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="타입 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {typeOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!hasSchema && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setIsCustom(true);
                                                setType("");
                                                setProps({});
                                            }}
                                        >
                                            + 새 타입
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {propertyDefs.length > 0 && (
                            <PropertyEditor
                                properties={propertyDefs}
                                values={props}
                                onChange={handlePropChange}
                            />
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        취소
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!label.trim() || !(isCustom ? customType.trim() : type)}
                    >
                        {isEditing ? "저장" : "추가"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

핵심 변경:
- `NodeFormProps`에 `schema?: TypeRegistry` 추가
- `onSubmit`에 `props?: Record<string, unknown>` 추가
- `initial`에 `props?: Record<string, unknown>` 추가
- schema 있으면 `schema.nodeTypes`에서 타입 목록 (displayName 표시) + `+ 새 타입` 숨김
- schema 없으면 기존 동작 유지
- 타입 변경 시 `handleTypeChange` → `setProps({})` (초기화)
- `PropertyEditor` 통합 (타입 선택 후 properties 렌더링)
- `ScrollArea` 감싸기 (properties가 많을 때 Dialog 높이 제한)

- [ ] **Step 2: 테스트 실행**

```bash
cd /Users/plusx/Documents/@KnowledgeView/.worktrees/feat-phase1-node-form && pnpm --filter @knowledgeview/editor exec vitest run
```

Expected: 기존 테스트 모두 PASS (NodeForm은 아직 외부에서 사용하는 인터페이스만 확장, 호환성 유지).

- [ ] **Step 3: 커밋**

```bash
git add apps/editor/src/components/forms/node-form.tsx
git commit -m "feat: NodeForm 스키마 연동 — 동적 타입 목록 + PropertyEditor 통합"
```

---

### Task 2: useDialogs props 전달

**Files:**
- Modify: `apps/editor/src/hooks/use-dialogs.ts`

handleNodeSubmit이 props를 포함하여 addNode/updateNode에 전달하도록 변경.

- [ ] **Step 1: useDialogs 수정**

`apps/editor/src/hooks/use-dialogs.ts`에서 다음을 변경:

`handleNodeSubmit`의 data 타입을 확장:

```typescript
// 기존:
const handleNodeSubmit = useCallback(
    (data: Omit<Node, "id">) => {

// 변경 없음 — Omit<Node, "id">는 이미 { label: string; type: string; props?: Record<string, unknown> }를 포함.
// NodeForm의 onSubmit이 { label, type, props? }를 보내면 그대로 addNode/updateNode에 전달됨.
```

확인: `Omit<Node, "id">`는 `{ label: string; type: string; props?: Record<string, unknown> }` 이므로 **useDialogs 코드 변경 불필요**. NodeForm이 props를 포함한 데이터를 보내면 이미 정상 전달됨.

이 태스크는 **검증만** 수행.

- [ ] **Step 2: 타입 체크로 검증**

```bash
cd /Users/plusx/Documents/@KnowledgeView/.worktrees/feat-phase1-node-form && pnpm --filter @knowledgeview/editor exec tsc --noEmit
```

Expected: 에러 0.

---

### Task 3: page.tsx에서 schema + props 전달

**Files:**
- Modify: `apps/editor/src/app/page.tsx`

NodeForm에 schema prop과 initial props를 전달.

- [ ] **Step 1: page.tsx의 NodeForm 호출 수정**

`apps/editor/src/app/page.tsx`에서 NodeForm 부분을 찾아 수정:

기존:
```tsx
<NodeForm
    open={dialogs.nodeFormOpen}
    onClose={dialogs.closeNodeForm}
    onSubmit={dialogs.handleNodeSubmit}
    initial={
        dialogs.editingNode
            ? {
                  label: dialogs.editingNode.label,
                  type: dialogs.editingNode.type,
              }
            : undefined
    }
    existingTypes={[...new Set(graph.nodes.map((n) => n.type))]}
/>
```

변경:
```tsx
<NodeForm
    open={dialogs.nodeFormOpen}
    onClose={dialogs.closeNodeForm}
    onSubmit={dialogs.handleNodeSubmit}
    initial={
        dialogs.editingNode
            ? {
                  label: dialogs.editingNode.label,
                  type: dialogs.editingNode.type,
                  props: dialogs.editingNode.props,
              }
            : undefined
    }
    existingTypes={[...new Set(graph.nodes.map((n) => n.type))]}
    schema={graph.schema}
/>
```

변경점:
- `initial`에 `props: dialogs.editingNode.props` 추가
- `schema={graph.schema}` prop 추가

- [ ] **Step 2: 빌드 검증**

```bash
cd /Users/plusx/Documents/@KnowledgeView/.worktrees/feat-phase1-node-form && pnpm --filter @knowledgeview/editor build
```

Expected: 빌드 성공.

- [ ] **Step 3: 커밋**

```bash
git add apps/editor/src/app/page.tsx
git commit -m "feat: page.tsx에서 NodeForm에 schema + props 전달"
```

---

### Task 4: 전체 테스트 + 빌드 검증

- [ ] **Step 1: 전체 테스트**

```bash
cd /Users/plusx/Documents/@KnowledgeView/.worktrees/feat-phase1-node-form && pnpm test
```

Expected: 모든 패키지 테스트 PASS.

- [ ] **Step 2: 빌드**

```bash
cd /Users/plusx/Documents/@KnowledgeView/.worktrees/feat-phase1-node-form && pnpm build
```

Expected: 빌드 성공.

---

## Phase 1 리포트 업데이트 안내

모든 Task 완료 후 `docs/phases/phase-1-report.md`를 업데이트할 것:
- Task 2 상태: `DONE`
- Task 3 상태: `DONE`
- 세션 로그에 세션 A (R2) 작업 기록 추가
