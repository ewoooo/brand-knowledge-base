# Phase 1 Round 1: PropertyEditor 컴포넌트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PropertyDef[] 기반으로 동적 폼 필드를 렌더링하는 재사용 컴포넌트를 만든다. 편집 모드(NodeForm용)와 읽기 모드(NodeInfoPanel용) 양쪽을 지원한다.

**Architecture:** PropertyEditor는 `PropertyDef[]` + `Record<string, unknown>` 을 받아 valueType별로 적절한 UI를 렌더링하는 단일 컴포넌트. `readOnly` prop으로 모드를 전환한다. 값 포매팅/파싱 로직은 순수 함수로 분리하여 유닛 테스트한다.

**Tech Stack:** React 19, TypeScript, shadcn/ui (Input, Select, Switch, Badge), kg-core types (PropertyDef), vitest

**Design decisions:**
- 편집 모드: 수직 스택 — 모든 필드가 동일 전체 너비로 세로 쌓기 (Phase 1 D4)
- 읽기 모드: valueType별 특화 표시 — hex 컬러 칩, enum 뱃지, url 링크 (Phase 1 D5)
- DESIGN.md 토큰 준수: #141414 surface, Geist, 4px base spacing, compact density

**Design reference:** 목업은 `.superpowers/brainstorm/49724-1774943700/content/property-editor-layout.html`에 있음.

**Branch:** `feat/phase1-property-editor` (main에서 분기)

---

## 파일 구조

| 파일 | 역할 | 작업 |
|------|------|------|
| `apps/editor/src/components/forms/property-editor.tsx` | PropertyEditor 컴포넌트 (편집+읽기) | 신규 |
| `apps/editor/src/components/forms/property-format.ts` | 값 포매팅/파싱 순수 함수 | 신규 |
| `apps/editor/src/__tests__/property-format.test.ts` | 포매팅 로직 유닛 테스트 | 신규 |
| `apps/editor/src/__tests__/property-editor.test.ts` | PropertyEditor 컴포넌트 유닛 테스트 | 신규 |
| `apps/editor/src/components/ui/switch.tsx` | shadcn Switch 컴포넌트 | 신규 (shadcn add) |
| `apps/editor/src/components/ui/label.tsx` | shadcn Label 컴포넌트 | 신규 (shadcn add) |

---

### Task 1: shadcn 컴포넌트 추가 (Switch, Label)

**Files:**
- Create: `apps/editor/src/components/ui/switch.tsx`
- Create: `apps/editor/src/components/ui/label.tsx`

PropertyEditor에서 boolean 필드에 Switch, 필드 라벨에 Label이 필요하다.

- [ ] **Step 1: shadcn Switch 추가**

```bash
cd apps/editor && npx shadcn@latest add switch
```

- [ ] **Step 2: shadcn Label 추가**

```bash
cd apps/editor && npx shadcn@latest add label
```

- [ ] **Step 3: 추가된 파일 확인**

```bash
ls apps/editor/src/components/ui/switch.tsx apps/editor/src/components/ui/label.tsx
```

두 파일이 존재해야 한다.

- [ ] **Step 4: 커밋**

```bash
git add apps/editor/src/components/ui/switch.tsx apps/editor/src/components/ui/label.tsx
git commit -m "chore: shadcn Switch, Label 컴포넌트 추가"
```

---

### Task 2: 값 포매팅 순수 함수 — 테스트 작성

**Files:**
- Create: `apps/editor/src/__tests__/property-format.test.ts`

PropertyEditor의 읽기 모드에서 valueType별로 값을 표시할 때 필요한 포매팅 로직을 순수 함수로 분리한다. 먼저 테스트를 작성한다.

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// apps/editor/src/__tests__/property-format.test.ts
import { describe, it, expect } from "vitest";
import {
    formatPropertyValue,
    parsePropertyInput,
    isHexColor,
} from "@/components/forms/property-format";

