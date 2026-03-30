# KnowledgeView MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app for editing and visualizing brand ontology data as SPO triples with D3 force graph, including FOL rule validation.

**Architecture:** Next.js 16 App Router with file-based storage (.kg.json). D3.js renders an interactive force graph in a client component. shadcn/ui provides all form/panel UI. A kg-core library isolates types, CRUD, and validation for future monorepo extraction.

**Tech Stack:** Next.js 16, TypeScript, D3.js, shadcn/ui (--preset b2fA), Tailwind CSS, pnpm, Geist font, Lucide icons

---

## File Map

```
@KnowledgeView/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout, dark mode, fonts
│   │   ├── page.tsx                  # Main editor page, 3-panel layout
│   │   └── api/
│   │       └── graphs/
│   │           ├── route.ts          # GET list, POST create
│   │           └── [filename]/
│   │               └── route.ts      # GET read, PUT update, DELETE
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn components
│   │   ├── graph/
│   │   │   └── canvas.tsx            # D3 force graph ('use client')
│   │   ├── panels/
│   │   │   ├── sidebar.tsx           # Left: file list, type filter, rules
│   │   │   └── detail-panel.tsx      # Right: node detail, triples, violations
│   │   └── forms/
│   │       ├── node-form.tsx         # Node create/edit dialog
│   │       ├── triple-form.tsx       # Triple create/edit dialog
│   │       └── rule-form.tsx         # Rule condition builder dialog
│   │
│   ├── lib/
│   │   └── kg-core/
│   │       ├── types.ts              # Triple, Node, Rule, KnowledgeGraph, ValidationResult
│   │       ├── operations.ts         # addNode, removeNode, addTriple, removeTriple, addRule, removeRule
│   │       ├── validator.ts          # validate(graph): ValidationResult[]
│   │       └── serializer.ts         # toJSON, fromJSON, generateId
│   │
│   └── hooks/
│       ├── use-graph.ts              # Graph state + CRUD actions
│       ├── use-selection.ts          # Selected node/edge state
│       └── use-rules.ts             # Rule validation state
│
├── data/
│   └── brand-a.kg.json              # Sample data
│
├── __tests__/
│   └── kg-core/
│       ├── operations.test.ts
│       ├── validator.test.ts
│       └── serializer.test.ts
│
├── components.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
└── .gitignore
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `components.json`

- [ ] **Step 1: Initialize Next.js project with pnpm**

Run:
```bash
cd /Users/plusx/Documents/@KnowledgeView
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

When prompted, accept defaults. This creates the Next.js 16 project with App Router, TypeScript, Tailwind, and src directory.

- [ ] **Step 2: Initialize shadcn with preset b2fA**

Check latest shadcn docs via context7 MCP for the exact init command and --preset flag syntax. Then run:

```bash
pnpm dlx shadcn@latest init --preset b2fA
```

Verify `components.json` is created with style: nova, baseColor: neutral.

- [ ] **Step 3: Install D3.js**

```bash
pnpm add d3
pnpm add -D @types/d3
```

- [ ] **Step 4: Install vitest for testing**

```bash
pnpm add -D vitest @vitejs/plugin-react
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Update layout.tsx with dark mode and Geist font**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowledgeView",
  description: "Brand ontology editor and knowledge graph visualizer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create placeholder page**

Replace `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">KnowledgeView</h1>
    </div>
  );
}
```

- [ ] **Step 7: Create data directory and .gitignore**

```bash
mkdir -p /Users/plusx/Documents/@KnowledgeView/data
mkdir -p /Users/plusx/Documents/@KnowledgeView/__tests__/kg-core
```

Add to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 8: Verify dev server starts**

```bash
pnpm dev
```

Open http://localhost:3000 — should see "KnowledgeView" centered on dark background.

- [ ] **Step 9: Initialize git and commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with shadcn, D3, vitest"
```

---

## Task 2: kg-core Types and Serializer

**Files:**
- Create: `src/lib/kg-core/types.ts`, `src/lib/kg-core/serializer.ts`, `__tests__/kg-core/serializer.test.ts`

- [ ] **Step 1: Write the failing test for serializer**

Create `__tests__/kg-core/serializer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { toJSON, fromJSON, generateId } from "@/lib/kg-core/serializer";
import type { KnowledgeGraph } from "@/lib/kg-core/types";

describe("serializer", () => {
  const sampleGraph: KnowledgeGraph = {
    metadata: { name: "브랜드A", created: "2026-03-30", updated: "2026-03-30" },
    nodes: [
      { id: "brand-a", label: "브랜드A", type: "brand" },
      { id: "color-ff5733", label: "#FF5733", type: "color" },
    ],
    triples: [
      { id: "t1", subject: "brand-a", predicate: "프라이머리컬러", object: "color-ff5733" },
    ],
    rules: [],
  };

  it("toJSON serializes a KnowledgeGraph to a JSON string", () => {
    const json = toJSON(sampleGraph);
    const parsed = JSON.parse(json);
    expect(parsed.metadata.name).toBe("브랜드A");
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.triples).toHaveLength(1);
    expect(parsed.rules).toHaveLength(0);
  });

  it("fromJSON deserializes a JSON string to a KnowledgeGraph", () => {
    const json = toJSON(sampleGraph);
    const graph = fromJSON(json);
    expect(graph.metadata.name).toBe("브랜드A");
    expect(graph.nodes[0].id).toBe("brand-a");
    expect(graph.triples[0].predicate).toBe("프라이머리컬러");
  });

  it("fromJSON throws on invalid JSON", () => {
    expect(() => fromJSON("not json")).toThrow();
  });

  it("generateId returns a unique string", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test __tests__/kg-core/serializer.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create types.ts**

Create `src/lib/kg-core/types.ts`:

```typescript
export interface Triple {
  id: string;
  subject: string;
  predicate: string;
  object: string;
}

export interface Node {
  id: string;
  label: string;
  type?: string;
}

export interface RuleCondition {
  nodeType: string;
  predicate: string;
  operator: "must_have" | "must_not_have" | "conflicts_with";
  conflictPredicate?: string;
}

export interface Rule {
  id: string;
  name: string;
  expression: string;
  type: "constraint" | "inference" | "validation";
  condition: RuleCondition;
}

export interface KnowledgeGraph {
  metadata: {
    name: string;
    created: string;
    updated: string;
  };
  nodes: Node[];
  triples: Triple[];
  rules: Rule[];
}

export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  status: "pass" | "fail";
  violations: {
    nodeId: string;
    message: string;
    relatedTripleId?: string;
  }[];
}
```

- [ ] **Step 4: Create serializer.ts**

Create `src/lib/kg-core/serializer.ts`:

```typescript
import type { KnowledgeGraph } from "./types";

export function toJSON(graph: KnowledgeGraph): string {
  return JSON.stringify(graph, null, 2);
}