describe("isHexColor", () => {
    it("유효한 6자리 hex 인식", () => {
        expect(isHexColor("#2E5BFF")).toBe(true);
        expect(isHexColor("#ff5733")).toBe(true);
    });

    it("유효한 3자리 hex 인식", () => {
        expect(isHexColor("#fff")).toBe(true);
        expect(isHexColor("#F00")).toBe(true);
    });

    it("# 없으면 false", () => {
        expect(isHexColor("2E5BFF")).toBe(false);
    });

    it("일반 문자열은 false", () => {
        expect(isHexColor("hello")).toBe(false);
        expect(isHexColor("")).toBe(false);
    });
});

describe("formatPropertyValue", () => {
    it("string 값은 그대로 반환", () => {
        expect(formatPropertyValue("string", "hello")).toBe("hello");
    });

    it("number 값은 문자열로 변환", () => {
        expect(formatPropertyValue("number", 42)).toBe("42");
        expect(formatPropertyValue("number", 3.14)).toBe("3.14");
    });

    it("boolean true는 '예'", () => {
        expect(formatPropertyValue("boolean", true)).toBe("예");
    });

    it("boolean false는 '아니오'", () => {
        expect(formatPropertyValue("boolean", false)).toBe("아니오");
    });

    it("date 값은 그대로 반환", () => {
        expect(formatPropertyValue("date", "2026-03-31")).toBe("2026-03-31");
    });

    it("url 값은 그대로 반환", () => {
        expect(formatPropertyValue("url", "https://example.com")).toBe("https://example.com");
    });

    it("enum 값은 그대로 반환", () => {
        expect(formatPropertyValue("enum", "primary")).toBe("primary");
    });

    it("null/undefined는 빈 문자열", () => {
        expect(formatPropertyValue("string", null)).toBe("");
        expect(formatPropertyValue("string", undefined)).toBe("");
    });
});

describe("parsePropertyInput", () => {
    it("string은 그대로", () => {
        expect(parsePropertyInput("string", "hello")).toBe("hello");
    });

    it("number는 숫자로 변환", () => {
        expect(parsePropertyInput("number", "42")).toBe(42);
        expect(parsePropertyInput("number", "3.14")).toBe(3.14);
    });

    it("number 빈 문자열은 undefined", () => {
        expect(parsePropertyInput("number", "")).toBeUndefined();
    });

    it("number 유효하지 않은 값은 undefined", () => {
        expect(parsePropertyInput("number", "abc")).toBeUndefined();
    });

    it("boolean 'true'/'false' 변환", () => {
        expect(parsePropertyInput("boolean", "true")).toBe(true);
        expect(parsePropertyInput("boolean", "false")).toBe(false);
    });

    it("date는 그대로", () => {
        expect(parsePropertyInput("date", "2026-03-31")).toBe("2026-03-31");
    });

    it("url은 그대로", () => {
        expect(parsePropertyInput("url", "https://example.com")).toBe("https://example.com");
    });

    it("enum은 그대로", () => {
        expect(parsePropertyInput("enum", "primary")).toBe("primary");
    });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm --filter @knowledgeview/editor exec vitest run src/__tests__/property-format.test.ts
```

Expected: FAIL — `@/components/forms/property-format` 모듈이 없음.

---

### Task 3: 값 포매팅 순수 함수 — 구현

**Files:**
- Create: `apps/editor/src/components/forms/property-format.ts`

- [ ] **Step 1: 구현 파일 작성**

```typescript
// apps/editor/src/components/forms/property-format.ts
import type { PropertyDef } from "@knowledgeview/kg-core";

type ValueType = PropertyDef["valueType"];

/**
 * HEX 색상 코드인지 판별 (#xxx 또는 #xxxxxx)
 */
export function isHexColor(value: string): boolean {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

/**
 * 읽기 모드용: 값을 표시 문자열로 변환
 */
export function formatPropertyValue(
    valueType: ValueType,
    value: unknown,
): string {
    if (value === null || value === undefined) return "";

    switch (valueType) {
        case "boolean":
            return value ? "예" : "아니오";
        case "number":
            return String(value);
        case "string":
        case "date":
        case "url":
        case "enum":
            return String(value);
        default:
            return String(value);
    }
}

/**
 * 편집 모드용: input 문자열을 적절한 타입으로 파싱
 */
export function parsePropertyInput(
    valueType: ValueType,
    input: string,
): unknown {
    switch (valueType) {
        case "number": {
            if (input === "") return undefined;
            const n = Number(input);
            return Number.isNaN(n) ? undefined : n;
        }
        case "boolean":
            return input === "true";
        case "string":
        case "date":
        case "url":
        case "enum":
            return input;
        default:
            return input;
    }
}
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

```bash
pnpm --filter @knowledgeview/editor exec vitest run src/__tests__/property-format.test.ts
```

Expected: 모든 테스트 PASS.

- [ ] **Step 3: 커밋**

```bash
git add apps/editor/src/components/forms/property-format.ts apps/editor/src/__tests__/property-format.test.ts
git commit -m "feat: PropertyEditor 값 포매팅/파싱 순수 함수 추가"
```

---

### Task 4: PropertyEditor 컴포넌트 — 테스트 작성

**Files:**
- Create: `apps/editor/src/__tests__/property-editor.test.ts`

PropertyEditor는 React 컴포넌트이지만, 에디터의 vitest 환경은 `node`(jsdom 없음)이다. React 렌더링 테스트 대신 **컴포넌트의 props → 출력 매핑 로직**을 테스트한다.

구체적으로:
- `getFieldsForType()` 헬퍼: TypeRegistry에서 NodeType을 찾아 PropertyDef[] 반환
- 편집 모드에서 초기값 매핑 로직
- 읽기 모드에서 표시할 필드 필터링 로직 (값 없는 optional 필드 생략)

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// apps/editor/src/__tests__/property-editor.test.ts
import { describe, it, expect } from "vitest";
import {
    getFieldsForType,
    getDisplayFields,
} from "@/components/forms/property-editor";
import type { TypeRegistry, PropertyDef } from "@knowledgeview/kg-core";

const colorProps: PropertyDef[] = [
    { key: "hexCode", displayName: "HEX 코드", valueType: "string", required: true, description: "색상의 HEX 코드값" },
    { key: "usage", displayName: "용도", valueType: "string" },
    { key: "category", displayName: "분류", valueType: "enum", enumValues: ["primary", "secondary", "accent", "neutral"] },
];

const registry: TypeRegistry = {
    nodeTypes: [
        { type: "brand", displayName: "브랜드", description: "브랜드 엔티티", properties: [] },
        { type: "color", displayName: "색상", description: "색상 노드", properties: colorProps },
    ],
    linkTypes: [],
};

describe("getFieldsForType", () => {
    it("타입이 있으면 해당 NodeType의 properties 반환", () => {
        const fields = getFieldsForType(registry, "color");
        expect(fields).toHaveLength(3);
        expect(fields[0].key).toBe("hexCode");
    });

    it("타입이 있지만 properties가 비어있으면 빈 배열", () => {
        const fields = getFieldsForType(registry, "brand");
        expect(fields).toHaveLength(0);
    });

    it("schema에 없는 타입이면 빈 배열", () => {
        const fields = getFieldsForType(registry, "unknown");
        expect(fields).toHaveLength(0);
    });

    it("schema가 undefined이면 빈 배열", () => {
        const fields = getFieldsForType(undefined, "color");
        expect(fields).toHaveLength(0);
    });
});

describe("getDisplayFields", () => {
    it("값이 있는 필드만 반환", () => {
        const values = { hexCode: "#2E5BFF", category: "primary" };
        const result = getDisplayFields(colorProps, values);
        expect(result).toHaveLength(2);
        expect(result[0].key).toBe("hexCode");
        expect(result[1].key).toBe("category");
    });

    it("required 필드는 값이 없어도 포함", () => {
        const result = getDisplayFields(colorProps, {});
        expect(result).toHaveLength(1);
        expect(result[0].key).toBe("hexCode");
    });

    it("모든 값이 있으면 전부 반환", () => {
        const values = { hexCode: "#2E5BFF", usage: "Primary", category: "primary" };
        const result = getDisplayFields(colorProps, values);
        expect(result).toHaveLength(3);
    });

    it("properties가 빈 배열이면 빈 배열 반환", () => {
        const result = getDisplayFields([], { foo: "bar" });
        expect(result).toHaveLength(0);
    });

    it("values가 undefined이면 required만 반환", () => {
        const result = getDisplayFields(colorProps, undefined);
        expect(result).toHaveLength(1);
        expect(result[0].key).toBe("hexCode");
    });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm --filter @knowledgeview/editor exec vitest run src/__tests__/property-editor.test.ts
```

Expected: FAIL — `getFieldsForType`, `getDisplayFields` 없음.

---

### Task 5: PropertyEditor 컴포넌트 — 구현

**Files:**
- Create: `apps/editor/src/components/forms/property-editor.tsx`

`"use client"` 컴포넌트. 편집 모드는 수직 스택, 읽기 모드는 valueType별 특화 표시.

- [ ] **Step 1: 컴포넌트 파일 작성**

```tsx
// apps/editor/src/components/forms/property-editor.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { PropertyDef, TypeRegistry } from "@knowledgeview/kg-core";
import { formatPropertyValue, isHexColor } from "./property-format";

/* ------------------------------------------------------------------ */
/*  순수 헬퍼 (테스트 대상, named export)                                */
/* ------------------------------------------------------------------ */

export function getFieldsForType(
    schema: TypeRegistry | undefined,
    type: string,
): PropertyDef[] {
    if (!schema) return [];
    const nodeType = schema.nodeTypes.find((nt) => nt.type === type);
    return nodeType?.properties ?? [];
}

export function getDisplayFields(
    properties: PropertyDef[],
    values: Record<string, unknown> | undefined,
): PropertyDef[] {
    return properties.filter((prop) => {
        if (prop.required) return true;
        const val = values?.[prop.key];
        return val !== undefined && val !== null && val !== "";
    });
}

/* ------------------------------------------------------------------ */
/*  컴포넌트                                                            */
/* ------------------------------------------------------------------ */

interface PropertyEditorProps {
    properties: PropertyDef[];
    values: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    readOnly?: boolean;
}

export function PropertyEditor({
    properties,
    values,
    onChange,
    readOnly = false,
}: PropertyEditorProps) {
    if (properties.length === 0) return null;

    if (readOnly) {
        const displayFields = getDisplayFields(properties, values);
        if (displayFields.length === 0) return null;

        return (
            <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                    속성
                </p>
                <div className="space-y-2">
                    {displayFields.map((prop) => (
                        <ReadOnlyField
                            key={prop.key}
                            prop={prop}
                            value={values[prop.key]}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium uppercase">
                속성
            </p>
            <div className="space-y-3">
                {properties.map((prop) => (
                    <EditField
                        key={prop.key}
                        prop={prop}
                        value={values[prop.key]}
                        onChange={(val) => onChange(prop.key, val)}
                    />
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  읽기 모드 필드                                                      */
/* ------------------------------------------------------------------ */

function ReadOnlyField({
    prop,
    value,
}: {
    prop: PropertyDef;
    value: unknown;
}) {
    const formatted = formatPropertyValue(prop.valueType, value);

    return (
        <div className="space-y-0.5">
            <p className="text-muted-foreground text-[11px]">
                {prop.displayName}
            </p>
            {prop.valueType === "url" && formatted ? (
                <a
                    href={formatted}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 truncate text-sm text-[#5e6ad2] hover:underline"
                    title={formatted}
                >
                    <span className="truncate">{formatted}</span>
                    <ExternalLink className="size-3 shrink-0" />
                </a>
            ) : prop.valueType === "enum" ? (
                <Badge variant="outline" className="text-xs font-normal">
                    {formatted}
                </Badge>
            ) : prop.valueType === "boolean" ? (
                <p className="text-sm">{formatted}</p>
            ) : (
                <div className="flex items-center gap-1.5">
                    {prop.valueType === "string" &&
                        typeof value === "string" &&
                        isHexColor(value) && (
                            <span
                                className="inline-block size-3 shrink-0 rounded-sm"
                                style={{ backgroundColor: value }}
                            />
                        )}
                    <p
                        className={`truncate text-sm ${
                            prop.valueType === "number"
                                ? "font-mono tabular-nums"
                                : ""
                        } ${
                            prop.valueType === "string" &&
                            typeof value === "string" &&
                            isHexColor(value)
                                ? "font-mono text-xs"
                                : ""
                        }`}
                        title={formatted}
                    >
                        {formatted || (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  편집 모드 필드                                                      */
/* ------------------------------------------------------------------ */

function EditField({
    prop,
    value,
    onChange,
}: {
    prop: PropertyDef;
    value: unknown;
    onChange: (val: unknown) => void;
}) {
    const id = `prop-${prop.key}`;

    return (
        <div className="space-y-1">
            <Label htmlFor={id} className="text-xs">
                {prop.displayName}
                {prop.required && (
                    <span className="ml-0.5 text-destructive">*</span>
                )}
            </Label>
            {renderInput(prop, value, onChange, id)}
            {prop.description && (
                <p className="text-muted-foreground text-[11px]">
                    {prop.description}
                </p>
            )}
        </div>
    );
}

function renderInput(
    prop: PropertyDef,
    value: unknown,
    onChange: (val: unknown) => void,
    id: string,
) {
    switch (prop.valueType) {
        case "string":
            return (
                <Input
                    id={id}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={prop.displayName}
                />
            );

        case "number":
            return (
                <Input
                    id={id}
                    type="number"
                    value={value !== undefined && value !== null ? String(value) : ""}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                            onChange(undefined);
                        } else {
                            const n = Number(v);
                            if (!Number.isNaN(n)) onChange(n);
                        }
                    }}
                    placeholder={prop.displayName}
                />
            );

        case "boolean":
            return (
                <div className="flex items-center gap-2 py-1">
                    <Switch
                        id={id}
                        checked={!!value}
                        onCheckedChange={(checked) => onChange(checked)}
                    />
                    <Label htmlFor={id} className="text-muted-foreground text-xs font-normal">
                        {value ? "예" : "아니오"}
                    </Label>
                </div>
            );

        case "date":
            return (
                <Input
                    id={id}
                    type="date"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(e.target.value)}
                />
            );

        case "url":
            return (
                <Input
                    id={id}
                    type="url"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://..."
                />
            );

        case "enum":
            return (
                <Select
                    value={typeof value === "string" ? value : ""}
                    onValueChange={onChange}
                >
                    <SelectTrigger id={id}>
                        <SelectValue placeholder={`${prop.displayName} 선택`} />
                    </SelectTrigger>
                    <SelectContent>
                        {(prop.enumValues ?? []).map((v) => (
                            <SelectItem key={v} value={v}>
                                {v}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );

        default:
            return (
                <Input
                    id={id}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
    }
}
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

```bash
pnpm --filter @knowledgeview/editor exec vitest run src/__tests__/property-editor.test.ts
```

Expected: 모든 테스트 PASS (`getFieldsForType`, `getDisplayFields` 순수 함수 테스트).

- [ ] **Step 3: 타입 체크**

```bash
pnpm --filter @knowledgeview/editor exec tsc --noEmit
```

Expected: 에러 0.

- [ ] **Step 4: 커밋**

```bash
git add apps/editor/src/components/forms/property-editor.tsx apps/editor/src/__tests__/property-editor.test.ts
git commit -m "feat: PropertyEditor 컴포넌트 — PropertyDef 기반 동적 폼 필드"
```

---

### Task 6: 전체 테스트 실행 + 빌드 검증

- [ ] **Step 1: editor 전체 테스트**

```bash
pnpm --filter @knowledgeview/editor test
```

Expected: 기존 테스트 + 새 테스트 모두 PASS.

- [ ] **Step 2: 전체 워크스페이스 테스트**

```bash
pnpm test
```

Expected: 모든 패키지 테스트 PASS.

- [ ] **Step 3: 빌드**

```bash
pnpm build
```

Expected: 빌드 성공. PropertyEditor는 아직 어디서도 import되지 않으므로 tree-shake 대상이지만 빌드 자체는 깨지면 안 됨.

- [ ] **Step 4: 최종 커밋 (필요 시)**

빌드/테스트에서 수정이 필요했다면 여기서 커밋.

---

## Phase 1 리포트 업데이트 안내

모든 Task 완료 후 `docs/phases/phase-1-report.md`를 업데이트할 것:
- Task 1 상태: `DONE`
- Task 7 상태: `IN PROGRESS` (R1 부분 완료)
- 세션 로그에 작업 기록 추가