export function fromJSON(json: string): KnowledgeGraph {
  const parsed = JSON.parse(json);

  if (!parsed.metadata || !parsed.nodes || !parsed.triples) {
    throw new Error("Invalid KnowledgeGraph format");
  }

  return {
    metadata: parsed.metadata,
    nodes: parsed.nodes,
    triples: parsed.triples,
    rules: parsed.rules ?? [],
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm test __tests__/kg-core/serializer.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/kg-core/ __tests__/kg-core/serializer.test.ts
git commit -m "feat: add kg-core types and serializer with tests"
```

---

## Task 3: kg-core Operations (CRUD)

**Files:**
- Create: `src/lib/kg-core/operations.ts`, `__tests__/kg-core/operations.test.ts`

- [ ] **Step 1: Write failing tests for operations**

Create `__tests__/kg-core/operations.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  createEmptyGraph,
  addNode,
  removeNode,
  updateNode,
  addTriple,
  removeTriple,
  updateTriple,
  addRule,
  removeRule,
} from "@/lib/kg-core/operations";
import type { KnowledgeGraph, Node, Triple, Rule } from "@/lib/kg-core/types";

describe("createEmptyGraph", () => {
  it("creates a graph with name and empty arrays", () => {
    const graph = createEmptyGraph("Test");
    expect(graph.metadata.name).toBe("Test");
    expect(graph.nodes).toEqual([]);
    expect(graph.triples).toEqual([]);
    expect(graph.rules).toEqual([]);
    expect(graph.metadata.created).toBeTruthy();
  });
});

describe("node operations", () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = createEmptyGraph("Test");
  });

  it("addNode adds a node to the graph", () => {
    const node: Node = { id: "n1", label: "Brand A", type: "brand" };
    const updated = addNode(graph, node);
    expect(updated.nodes).toHaveLength(1);
    expect(updated.nodes[0].id).toBe("n1");
  });

  it("addNode throws on duplicate id", () => {
    const node: Node = { id: "n1", label: "Brand A", type: "brand" };
    const updated = addNode(graph, node);
    expect(() => addNode(updated, node)).toThrow("Node with id n1 already exists");
  });

  it("removeNode removes the node and related triples", () => {
    let g = addNode(graph, { id: "n1", label: "A" });
    g = addNode(g, { id: "n2", label: "B" });
    g = addTriple(g, { id: "t1", subject: "n1", predicate: "rel", object: "n2" });
    const updated = removeNode(g, "n1");
    expect(updated.nodes).toHaveLength(1);
    expect(updated.triples).toHaveLength(0);
  });

  it("updateNode updates label and type", () => {
    let g = addNode(graph, { id: "n1", label: "Old", type: "brand" });
    const updated = updateNode(g, "n1", { label: "New", type: "color" });
    expect(updated.nodes[0].label).toBe("New");
    expect(updated.nodes[0].type).toBe("color");
  });
});

describe("triple operations", () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = createEmptyGraph("Test");
    graph = addNode(graph, { id: "n1", label: "A" });
    graph = addNode(graph, { id: "n2", label: "B" });
  });

  it("addTriple adds a triple", () => {
    const triple: Triple = { id: "t1", subject: "n1", predicate: "관계", object: "n2" };
    const updated = addTriple(graph, triple);
    expect(updated.triples).toHaveLength(1);
  });

  it("addTriple throws if subject node does not exist", () => {
    const triple: Triple = { id: "t1", subject: "missing", predicate: "관계", object: "n2" };
    expect(() => addTriple(graph, triple)).toThrow("Subject node missing not found");
  });

  it("addTriple throws if object node does not exist", () => {
    const triple: Triple = { id: "t1", subject: "n1", predicate: "관계", object: "missing" };
    expect(() => addTriple(graph, triple)).toThrow("Object node missing not found");
  });

  it("removeTriple removes a triple by id", () => {
    let g = addTriple(graph, { id: "t1", subject: "n1", predicate: "관계", object: "n2" });
    const updated = removeTriple(g, "t1");
    expect(updated.triples).toHaveLength(0);
  });

  it("updateTriple updates predicate", () => {
    let g = addTriple(graph, { id: "t1", subject: "n1", predicate: "old", object: "n2" });
    const updated = updateTriple(g, "t1", { predicate: "new" });
    expect(updated.triples[0].predicate).toBe("new");
  });
});

describe("rule operations", () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = createEmptyGraph("Test");
  });

  it("addRule adds a rule", () => {
    const rule: Rule = {
      id: "r1",
      name: "Test Rule",
      expression: "∀x (brand(x) → ∃y rel(x, y))",
      type: "constraint",
      condition: { nodeType: "brand", predicate: "rel", operator: "must_have" },
    };
    const updated = addRule(graph, rule);
    expect(updated.rules).toHaveLength(1);
  });

  it("removeRule removes a rule by id", () => {
    const rule: Rule = {
      id: "r1",
      name: "Test Rule",
      expression: "",
      type: "constraint",
      condition: { nodeType: "brand", predicate: "rel", operator: "must_have" },
    };
    let g = addRule(graph, rule);
    const updated = removeRule(g, "r1");
    expect(updated.rules).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test __tests__/kg-core/operations.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement operations.ts**

Create `src/lib/kg-core/operations.ts`:

```typescript
import type { KnowledgeGraph, Node, Triple, Rule } from "./types";

export function createEmptyGraph(name: string): KnowledgeGraph {
  const now = new Date().toISOString().split("T")[0];
  return {
    metadata: { name, created: now, updated: now },
    nodes: [],
    triples: [],
    rules: [],
  };
}

export function addNode(graph: KnowledgeGraph, node: Node): KnowledgeGraph {
  if (graph.nodes.some((n) => n.id === node.id)) {
    throw new Error(`Node with id ${node.id} already exists`);
  }
  return {
    ...graph,
    nodes: [...graph.nodes, node],
    metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
  };
}

export function removeNode(graph: KnowledgeGraph, nodeId: string): KnowledgeGraph {
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => n.id !== nodeId),
    triples: graph.triples.filter(
      (t) => t.subject !== nodeId && t.object !== nodeId
    ),
    metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
  };
}

export function updateNode(
  graph: KnowledgeGraph,
  nodeId: string,
  updates: Partial<Omit<Node, "id">>
): KnowledgeGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.id === nodeId ? { ...n, ...updates } : n
    ),
    metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
  };
}

export function addTriple(graph: KnowledgeGraph, triple: Triple): KnowledgeGraph {
  if (!graph.nodes.some((n) => n.id === triple.subject)) {
    throw new Error(`Subject node ${triple.subject} not found`);
  }
  if (!graph.nodes.some((n) => n.id === triple.object)) {
    throw new Error(`Object node ${triple.object} not found`);
  }
  return {
    ...graph,
    triples: [...graph.triples, triple],
    metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
  };
}

export function removeTriple(graph: KnowledgeGraph, tripleId: string): KnowledgeGraph {
  return {
    ...graph,
    triples: graph.triples.filter((t) => t.id !== tripleId),
    metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
  };
}

export function updateTriple(
  graph: KnowledgeGraph,
  tripleId: string,
  updates: Partial<Omit<Triple, "id">>
): KnowledgeGraph {
  return {
    ...graph,
    triples: graph.triples.map((t) =>
      t.id === tripleId ? { ...t, ...updates } : t
    ),
    metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
  };
}

export function addRule(graph: KnowledgeGraph, rule: Rule): KnowledgeGraph {
  return {
    ...graph,
    rules: [...graph.rules, rule],
    metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
  };
}

export function removeRule(graph: KnowledgeGraph, ruleId: string): KnowledgeGraph {
  return {
    ...graph,
    rules: graph.rules.filter((r) => r.id !== ruleId),
    metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test __tests__/kg-core/operations.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/kg-core/operations.ts __tests__/kg-core/operations.test.ts
git commit -m "feat: add kg-core CRUD operations with tests"
```

---

## Task 4: kg-core Validator

**Files:**
- Create: `src/lib/kg-core/validator.ts`, `__tests__/kg-core/validator.test.ts`

- [ ] **Step 1: Write failing tests for validator**

Create `__tests__/kg-core/validator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validate } from "@/lib/kg-core/validator";
import {
  createEmptyGraph,
  addNode,
  addTriple,
  addRule,
} from "@/lib/kg-core/operations";
import type { Rule } from "@/lib/kg-core/types";

describe("validate", () => {
  const mustHaveRule: Rule = {
    id: "r1",
    name: "브랜드는 프라이머리컬러 필수",
    expression: "∀x (brand(x) → ∃y 프라이머리컬러(x, y))",
    type: "constraint",
    condition: { nodeType: "brand", predicate: "프라이머리컬러", operator: "must_have" },
  };

  const mustNotHaveRule: Rule = {
    id: "r2",
    name: "컨셉 노드는 금지색상 불가",
    expression: "∀x (concept(x) → ¬∃y 금지색상(x, y))",
    type: "validation",
    condition: { nodeType: "concept", predicate: "금지색상", operator: "must_not_have" },
  };

  const conflictsWithRule: Rule = {
    id: "r3",
    name: "프라이머리컬러와 금지색상 충돌 방지",
    expression: "∀x ∀y (프라이머리컬러(x, y) → ¬금지색상(x, y))",
    type: "validation",
    condition: {
      nodeType: "brand",
      predicate: "프라이머리컬러",
      operator: "conflicts_with",
      conflictPredicate: "금지색상",
    },
  };

  it("must_have: passes when node has the required predicate", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "b1", label: "Brand", type: "brand" });
    g = addNode(g, { id: "c1", label: "#FF0000", type: "color" });
    g = addTriple(g, { id: "t1", subject: "b1", predicate: "프라이머리컬러", object: "c1" });
    g = addRule(g, mustHaveRule);

    const results = validate(g);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("pass");
  });

  it("must_have: fails when node is missing the required predicate", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "b1", label: "Brand", type: "brand" });
    g = addRule(g, mustHaveRule);

    const results = validate(g);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("fail");
    expect(results[0].violations).toHaveLength(1);
    expect(results[0].violations[0].nodeId).toBe("b1");
  });

  it("must_not_have: passes when node does not have the forbidden predicate", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "c1", label: "Warm", type: "concept" });
    g = addRule(g, mustNotHaveRule);

    const results = validate(g);
    expect(results[0].status).toBe("pass");
  });

  it("must_not_have: fails when node has the forbidden predicate", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "c1", label: "Warm", type: "concept" });
    g = addNode(g, { id: "x1", label: "#000", type: "color" });
    g = addTriple(g, { id: "t1", subject: "c1", predicate: "금지색상", object: "x1" });
    g = addRule(g, mustNotHaveRule);

    const results = validate(g);
    expect(results[0].status).toBe("fail");
    expect(results[0].violations[0].nodeId).toBe("c1");
  });

  it("conflicts_with: passes when no conflict exists", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "b1", label: "Brand", type: "brand" });
    g = addNode(g, { id: "c1", label: "#FF0000", type: "color" });
    g = addNode(g, { id: "c2", label: "#00FF00", type: "color" });
    g = addTriple(g, { id: "t1", subject: "b1", predicate: "프라이머리컬러", object: "c1" });
    g = addTriple(g, { id: "t2", subject: "b1", predicate: "금지색상", object: "c2" });
    g = addRule(g, conflictsWithRule);

    const results = validate(g);
    expect(results[0].status).toBe("pass");
  });

  it("conflicts_with: fails when same object appears in both predicates", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "b1", label: "Brand", type: "brand" });
    g = addNode(g, { id: "c1", label: "#FF0000", type: "color" });
    g = addTriple(g, { id: "t1", subject: "b1", predicate: "프라이머리컬러", object: "c1" });
    g = addTriple(g, { id: "t2", subject: "b1", predicate: "금지색상", object: "c1" });
    g = addRule(g, conflictsWithRule);

    const results = validate(g);
    expect(results[0].status).toBe("fail");
    expect(results[0].violations[0].nodeId).toBe("b1");
    expect(results[0].violations[0].relatedTripleId).toBe("t2");
  });

  it("returns empty results for graph with no rules", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "b1", label: "Brand", type: "brand" });
    const results = validate(g);
    expect(results).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test __tests__/kg-core/validator.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement validator.ts**

Create `src/lib/kg-core/validator.ts`:

```typescript
import type { KnowledgeGraph, ValidationResult } from "./types";

export function validate(graph: KnowledgeGraph): ValidationResult[] {
  return graph.rules.map((rule) => {
    const targetNodes = graph.nodes.filter((n) => n.type === rule.condition.nodeType);
    const violations: ValidationResult["violations"] = [];

    switch (rule.condition.operator) {
      case "must_have": {
        for (const node of targetNodes) {
          const hasRelation = graph.triples.some(
            (t) => t.subject === node.id && t.predicate === rule.condition.predicate
          );
          if (!hasRelation) {
            violations.push({
              nodeId: node.id,
              message: `${node.label}에 ${rule.condition.predicate} 관계가 없습니다`,
            });
          }
        }
        break;
      }

      case "must_not_have": {
        for (const node of targetNodes) {
          const forbidden = graph.triples.find(
            (t) => t.subject === node.id && t.predicate === rule.condition.predicate
          );
          if (forbidden) {
            violations.push({
              nodeId: node.id,
              message: `${node.label}에 금지된 ${rule.condition.predicate} 관계가 있습니다`,
              relatedTripleId: forbidden.id,
            });
          }
        }
        break;
      }

      case "conflicts_with": {
        for (const node of targetNodes) {
          const primaryObjects = graph.triples
            .filter((t) => t.subject === node.id && t.predicate === rule.condition.predicate)
            .map((t) => t.object);

          const conflicting = graph.triples.find(
            (t) =>
              t.subject === node.id &&
              t.predicate === rule.condition.conflictPredicate &&
              primaryObjects.includes(t.object)
          );

          if (conflicting) {
            violations.push({
              nodeId: node.id,
              message: `${node.label}의 ${rule.condition.predicate}와 ${rule.condition.conflictPredicate}가 같은 대상(${conflicting.object})을 가리킵니다`,
              relatedTripleId: conflicting.id,
            });
          }
        }
        break;
      }
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: violations.length === 0 ? "pass" : "fail",
      violations,
    } satisfies ValidationResult;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test __tests__/kg-core/validator.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/kg-core/validator.ts __tests__/kg-core/validator.test.ts
git commit -m "feat: add FOL rule validator with 3 operators (must_have, must_not_have, conflicts_with)"
```

---

## Task 5: API Routes (File-based CRUD)

**Files:**
- Create: `src/app/api/graphs/route.ts`, `src/app/api/graphs/[filename]/route.ts`, `data/brand-a.kg.json`

- [ ] **Step 1: Create sample data file**

Create `data/brand-a.kg.json`:

```json
{
  "metadata": {
    "name": "브랜드A",
    "created": "2026-03-30",
    "updated": "2026-03-30"
  },
  "nodes": [
    { "id": "brand-a", "label": "브랜드A", "type": "brand" },
    { "id": "color-ff5733", "label": "#FF5733", "type": "color" },
    { "id": "font-pretendard", "label": "Pretendard", "type": "typography" },
    { "id": "tone-warm", "label": "따뜻하고 친근한", "type": "concept" }
  ],
  "triples": [
    { "id": "t1", "subject": "brand-a", "predicate": "프라이머리컬러", "object": "color-ff5733" },
    { "id": "t2", "subject": "brand-a", "predicate": "주서체", "object": "font-pretendard" },
    { "id": "t3", "subject": "brand-a", "predicate": "톤앤매너", "object": "tone-warm" }
  ],
  "rules": []
}
```

- [ ] **Step 2: Create list/create API route**

Create `src/app/api/graphs/route.ts`:

```typescript
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function GET() {
  const files = await fs.readdir(DATA_DIR);
  const kgFiles = files.filter((f) => f.endsWith(".kg.json"));

  const graphs = await Promise.all(
    kgFiles.map(async (filename) => {
      const content = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
      const parsed = JSON.parse(content);
      return {
        filename,
        name: parsed.metadata.name,
        nodeCount: parsed.nodes.length,
        tripleCount: parsed.triples.length,
        ruleCount: parsed.rules?.length ?? 0,
      };
    })
  );

  return NextResponse.json(graphs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-");
  const filename = `${slug}.kg.json`;
  const filepath = path.join(DATA_DIR, filename);

  const now = new Date().toISOString().split("T")[0];
  const graph = {
    metadata: { name, created: now, updated: now },
    nodes: [],
    triples: [],
    rules: [],
  };

  await fs.writeFile(filepath, JSON.stringify(graph, null, 2));

  return NextResponse.json({ filename, name }, { status: 201 });
}
```

- [ ] **Step 3: Create single graph CRUD route**

Create `src/app/api/graphs/[filename]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filepath = path.join(DATA_DIR, filename);

  try {
    const content = await fs.readFile(filepath, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({ error: "Graph not found" }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filepath = path.join(DATA_DIR, filename);
  const graph = await request.json();

  graph.metadata.updated = new Date().toISOString().split("T")[0];

  await fs.writeFile(filepath, JSON.stringify(graph, null, 2));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filepath = path.join(DATA_DIR, filename);

  try {
    await fs.unlink(filepath);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Graph not found" }, { status: 404 });
  }
}
```

- [ ] **Step 4: Verify API routes work**

Start dev server and test with curl:

```bash
pnpm dev &
sleep 3

# List graphs
curl http://localhost:3000/api/graphs

# Read single graph
curl http://localhost:3000/api/graphs/brand-a.kg.json

# Create new graph
curl -X POST http://localhost:3000/api/graphs -H "Content-Type: application/json" -d '{"name":"테스트"}'

# Delete the test graph
curl -X DELETE http://localhost:3000/api/graphs/테스트.kg.json
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ data/brand-a.kg.json
git commit -m "feat: add file-based API routes for graph CRUD"
```

---

## Task 6: React Hooks (use-graph, use-selection, use-rules)

**Files:**
- Create: `src/hooks/use-graph.ts`, `src/hooks/use-selection.ts`, `src/hooks/use-rules.ts`

- [ ] **Step 1: Create use-graph hook**

Create `src/hooks/use-graph.ts`:

```typescript
"use client";

import { useState, useCallback } from "react";
import type { KnowledgeGraph, Node, Triple, Rule } from "@/lib/kg-core/types";
import {
  addNode,
  removeNode,
  updateNode,
  addTriple,
  removeTriple,
  updateTriple,
  addRule,
  removeRule,
} from "@/lib/kg-core/operations";
import { generateId } from "@/lib/kg-core/serializer";

export function useGraph(initial: KnowledgeGraph | null) {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(initial);
  const [filename, setFilename] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const load = useCallback(async (file: string) => {
    const res = await fetch(`/api/graphs/${file}`);
    if (!res.ok) throw new Error("Failed to load graph");
    const data: KnowledgeGraph = await res.json();
    setGraph(data);
    setFilename(file);
    setIsDirty(false);
  }, []);

  const save = useCallback(async () => {
    if (!graph || !filename) return;
    await fetch(`/api/graphs/${filename}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graph),
    });
    setIsDirty(false);
  }, [graph, filename]);

  const modify = useCallback((fn: (g: KnowledgeGraph) => KnowledgeGraph) => {
    setGraph((prev) => {
      if (!prev) return prev;
      setIsDirty(true);
      return fn(prev);
    });
  }, []);

  return {
    graph,
    filename,
    isDirty,
    load,
    save,
    setGraph,
    setFilename,
    addNode: (node: Omit<Node, "id">) =>
      modify((g) => addNode(g, { ...node, id: generateId() })),
    removeNode: (id: string) => modify((g) => removeNode(g, id)),
    updateNode: (id: string, updates: Partial<Omit<Node, "id">>) =>
      modify((g) => updateNode(g, id, updates)),
    addTriple: (triple: Omit<Triple, "id">) =>
      modify((g) => addTriple(g, { ...triple, id: generateId() })),
    removeTriple: (id: string) => modify((g) => removeTriple(g, id)),
    updateTriple: (id: string, updates: Partial<Omit<Triple, "id">>) =>
      modify((g) => updateTriple(g, id, updates)),
    addRule: (rule: Omit<Rule, "id">) =>
      modify((g) => addRule(g, { ...rule, id: generateId() })),
    removeRule: (id: string) => modify((g) => removeRule(g, id)),
  };
}
```

- [ ] **Step 2: Create use-selection hook**

Create `src/hooks/use-selection.ts`:

```typescript
"use client";

import { useState, useCallback } from "react";

interface Selection {
  type: "node" | "edge";
  id: string;
}

export function useSelection() {
  const [selection, setSelection] = useState<Selection | null>(null);

  const selectNode = useCallback((id: string) => {
    setSelection({ type: "node", id });
  }, []);

  const selectEdge = useCallback((id: string) => {
    setSelection({ type: "edge", id });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  return {
    selection,
    selectNode,
    selectEdge,
    clearSelection,
  };
}
```

- [ ] **Step 3: Create use-rules hook**

Create `src/hooks/use-rules.ts`:

```typescript
"use client";

import { useMemo } from "react";
import type { KnowledgeGraph, ValidationResult } from "@/lib/kg-core/types";
import { validate } from "@/lib/kg-core/validator";

export function useRules(graph: KnowledgeGraph | null) {
  const results = useMemo<ValidationResult[]>(() => {
    if (!graph) return [];
    return validate(graph);
  }, [graph]);

  const violatedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const result of results) {
      for (const v of result.violations) {
        ids.add(v.nodeId);
      }
    }
    return ids;
  }, [results]);

  const violatedTripleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const result of results) {
      for (const v of result.violations) {
        if (v.relatedTripleId) ids.add(v.relatedTripleId);
      }
    }
    return ids;
  }, [results]);

  return {
    results,
    violatedNodeIds,
    violatedTripleIds,
    passCount: results.filter((r) => r.status === "pass").length,
    failCount: results.filter((r) => r.status === "fail").length,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat: add React hooks for graph state, selection, and rule validation"
```

---

## Task 7: shadcn Components Setup

**Files:**
- Modify: `src/components/ui/` (shadcn components installed)

- [ ] **Step 1: Install required shadcn components**

Check shadcn MCP for available components in the b2fA preset registry. Then install:

```bash
pnpm dlx shadcn@latest add button dialog input select badge toggle toggle-group alert alert-dialog card command sidebar tooltip separator scroll-area
```

- [ ] **Step 2: Verify components are installed**

```bash
ls src/components/ui/
```

Expected: All component files present.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ components.json
git commit -m "feat: install shadcn ui components"
```

---

## Task 8: Sidebar Panel

**Files:**
- Create: `src/components/panels/sidebar.tsx`

- [ ] **Step 1: Create sidebar component**

Create `src/components/panels/sidebar.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ValidationResult } from "@/lib/kg-core/types";

interface GraphListItem {
  filename: string;
  name: string;
  nodeCount: number;
  tripleCount: number;
  ruleCount: number;
}

interface SidebarProps {
  currentFile: string | null;
  onSelectFile: (filename: string) => void;
  onCreateGraph: () => void;
  validationResults: ValidationResult[];
  onAddRule: () => void;
}

export function Sidebar({
  currentFile,
  onSelectFile,
  onCreateGraph,
  validationResults,
  onAddRule,
}: SidebarProps) {
  const [graphs, setGraphs] = useState<GraphListItem[]>([]);

  useEffect(() => {
    fetch("/api/graphs")
      .then((res) => res.json())
      .then(setGraphs);
  }, [currentFile]);

  return (
    <div className="flex h-full w-[220px] flex-col border-r">
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            그래프
          </span>
          <Button variant="ghost" size="sm" onClick={onCreateGraph}>
            + 새 그래프
          </Button>
        </div>
        <ScrollArea className="h-[120px]">
          {graphs.map((g) => (
            <button
              key={g.filename}
              onClick={() => onSelectFile(g.filename)}
              className={`mb-1 w-full rounded-md px-3 py-1.5 text-left text-sm ${
                currentFile === g.filename
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              📁 {g.name}
            </button>
          ))}
        </ScrollArea>
      </div>

      <Separator />

      <div className="flex-1 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            규칙
          </span>
          <Button variant="ghost" size="sm" onClick={onAddRule}>
            + 추가
          </Button>
        </div>
        <ScrollArea className="h-full">
          {validationResults.length === 0 && (
            <p className="text-xs text-muted-foreground">규칙 없음</p>
          )}
          {validationResults.map((r) => (
            <div
              key={r.ruleId}
              className={`mb-1.5 rounded-md border-l-2 px-3 py-2 text-xs ${
                r.status === "pass"
                  ? "border-green-500 bg-green-500/5"
                  : "border-red-500 bg-red-500/5"
              }`}
            >
              <div className="font-medium">
                {r.status === "pass" ? "✓" : "✗"} {r.ruleName}
              </div>
              <div className="text-muted-foreground">
                {r.status === "pass"
                  ? "통과"
                  : `${r.violations.length}건 위반`}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/panels/sidebar.tsx
git commit -m "feat: add sidebar panel with graph list and rule status"
```

---

## Task 9: Detail Panel

**Files:**
- Create: `src/components/panels/detail-panel.tsx`

- [ ] **Step 1: Create detail panel component**

Create `src/components/panels/detail-panel.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type {
  KnowledgeGraph,
  Node,
  Triple,
  ValidationResult,
} from "@/lib/kg-core/types";

interface DetailPanelProps {
  graph: KnowledgeGraph;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  validationResults: ValidationResult[];
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onEditTriple: (tripleId: string) => void;
  onDeleteTriple: (tripleId: string) => void;
}

export function DetailPanel({
  graph,
  selectedNodeId,
  selectedEdgeId,
  validationResults,
  onEditNode,
  onDeleteNode,
  onEditTriple,
  onDeleteTriple,
}: DetailPanelProps) {
  if (!selectedNodeId && !selectedEdgeId) {
    return (
      <div className="flex h-full w-[260px] items-center justify-center border-l p-4">
        <p className="text-sm text-muted-foreground">
          노드를 클릭하면 상세 정보가 표시됩니다
        </p>
      </div>
    );
  }

  if (selectedEdgeId) {
    const triple = graph.triples.find((t) => t.id === selectedEdgeId);
    if (!triple) return null;

    const subjectNode = graph.nodes.find((n) => n.id === triple.subject);
    const objectNode = graph.nodes.find((n) => n.id === triple.object);

    return (
      <div className="flex h-full w-[260px] flex-col border-l p-4">
        <span className="mb-3 text-xs font-medium uppercase text-muted-foreground">
          선택된 트리플
        </span>
        <div className="mb-2 text-sm">
          <span className="text-muted-foreground">{subjectNode?.label}</span>
          {" → "}
          <span className="font-medium">{triple.predicate}</span>
          {" → "}
          <span className="text-muted-foreground">{objectNode?.label}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEditTriple(triple.id)}
          >
            편집
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => onDeleteTriple(triple.id)}
          >
            삭제
          </Button>
        </div>
      </div>
    );
  }

  const node = graph.nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const connectedTriples = graph.triples.filter(
    (t) => t.subject === node.id || t.object === node.id
  );

  const nodeViolations = validationResults.flatMap((r) =>
    r.violations
      .filter((v) => v.nodeId === node.id)
      .map((v) => ({ ...v, ruleName: r.ruleName, ruleId: r.ruleId }))
  );

  return (
    <div className="flex h-full w-[260px] flex-col border-l">
      <ScrollArea className="flex-1 p-4">
        <span className="mb-3 text-xs font-medium uppercase text-muted-foreground">
          선택된 노드
        </span>

        <div className="mb-3 mt-2">
          <div className="mb-1 text-[10px] text-muted-foreground">Label</div>
          <div className="rounded-md border bg-muted/30 px-3 py-1.5 text-sm">
            {node.label}
          </div>
        </div>

        {node.type && (
          <div className="mb-3">
            <div className="mb-1 text-[10px] text-muted-foreground">Type</div>
            <Badge variant="secondary">{node.type}</Badge>
          </div>
        )}

        <Separator className="my-3" />

        <span className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          연결된 트리플 ({connectedTriples.length})
        </span>

        {connectedTriples.map((t) => {
          const objectNode = graph.nodes.find((n) => n.id === t.object);
          const isViolated = validationResults.some((r) =>
            r.violations.some((v) => v.relatedTripleId === t.id)
          );
          return (
            <button
              key={t.id}
              onClick={() => onEditTriple(t.id)}
              className={`mt-1.5 w-full rounded-md px-3 py-2 text-left text-xs ${
                isViolated
                  ? "border border-red-500/30 bg-red-500/5"
                  : "bg-muted/20"
              }`}
            >
              <span className="text-muted-foreground">→ </span>
              <span className={isViolated ? "text-red-400" : "text-primary"}>
                {t.predicate}
              </span>
              <span className="text-muted-foreground">
                {" "}→ {objectNode?.label ?? t.object}
              </span>
              {isViolated && <span className="ml-1 text-red-400">⚠</span>}
            </button>
          );
        })}

        {nodeViolations.length > 0 && (
          <>
            <Separator className="my-3" />
            {nodeViolations.map((v) => (
              <Alert key={v.ruleId} variant="destructive" className="mt-2">
                <AlertTitle className="text-xs">규칙 위반</AlertTitle>
                <AlertDescription className="text-xs">
                  <div className="font-medium">{v.ruleName}</div>
                  <div className="mt-1 text-muted-foreground">{v.message}</div>
                </AlertDescription>
              </Alert>
            ))}
          </>
        )}
      </ScrollArea>

      <div className="flex gap-2 border-t p-4">
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={() => onDeleteNode(node.id)}
        >
          삭제
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEditNode(node.id)}
        >
          편집
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/panels/detail-panel.tsx
git commit -m "feat: add detail panel with node info, triples, and violation display"
```

---

## Task 10: Form Dialogs (Node, Triple, Rule)

**Files:**
- Create: `src/components/forms/node-form.tsx`, `src/components/forms/triple-form.tsx`, `src/components/forms/rule-form.tsx`

- [ ] **Step 1: Create node form dialog**

Create `src/components/forms/node-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

const NODE_TYPES = ["brand", "color", "typography", "concept"];

interface NodeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (node: { label: string; type?: string }) => void;
  initial?: { label: string; type?: string };
}

export function NodeForm({ open, onClose, onSubmit, initial }: NodeFormProps) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [type, setType] = useState(initial?.type ?? "");

  const handleSubmit = () => {
    if (!label.trim()) return;
    onSubmit({ label: label.trim(), type: type || undefined });
    setLabel("");
    setType("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "노드 편집" : "새 노드 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="mb-1 text-xs text-muted-foreground">Label</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="노드 이름"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div>
            <label className="mb-1 text-xs text-muted-foreground">Type (선택)</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="타입 선택" />
              </SelectTrigger>
              <SelectContent>
                {NODE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!label.trim()}>
            {initial ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create triple form dialog**

Create `src/components/forms/triple-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import type { Node } from "@/lib/kg-core/types";

interface TripleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (triple: { subject: string; predicate: string; object: string }) => void;
  nodes: Node[];
  initial?: { subject: string; predicate: string; object: string };
}

export function TripleForm({
  open,
  onClose,
  onSubmit,
  nodes,
  initial,
}: TripleFormProps) {
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [predicate, setPredicate] = useState(initial?.predicate ?? "");
  const [object, setObject] = useState(initial?.object ?? "");

  const handleSubmit = () => {
    if (!subject || !predicate.trim() || !object) return;
    onSubmit({ subject, predicate: predicate.trim(), object });
    setSubject("");
    setPredicate("");
    setObject("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "트리플 편집" : "새 트리플 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="mb-1 text-xs text-muted-foreground">
              Subject (주어)
            </label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="노드 선택" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 text-xs text-muted-foreground">
              Predicate (관계)
            </label>
            <Input
              value={predicate}
              onChange={(e) => setPredicate(e.target.value)}
              placeholder="관계 이름 (자유 입력)"
            />
          </div>
          <div>
            <label className="mb-1 text-xs text-muted-foreground">
              Object (목적어)
            </label>
            <Select value={object} onValueChange={setObject}>
              <SelectTrigger>
                <SelectValue placeholder="노드 선택" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!subject || !predicate.trim() || !object}
          >
            {initial ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create rule form dialog (condition builder)**

Create `src/components/forms/rule-form.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import type { KnowledgeGraph, RuleCondition } from "@/lib/kg-core/types";

const RULE_TYPES = [
  { value: "constraint", label: "constraint" },
  { value: "inference", label: "inference" },
  { value: "validation", label: "validation" },
] as const;

const OPERATORS = [
  { value: "must_have", label: "반드시 가져야 한다" },
  { value: "must_not_have", label: "가질 수 없다" },
  { value: "conflicts_with", label: "충돌하면 안 된다" },
] as const;

interface RuleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rule: {
    name: string;
    expression: string;
    type: "constraint" | "inference" | "validation";
    condition: RuleCondition;
  }) => void;
  graph: KnowledgeGraph;
}

function buildExpression(condition: RuleCondition): string {
  const { nodeType, predicate, operator, conflictPredicate } = condition;
  switch (operator) {
    case "must_have":
      return `∀x (${nodeType}(x) → ∃y ${predicate}(x, y))`;
    case "must_not_have":
      return `∀x (${nodeType}(x) → ¬∃y ${predicate}(x, y))`;
    case "conflicts_with":
      return `∀x ∀y (${predicate}(x, y) → ¬${conflictPredicate}(x, y))`;
  }
}

export function RuleForm({ open, onClose, onSubmit, graph }: RuleFormProps) {
  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState<"constraint" | "inference" | "validation">("constraint");
  const [nodeType, setNodeType] = useState("");
  const [predicate, setPredicate] = useState("");
  const [operator, setOperator] = useState<RuleCondition["operator"]>("must_have");
  const [conflictPredicate, setConflictPredicate] = useState("");

  const nodeTypes = useMemo(() => {
    const types = new Set(graph.nodes.map((n) => n.type).filter(Boolean));
    return Array.from(types) as string[];
  }, [graph]);

  const predicates = useMemo(() => {
    const preds = new Set(graph.triples.map((t) => t.predicate));
    return Array.from(preds);
  }, [graph]);

  const condition: RuleCondition = {
    nodeType,
    predicate,
    operator,
    ...(operator === "conflicts_with" ? { conflictPredicate } : {}),
  };

  const expression = nodeType && predicate ? buildExpression(condition) : "";

  const handleSubmit = () => {
    if (!name.trim() || !nodeType || !predicate) return;
    if (operator === "conflicts_with" && !conflictPredicate) return;
    onSubmit({ name: name.trim(), expression, type: ruleType, condition });
    setName("");
    setNodeType("");
    setPredicate("");
    setOperator("must_have");
    setConflictPredicate("");
    onClose();
  };

  const isValid =
    name.trim() &&
    nodeType &&
    predicate &&
    (operator !== "conflicts_with" || conflictPredicate);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 규칙 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="mb-1 text-xs text-muted-foreground">
              규칙 이름
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 브랜드는 프라이머리컬러 필수"
            />
          </div>

          <div>
            <label className="mb-1 text-xs text-muted-foreground">타입</label>
            <ToggleGroup
              type="single"
              value={ruleType}
              onValueChange={(v) => v && setRuleType(v as typeof ruleType)}
            >
              {RULE_TYPES.map((t) => (
                <ToggleGroupItem key={t.value} value={t.value} size="sm">
                  {t.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="rounded-lg border p-4">
            <label className="mb-2 text-xs text-muted-foreground">
              조건 빌더
            </label>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">모든</span>
              <Select value={nodeType} onValueChange={setNodeType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="노드 타입" />
                </SelectTrigger>
                <SelectContent>
                  {nodeTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">타입 노드는</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Select value={predicate} onValueChange={setPredicate}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="관계" />
                </SelectTrigger>
                <SelectContent>
                  {predicates.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">관계를</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Select value={operator} onValueChange={(v) => setOperator(v as RuleCondition["operator"])}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {operator === "conflicts_with" && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">충돌 대상:</span>
                <Select value={conflictPredicate} onValueChange={setConflictPredicate}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="관계" />
                  </SelectTrigger>
                  <SelectContent>
                    {predicates.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {expression && (
            <div className="rounded-md bg-muted/30 p-3">
              <div className="mb-1 text-[10px] text-muted-foreground">
                FOL 미리보기
              </div>
              <code className="text-xs">{expression}</code>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/forms/
git commit -m "feat: add node, triple, and rule form dialogs with condition builder"
```

---

## Task 11: D3 Force Graph Canvas

**Files:**
- Create: `src/components/graph/canvas.tsx`

- [ ] **Step 1: Create the D3 force graph canvas component**

Create `src/components/graph/canvas.tsx`:

```tsx
"use client";

import { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";
import type { KnowledgeGraph } from "@/lib/kg-core/types";

const NODE_COLORS: Record<string, string> = {
  brand: "#6496ff",
  color: "#ff5733",
  typography: "#64ff96",
  concept: "#888888",
};

const NODE_RADIUS: Record<string, number> = {
  brand: 28,
  color: 20,
  typography: 20,
  concept: 18,
};

interface CanvasProps {
  graph: KnowledgeGraph;
  violatedNodeIds: Set<string>;
  violatedTripleIds: Set<string>;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onClearSelection: () => void;
  onDoubleClickCanvas: () => void;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type?: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  predicate: string;
}

export function Canvas({
  graph,
  violatedNodeIds,
  violatedTripleIds,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onClearSelection,
  onDoubleClickCanvas,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);

  const render = useCallback(() => {
    const svg = d3.select(svgRef.current);
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Click on background to clear selection
    svg.on("click", (event) => {
      if (event.target === svgRef.current) onClearSelection();
    });

    svg.on("dblclick.zoom", null);
    svg.on("dblclick", (event) => {
      if (event.target === svgRef.current) onDoubleClickCanvas();
    });

    // Data
    const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const links: SimLink[] = graph.triples.map((t) => ({
      id: t.id,
      source: t.subject,
      target: t.object,
      predicate: t.predicate,
    }));

    // Arrow marker
    const defs = g.append("defs");
    defs
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 6")
      .attr("refX", 10)
      .attr("refY", 3)
      .attr("markerWidth", 8)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L10,3 L0,6 Z")
      .attr("fill", "rgba(255,255,255,0.3)");

    defs
      .append("marker")
      .attr("id", "arrow-red")
      .attr("viewBox", "0 0 10 6")
      .attr("refX", 10)
      .attr("refY", 3)
      .attr("markerWidth", 8)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L10,3 L0,6 Z")
      .attr("fill", "rgba(255,100,100,0.6)");

    // Links
    const link = g
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) =>
        violatedTripleIds.has(d.id)
          ? "rgba(255,100,100,0.5)"
          : "rgba(255,255,255,0.2)"
      )
      .attr("stroke-width", (d) =>
        d.id === selectedEdgeId ? 3 : violatedTripleIds.has(d.id) ? 2 : 1.5
      )
      .attr("stroke-dasharray", (d) =>
        violatedTripleIds.has(d.id) ? "6,4" : "none"
      )
      .attr("marker-end", (d) =>
        violatedTripleIds.has(d.id) ? "url(#arrow-red)" : "url(#arrow)"
      )
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onSelectEdge(d.id);
      });

    // Link labels
    const linkLabel = g
      .selectAll<SVGTextElement, SimLink>("text.link-label")
      .data(links)
      .join("text")
      .attr("class", "link-label")
      .attr("text-anchor", "middle")
      .attr("fill", (d) =>
        violatedTripleIds.has(d.id)
          ? "rgba(255,100,100,0.7)"
          : "rgba(255,255,255,0.5)"
      )
      .attr("font-size", 10)
      .text((d) => d.predicate);

    // Nodes
    const node = g
      .selectAll<SVGGElement, SimNode>("g.node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onSelectNode(d.id);
      });

    node
      .append("circle")
      .attr("r", (d) => NODE_RADIUS[d.type ?? "concept"] ?? 18)
      .attr("fill", (d) => {
        const color = NODE_COLORS[d.type ?? "concept"] ?? "#888";
        return `${color}33`;
      })
      .attr("stroke", (d) => {
        if (violatedNodeIds.has(d.id)) return "rgba(255,100,100,0.6)";
        if (d.id === selectedNodeId) return "#fff";
        return `${NODE_COLORS[d.type ?? "concept"] ?? "#888"}99`;
      })
      .attr("stroke-width", (d) =>
        d.id === selectedNodeId ? 3 : violatedNodeIds.has(d.id) ? 2 : 1.5
      )
      .attr("stroke-dasharray", (d) =>
        violatedNodeIds.has(d.id) ? "4,3" : "none"
      );

    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", (d) => (d.type === "brand" ? 11 : 9))
      .attr("font-weight", (d) => (d.type === "brand" ? "bold" : "normal"))
      .text((d) => d.label);

    // Drag
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

    node.call(drag);

    // Simulation
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))
      .on("tick", () => {
        link
          .attr("x1", (d) => (d.source as SimNode).x!)
          .attr("y1", (d) => (d.source as SimNode).y!)
          .attr("x2", (d) => (d.target as SimNode).x!)
          .attr("y2", (d) => (d.target as SimNode).y!);

        linkLabel
          .attr("x", (d) => ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2)
          .attr("y", (d) => ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2 - 8);

        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });

    simulationRef.current = simulation;
  }, [
    graph,
    violatedNodeIds,
    violatedTripleIds,
    selectedNodeId,
    selectedEdgeId,
    onSelectNode,
    onSelectEdge,
    onClearSelection,
    onDoubleClickCanvas,
  ]);

  useEffect(() => {
    render();
    return () => {
      simulationRef.current?.stop();
    };
  }, [render]);

  return (
    <svg
      ref={svgRef}
      className="h-full w-full bg-background"
      style={{ minHeight: "100%" }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/graph/canvas.tsx
git commit -m "feat: add D3 force graph canvas with zoom, drag, selection, and violation styling"
```

---

## Task 12: Main Page Assembly

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Wire everything together in page.tsx**

Replace `src/app/page.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { Canvas } from "@/components/graph/canvas";
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

export default function Home() {
  const {
    graph,
    filename,
    isDirty,
    load,
    save,
    addNode,
    removeNode,
    updateNode,
    addTriple,
    removeTriple,
    updateTriple,
    addRule,
    removeRule,
  } = useGraph(null);

  const { selection, selectNode, selectEdge, clearSelection } = useSelection();
  const { results, violatedNodeIds, violatedTripleIds, failCount } = useRules(graph);

  const [nodeFormOpen, setNodeFormOpen] = useState(false);
  const [tripleFormOpen, setTripleFormOpen] = useState(false);
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingTripleId, setEditingTripleId] = useState<string | null>(null);

  const handleCreateGraph = useCallback(async () => {
    const name = prompt("그래프 이름을 입력하세요:");
    if (!name) return;
    const res = await fetch("/api/graphs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const { filename: newFile } = await res.json();
    await load(newFile);
  }, [load]);

  const handleEditNode = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
    setNodeFormOpen(true);
  }, []);

  const handleEditTriple = useCallback((tripleId: string) => {
    setEditingTripleId(tripleId);
    setTripleFormOpen(true);
  }, []);

  const editingNode = editingNodeId
    ? graph?.nodes.find((n) => n.id === editingNodeId)
    : undefined;

  const editingTriple = editingTripleId
    ? graph?.triples.find((t) => t.id === editingTripleId)
    : undefined;

  if (!graph) {
    return (
      <div className="flex h-screen">
        <Sidebar
          currentFile={null}
          onSelectFile={load}
          onCreateGraph={handleCreateGraph}
          validationResults={[]}
          onAddRule={() => {}}
        />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">
            좌측에서 그래프를 선택하거나 새로 만드세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        currentFile={filename}
        onSelectFile={load}
        onCreateGraph={handleCreateGraph}
        validationResults={results}
        onAddRule={() => setRuleFormOpen(true)}
      />

      <div className="relative flex-1">
        {/* Top actions */}
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setNodeFormOpen(true)}>
            + 노드
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTripleFormOpen(true)}>
            + 트리플
          </Button>
          {isDirty && (
            <Button size="sm" onClick={save}>
              저장
            </Button>
          )}
        </div>

        {/* Violation banner */}
        {failCount > 0 && (
          <div className="absolute bottom-3 left-3 z-10">
            <Alert variant="destructive" className="w-auto">
              <AlertDescription className="text-xs">
                ⚠ 규칙 위반 {failCount}건
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Canvas
          graph={graph}
          violatedNodeIds={violatedNodeIds}
          violatedTripleIds={violatedTripleIds}
          selectedNodeId={selection?.type === "node" ? selection.id : null}
          selectedEdgeId={selection?.type === "edge" ? selection.id : null}
          onSelectNode={selectNode}
          onSelectEdge={selectEdge}
          onClearSelection={clearSelection}
          onDoubleClickCanvas={() => setNodeFormOpen(true)}
        />
      </div>

      <DetailPanel
        graph={graph}
        selectedNodeId={selection?.type === "node" ? selection.id : null}
        selectedEdgeId={selection?.type === "edge" ? selection.id : null}
        validationResults={results}
        onEditNode={handleEditNode}
        onDeleteNode={(id) => {
          removeNode(id);
          clearSelection();
        }}
        onEditTriple={handleEditTriple}
        onDeleteTriple={(id) => {
          removeTriple(id);
          clearSelection();
        }}
      />

      {/* Dialogs */}
      <NodeForm
        open={nodeFormOpen}
        onClose={() => {
          setNodeFormOpen(false);
          setEditingNodeId(null);
        }}
        onSubmit={(data) => {
          if (editingNodeId) {
            updateNode(editingNodeId, data);
          } else {
            addNode(data);
          }
        }}
        initial={editingNode ? { label: editingNode.label, type: editingNode.type } : undefined}
      />

      <TripleForm
        open={tripleFormOpen}
        onClose={() => {
          setTripleFormOpen(false);
          setEditingTripleId(null);
        }}
        onSubmit={(data) => {
          if (editingTripleId) {
            updateTriple(editingTripleId, data);
          } else {
            addTriple(data);
          }
        }}
        nodes={graph.nodes}
        initial={
          editingTriple
            ? {
                subject: editingTriple.subject,
                predicate: editingTriple.predicate,
                object: editingTriple.object,
              }
            : undefined
        }
      />

      <RuleForm
        open={ruleFormOpen}
        onClose={() => setRuleFormOpen(false)}
        onSubmit={addRule}
        graph={graph}
      />
    </div>
  );
}
```

- [ ] **Step 2: Start dev server and verify**

```bash
pnpm dev
```

Open http://localhost:3000. Verify:
1. Sidebar shows "브랜드A" graph file
2. Click it — D3 graph renders with 4 nodes and 3 edges
3. Click a node — detail panel shows info
4. "+ 노드" — dialog opens, can add a node
5. "+ 트리플" — dialog opens, can create S-P-O
6. "+ 규칙 추가" — condition builder works, FOL preview shows

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble main page with 3-panel layout, all forms, and rule validation"
```

---

## Task 13: Final Verification and Polish

**Files:**
- Modify: various (as needed)

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 2: Verify full workflow end-to-end**

1. Create new graph ("테스트브랜드")
2. Add nodes: brand, color, typography, concept types
3. Add triples connecting them
4. Add a must_have rule
5. Verify rule passes (green in sidebar)
6. Delete the required triple
7. Verify rule fails (red in sidebar, violation in detail panel)
8. Save — file persists in data/
9. Reload page — data is preserved

- [ ] **Step 3: Fix any issues found during verification**

Address any UI issues, type errors, or broken interactions.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: KnowledgeView MVP complete — SPO triple editor with D3 graph and FOL rules"
```
