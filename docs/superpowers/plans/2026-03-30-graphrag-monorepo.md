# GraphRAG 모노레포 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** KnowledgeView를 Turborepo 모노레포로 전환하고, GraphRAG 파이프라인을 `packages/graph-rag` + `apps/rag-api`로 구축한다.

**Architecture:** `kg-core`(순수 타입/로직)를 공유 패키지로 추출하고, `graph-rag`(엔티티 추출 → N홉 탐색 → 자연어 변환)를 그 위에 구축한다. `rag-api`는 graph-rag를 Next.js Route Handler로 감싸는 얇은 HTTP 레이어다.

**Tech Stack:** Turborepo, pnpm workspaces, Next.js 16, AI SDK v6, AI Gateway, Vitest

**Spec:** `docs/superpowers/specs/2026-03-30-graphrag-monorepo-design.md`

---

## File Map

### 루트 (새로 생성)
- `pnpm-workspace.yaml` — 워크스페이스 정의
- `turbo.json` — 태스크 파이프라인
- `package.json` — 루트 (scripts, devDependencies만)

### packages/kg-core/ (현재 src/lib/kg-core 추출)
- `package.json`
- `tsconfig.json`
- `src/types.ts` — 기존 그대로
- `src/operations.ts` — 기존 그대로
- `src/validator.ts` — 기존 그대로
- `src/serializer.ts` — 기존 그대로
- `src/index.ts` — barrel export
- `src/__tests__/serializer.test.ts` — 기존 테스트 이동
- `src/__tests__/operations.test.ts` — 새 테스트
- `src/__tests__/validator.test.ts` — 새 테스트
- `vitest.config.ts`

### packages/graph-rag/ (새로 생성)
- `package.json`
- `tsconfig.json`
- `src/types.ts` — ExtractionResult, SubGraph, PipelineResult 타입
- `src/extractor.ts` — 엔티티 추출 (키워드 + LLM)
- `src/traverser.ts` — BFS N홉 탐색
- `src/context-builder.ts` — 서브그래프 → 자연어 변환
- `src/index.ts` — 파이프라인 통합 함수 + barrel export
- `src/__tests__/extractor.test.ts`
- `src/__tests__/traverser.test.ts`
- `src/__tests__/context-builder.test.ts`
- `src/__tests__/pipeline.test.ts` — 통합 테스트
- `src/__tests__/fixtures.ts` — 테스트용 그래프 데이터
- `vitest.config.ts`

### apps/editor/ (현재 루트의 src/ 이동)
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `src/` — 현재 src/ 전체 이동 (kg-core 제외)
- `vitest.config.ts`

### apps/rag-api/ (새로 생성)
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `src/app/layout.tsx`
- `src/app/api/query/route.ts`
- `src/app/api/context/route.ts`
- `src/lib/graph-loader.ts` — .kg.json 파일 로드
- `src/__tests__/context-route.test.ts`
- `vitest.config.ts`

---

## Task 1: Turborepo 루트 설정

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Modify: `package.json` (루트로 전환)

- [ ] **Step 1: pnpm-workspace.yaml 생성**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 2: turbo.json 생성**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 3: 루트 package.json 전환**

기존 `package.json`을 루트 워크스페이스용으로 교체:

```json
{
  "name": "@knowledgeview/root",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2",
    "typescript": "^5"
  },
  "packageManager": "pnpm@10.7.1"
}
```

- [ ] **Step 4: turbo 설치 확인**

Run: `pnpm install`
Expected: turbo가 설치되고 node_modules가 생성됨

- [ ] **Step 5: 커밋**

```bash
git add pnpm-workspace.yaml turbo.json package.json
git commit -m "chore: initialize Turborepo monorepo root"
```

---

## Task 2: kg-core 패키지 추출

**Files:**
- Create: `packages/kg-core/package.json`
- Create: `packages/kg-core/tsconfig.json`
- Create: `packages/kg-core/vitest.config.ts`
- Create: `packages/kg-core/src/index.ts`
- Move: `src/lib/kg-core/types.ts` → `packages/kg-core/src/types.ts`
- Move: `src/lib/kg-core/operations.ts` → `packages/kg-core/src/operations.ts`
- Move: `src/lib/kg-core/validator.ts` → `packages/kg-core/src/validator.ts`
- Move: `src/lib/kg-core/serializer.ts` → `packages/kg-core/src/serializer.ts`
- Move: `src/lib/kg-core/__tests__/serializer.test.ts` → `packages/kg-core/src/__tests__/serializer.test.ts`

- [ ] **Step 1: 디렉토리 생성 및 파일 이동**

```bash
mkdir -p packages/kg-core/src/__tests__
cp src/lib/kg-core/types.ts packages/kg-core/src/types.ts
cp src/lib/kg-core/operations.ts packages/kg-core/src/operations.ts
cp src/lib/kg-core/validator.ts packages/kg-core/src/validator.ts
cp src/lib/kg-core/serializer.ts packages/kg-core/src/serializer.ts
cp src/lib/kg-core/__tests__/serializer.test.ts packages/kg-core/src/__tests__/serializer.test.ts
```

- [ ] **Step 2: package.json 생성**

`packages/kg-core/package.json`:
```json
{
  "name": "@knowledgeview/kg-core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^4.1.2"
  }
}
```

- [ ] **Step 3: tsconfig.json 생성**

`packages/kg-core/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: vitest.config.ts 생성**

`packages/kg-core/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

- [ ] **Step 5: barrel export 생성**

`packages/kg-core/src/index.ts`:
```typescript
export type {
  Triple,
  Node,
  RuleCondition,
  Rule,
  KnowledgeGraph,
  ValidationResult,
} from "./types";

export {
  createEmptyGraph,
  addNode,
  removeNode,
  updateNode,
  addTriple,
  removeTriple,
  updateTriple,
  addRule,
  removeRule,
} from "./operations";

export { validate } from "./validator";

export {
  toJSON,
  fromJSON,
  generateId,
  serializeGraphForPrompt,
} from "./serializer";
```

- [ ] **Step 6: 테스트의 import 경로 수정**

`packages/kg-core/src/__tests__/serializer.test.ts`의 import를 수정:

기존:
```typescript
import { serializeGraphForPrompt } from "../serializer";
import type { KnowledgeGraph } from "../types";
```

변경 없음 — 상대 경로이므로 그대로 동작.

- [ ] **Step 7: 테스트 실행**

Run: `cd packages/kg-core && pnpm install && pnpm test`
Expected: serializer.test.ts 3개 테스트 PASS

- [ ] **Step 8: 커밋**

```bash
git add packages/kg-core/
git commit -m "refactor: extract kg-core as shared package"
```

---

## Task 3: kg-core 테스트 보강

**Files:**
- Create: `packages/kg-core/src/__tests__/operations.test.ts`
- Create: `packages/kg-core/src/__tests__/validator.test.ts`

- [ ] **Step 1: operations 테스트 작성**

`packages/kg-core/src/__tests__/operations.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  createEmptyGraph,
  addNode,
  removeNode,
  addTriple,
  removeTriple,
} from "../operations";
import type { Node, Triple } from "../types";

const makeNode = (id: string, label: string, type?: string): Node => ({
  id,
  label,
  type,
});

const makeTriple = (
  id: string,
  subject: string,
  predicate: string,
  object: string
): Triple => ({ id, subject, predicate, object });

describe("createEmptyGraph", () => {
  it("should create a graph with name and empty collections", () => {
    const graph = createEmptyGraph("테스트");
    expect(graph.metadata.name).toBe("테스트");
    expect(graph.nodes).toEqual([]);
    expect(graph.triples).toEqual([]);
    expect(graph.rules).toEqual([]);
  });
});

describe("addNode", () => {
  it("should add a node to the graph", () => {
    const graph = createEmptyGraph("테스트");
    const node = makeNode("n1", "브랜드A", "brand");
    const result = addNode(graph, node);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].label).toBe("브랜드A");
  });

  it("should throw on duplicate node id", () => {
    const graph = createEmptyGraph("테스트");
    const node = makeNode("n1", "브랜드A", "brand");
    const withNode = addNode(graph, node);
    expect(() => addNode(withNode, node)).toThrow("already exists");
  });
});

describe("removeNode", () => {
  it("should remove node and its connected triples", () => {
    let graph = createEmptyGraph("테스트");
    graph = addNode(graph, makeNode("n1", "브랜드A", "brand"));
    graph = addNode(graph, makeNode("n2", "#FF5733", "color"));
    graph = addTriple(graph, makeTriple("t1", "n1", "프라이머리컬러", "n2"));

    const result = removeNode(graph, "n1");
    expect(result.nodes).toHaveLength(1);
    expect(result.triples).toHaveLength(0);
  });
});

describe("addTriple", () => {
  it("should throw if subject node does not exist", () => {
    const graph = createEmptyGraph("테스트");
    expect(() =>
      addTriple(graph, makeTriple("t1", "missing", "관계", "n2"))
    ).toThrow("Subject node");
  });

  it("should throw if object node does not exist", () => {
    let graph = createEmptyGraph("테스트");
    graph = addNode(graph, makeNode("n1", "브랜드A"));
    expect(() =>
      addTriple(graph, makeTriple("t1", "n1", "관계", "missing"))
    ).toThrow("Object node");
  });
});

describe("removeTriple", () => {
  it("should remove only the specified triple", () => {
    let graph = createEmptyGraph("테스트");
    graph = addNode(graph, makeNode("n1", "A"));
    graph = addNode(graph, makeNode("n2", "B"));
    graph = addTriple(graph, makeTriple("t1", "n1", "관계1", "n2"));
    graph = addTriple(graph, makeTriple("t2", "n1", "관계2", "n2"));

    const result = removeTriple(graph, "t1");
    expect(result.triples).toHaveLength(1);
    expect(result.triples[0].id).toBe("t2");
  });
});
```

- [ ] **Step 2: validator 테스트 작성**

`packages/kg-core/src/__tests__/validator.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { validate } from "../validator";
import type { KnowledgeGraph } from "../types";

function makeGraph(overrides: Partial<KnowledgeGraph> = {}): KnowledgeGraph {
  return {
    metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01" },
    nodes: [],
    triples: [],
    rules: [],
    ...overrides,
  };
}

describe("validate", () => {
  it("should return empty array when no rules exist", () => {
    const graph = makeGraph();
    expect(validate(graph)).toEqual([]);
  });

  it("should pass must_have when relation exists", () => {
    const graph = makeGraph({
      nodes: [
        { id: "n1", label: "브랜드A", type: "brand" },
        { id: "n2", label: "#FF5733", type: "color" },
      ],
      triples: [
        { id: "t1", subject: "n1", predicate: "프라이머리컬러", object: "n2" },
      ],
      rules: [
        {
          id: "r1",
          name: "브랜드는 프라이머리컬러 필요",
          expression: "∀x (brand(x) → ∃y 프라이머리컬러(x, y))",
          type: "constraint",
          condition: {
            nodeType: "brand",
            predicate: "프라이머리컬러",
            operator: "must_have",
          },
        },
      ],
    });

    const results = validate(graph);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("pass");
  });

  it("should fail must_have when relation is missing", () => {
    const graph = makeGraph({
      nodes: [{ id: "n1", label: "브랜드A", type: "brand" }],
      triples: [],
      rules: [
        {
          id: "r1",
          name: "브랜드는 프라이머리컬러 필요",
          expression: "∀x (brand(x) → ∃y 프라이머리컬러(x, y))",
          type: "constraint",
          condition: {
            nodeType: "brand",
            predicate: "프라이머리컬러",
            operator: "must_have",
          },
        },
      ],
    });

    const results = validate(graph);
    expect(results[0].status).toBe("fail");
    expect(results[0].violations).toHaveLength(1);
    expect(results[0].violations[0].nodeId).toBe("n1");
  });

  it("should fail must_not_have when forbidden relation exists", () => {
    const graph = makeGraph({
      nodes: [
        { id: "n1", label: "브랜드A", type: "brand" },
        { id: "n2", label: "Comic Sans", type: "typography" },
      ],
      triples: [
        { id: "t1", subject: "n1", predicate: "금지서체", object: "n2" },
      ],
      rules: [
        {
          id: "r1",
          name: "금지서체 사용 불가",
          expression: "∀x (brand(x) → ¬∃y 금지서체(x, y))",
          type: "constraint",
          condition: {
            nodeType: "brand",
            predicate: "금지서체",
            operator: "must_not_have",
          },
        },
      ],
    });

    const results = validate(graph);
    expect(results[0].status).toBe("fail");
    expect(results[0].violations[0].relatedTripleId).toBe("t1");
  });
});
```

- [ ] **Step 3: 테스트 실행**

Run: `cd packages/kg-core && pnpm test`
Expected: 모든 테스트 PASS (serializer 3 + operations 5 + validator 4 = 12개)

- [ ] **Step 4: 커밋**

```bash
git add packages/kg-core/src/__tests__/
git commit -m "test: add operations and validator tests for kg-core"
```

---

## Task 4: editor 앱 이동

**Files:**
- Create: `apps/editor/package.json`
- Create: `apps/editor/tsconfig.json`
- Create: `apps/editor/next.config.ts`
- Create: `apps/editor/vitest.config.ts`
- Create: `apps/editor/postcss.config.mjs`
- Create: `apps/editor/tailwind.config.mjs`
- Move: `src/` → `apps/editor/src/` (kg-core 제외)
- Move: `data/` → 루트에 유지
- Modify: editor 내 kg-core import를 패키지 참조로 변경

- [ ] **Step 1: 디렉토리 생성 및 파일 복사**

```bash
mkdir -p apps/editor
cp -r src apps/editor/src
rm -rf apps/editor/src/lib/kg-core
cp postcss.config.mjs apps/editor/postcss.config.mjs
cp tailwind.config.mjs apps/editor/tailwind.config.mjs
cp src/app/globals.css apps/editor/src/app/globals.css
```

- [ ] **Step 2: apps/editor/package.json 생성**

```json
{
  "name": "@knowledgeview/editor",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  "dependencies": {
    "@knowledgeview/kg-core": "workspace:*",
    "@ai-sdk/anthropic": "^3.0.64",
    "@ai-sdk/react": "^3.0.143",
    "ai": "^6.0.141",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "d3": "^7.9.0",
    "geist": "^1.7.0",
    "lucide-react": "^1.7.0",
    "next": "16.2.1",
    "radix-ui": "^1.4.3",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "shadcn": "^4.1.1",
    "tailwind-merge": "^3.5.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/d3": "^7.4.3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "eslint-config-prettier": "^10",
    "prettier": "^3",
    "prettier-plugin-tailwindcss": "^0.6",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^4.1.2"
  }
}
```

- [ ] **Step 3: apps/editor/tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: apps/editor/next.config.ts 생성**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@knowledgeview/kg-core"],
};

export default nextConfig;
```

- [ ] **Step 5: apps/editor/vitest.config.ts 생성**

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

- [ ] **Step 6: editor 내 kg-core import 경로를 패키지 참조로 변경**

모든 `@/lib/kg-core/...` import를 `@knowledgeview/kg-core`로 변경한다.

변경 대상 파일들과 변경 내용:

`apps/editor/src/hooks/use-graph.ts`:
```typescript
// 기존: import type { KnowledgeGraph, Node, Triple, Rule } from "@/lib/kg-core/types";
// 변경:
import type { KnowledgeGraph, Node, Triple, Rule } from "@knowledgeview/kg-core";
```

`apps/editor/src/hooks/use-rules.ts`:
```typescript
// 기존: import { validate } from "@/lib/kg-core/validator";
// 기존: import type { ValidationResult } from "@/lib/kg-core/types";
// 변경:
import { validate } from "@knowledgeview/kg-core";
import type { ValidationResult } from "@knowledgeview/kg-core";
```

`apps/editor/src/app/api/chat/route.ts`:
```typescript
// 기존: import { serializeGraphForPrompt } from "@/lib/kg-core/serializer";
// 기존: import type { KnowledgeGraph } from "@/lib/kg-core/types";
// 변경:
import { serializeGraphForPrompt } from "@knowledgeview/kg-core";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";
```

나머지 파일들도 동일 패턴으로 `@/lib/kg-core/*` → `@knowledgeview/kg-core`로 변경.

`grep -r "@/lib/kg-core" apps/editor/src/` 로 모든 대상 파일을 찾아서 변경한다.

- [ ] **Step 7: data/ 디렉토리의 경로 처리**

`apps/editor/src/app/api/graphs/route.ts`와 `apps/editor/src/app/api/graphs/[filename]/route.ts`에서 `DATA_DIR` 경로를 수정:

```typescript
// 기존: const DATA_DIR = path.join(process.cwd(), "data");
// 변경: 모노레포 루트의 data/를 참조
const DATA_DIR = path.join(process.cwd(), "../../data");
```

주의: `process.cwd()`는 `apps/editor/`가 되므로 2단계 상위로 올라가야 한다. 단, `turbo dev`에서는 각 앱 디렉토리에서 실행되므로 이 경로가 맞다.

- [ ] **Step 8: 기존 루트 src/ 정리**

```bash
rm -rf src/
rm -f postcss.config.mjs tailwind.config.mjs next.config.ts vitest.config.ts
rm -f next-env.d.ts
rm -f components.json
```

루트의 tsconfig.json은 유지 (에디터 호환용).

- [ ] **Step 9: pnpm install 및 빌드 확인**

Run: `pnpm install && pnpm build --filter=@knowledgeview/editor`
Expected: 빌드 성공

- [ ] **Step 10: 커밋**

```bash
git add apps/editor/ package.json
git add -u  # 삭제된 파일 반영
git commit -m "refactor: move editor app to apps/editor in monorepo"
```

---

## Task 5: graph-rag 패키지 — 타입 정의 및 테스트 fixture

**Files:**
- Create: `packages/graph-rag/package.json`
- Create: `packages/graph-rag/tsconfig.json`
- Create: `packages/graph-rag/vitest.config.ts`
- Create: `packages/graph-rag/src/types.ts`
- Create: `packages/graph-rag/src/__tests__/fixtures.ts`

- [ ] **Step 1: package.json 생성**

`packages/graph-rag/package.json`:
```json
{
  "name": "@knowledgeview/graph-rag",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@knowledgeview/kg-core": "workspace:*",
    "ai": "^6.0.141"
  },
  "devDependencies": {
    "vitest": "^4.1.2"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

`packages/graph-rag/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: vitest.config.ts 생성**

`packages/graph-rag/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

- [ ] **Step 4: 타입 정의**

`packages/graph-rag/src/types.ts`:
```typescript
import type { Node, Triple } from "@knowledgeview/kg-core";

export interface ExtractionResult {
  entities: {
    nodeId: string;
    label: string;
    matchType: "exact" | "partial" | "semantic";
  }[];
  predicateHints: string[];
  typeHints: string[];
  mode: "keyword" | "llm";
}

export interface SubGraph {
  nodes: Node[];
  triples: Triple[];
  metadata: {
    startNodes: string[];
    depth: number;
    totalHops: number;
  };
}

export interface PipelineOptions {
  depth?: number;
  extractorMode?: "keyword" | "llm";
  maxNodes?: number;
}

export interface PipelineResult {
  context: string;
  subgraph: SubGraph;
  extraction: ExtractionResult;
}
```

- [ ] **Step 5: 테스트 fixture 생성**

`packages/graph-rag/src/__tests__/fixtures.ts`:
```typescript
import type { KnowledgeGraph } from "@knowledgeview/kg-core";

export const BRAND_GRAPH: KnowledgeGraph = {
  metadata: {
    name: "테스트 브랜드",
    created: "2026-01-01",
    updated: "2026-01-01",
  },
  nodes: [
    { id: "brand-a", label: "브랜드A", type: "brand" },
    { id: "color-ff5733", label: "#FF5733", type: "color" },
    { id: "color-333333", label: "#333333", type: "color" },
    { id: "font-pretendard", label: "Pretendard", type: "typography" },
    { id: "tone-warm", label: "따뜻하고 친근한", type: "concept" },
    { id: "brand-b", label: "브랜드B", type: "brand" },
    { id: "font-roboto", label: "Roboto", type: "typography" },
    { id: "tone-cool", label: "차분하고 세련된", type: "concept" },
  ],
  triples: [
    { id: "t1", subject: "brand-a", predicate: "프라이머리컬러", object: "color-ff5733" },
    { id: "t2", subject: "brand-a", predicate: "주서체", object: "font-pretendard" },
    { id: "t3", subject: "brand-a", predicate: "톤앤매너", object: "tone-warm" },
    { id: "t4", subject: "brand-a", predicate: "세컨더리컬러", object: "color-333333" },
    { id: "t5", subject: "brand-b", predicate: "프라이머리컬러", object: "color-333333" },
    { id: "t6", subject: "brand-b", predicate: "주서체", object: "font-roboto" },
    { id: "t7", subject: "brand-b", predicate: "톤앤매너", object: "tone-cool" },
  ],
  rules: [
    {
      id: "r1",
      name: "브랜드는 프라이머리컬러 필요",
      expression: "∀x (brand(x) → ∃y 프라이머리컬러(x, y))",
      type: "constraint",
      condition: {
        nodeType: "brand",
        predicate: "프라이머리컬러",
        operator: "must_have",
      },
    },
  ],
};
```

- [ ] **Step 6: 커밋**

```bash
git add packages/graph-rag/
git commit -m "feat: initialize graph-rag package with types and fixtures"
```

---

## Task 6: graph-rag — extractor (키워드 모드)

**Files:**
- Create: `packages/graph-rag/src/extractor.ts`
- Create: `packages/graph-rag/src/__tests__/extractor.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

`packages/graph-rag/src/__tests__/extractor.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { extractEntities } from "../extractor";
import { BRAND_GRAPH } from "./fixtures";

describe("extractEntities (keyword mode)", () => {
  it("should match exact node label", () => {
    const result = extractEntities(BRAND_GRAPH, "브랜드A의 프라이머리 컬러는?");
    expect(result.mode).toBe("keyword");
    expect(result.entities).toContainEqual(
      expect.objectContaining({ nodeId: "brand-a", matchType: "exact" })
    );
  });

  it("should match predicate keywords", () => {
    const result = extractEntities(BRAND_GRAPH, "브랜드A의 프라이머리컬러는?");
    expect(result.predicateHints).toContain("프라이머리컬러");
  });

  it("should match partial node label", () => {
    const result = extractEntities(BRAND_GRAPH, "Pretendard 서체 정보");
    expect(result.entities).toContainEqual(
      expect.objectContaining({ nodeId: "font-pretendard", matchType: "exact" })
    );
  });

  it("should return empty entities for unrelated question", () => {
    const result = extractEntities(BRAND_GRAPH, "날씨가 어때요?");
    expect(result.entities).toHaveLength(0);
    expect(result.mode).toBe("keyword");
  });

  it("should match multiple entities", () => {
    const result = extractEntities(BRAND_GRAPH, "브랜드A와 브랜드B의 차이점");
    expect(result.entities.length).toBeGreaterThanOrEqual(2);
  });

  it("should detect type hints from question", () => {
    const result = extractEntities(BRAND_GRAPH, "어떤 컬러를 쓰나요?");
    expect(result.typeHints).toContain("color");
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `cd packages/graph-rag && pnpm install && pnpm test`
Expected: FAIL — `extractEntities` 함수가 없음

- [ ] **Step 3: extractor 구현**

`packages/graph-rag/src/extractor.ts`:
```typescript
import type { KnowledgeGraph } from "@knowledgeview/kg-core";
import type { ExtractionResult } from "./types";

const TYPE_KEYWORDS: Record<string, string[]> = {
  brand: ["브랜드", "brand"],
  color: ["컬러", "색상", "색", "color"],
  typography: ["서체", "폰트", "글꼴", "font", "typography"],
  concept: ["컨셉", "톤", "매너", "느낌", "concept"],
};

export function extractEntities(
  graph: KnowledgeGraph,
  question: string
): ExtractionResult {
  const entities: ExtractionResult["entities"] = [];
  const predicateHints: string[] = [];
  const typeHints: string[] = [];
  const questionLower = question.toLowerCase();

  // 1. 노드 label 매칭 (긴 label부터 매칭하여 부분 매칭 방지)
  const sortedNodes = [...graph.nodes].sort(
    (a, b) => b.label.length - a.label.length
  );

  for (const node of sortedNodes) {
    const labelLower = node.label.toLowerCase();
    if (questionLower.includes(labelLower)) {
      entities.push({
        nodeId: node.id,
        label: node.label,
        matchType: "exact",
      });
    }
  }

  // 2. predicate 매칭
  const predicates = [...new Set(graph.triples.map((t) => t.predicate))];
  for (const predicate of predicates) {
    const predicateLower = predicate.toLowerCase();
    // 공백 제거 버전도 매칭 (프라이머리 컬러 → 프라이머리컬러)
    const questionNoSpace = questionLower.replace(/\s+/g, "");
    if (
      questionLower.includes(predicateLower) ||
      questionNoSpace.includes(predicateLower)
    ) {
      predicateHints.push(predicate);
    }
  }

  // 3. 타입 힌트 추출
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (questionLower.includes(keyword.toLowerCase())) {
        typeHints.push(type);
        break;
      }
    }
  }

  return { entities, predicateHints, typeHints, mode: "keyword" };
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `cd packages/graph-rag && pnpm test`
Expected: extractor 테스트 6개 PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/graph-rag/src/extractor.ts packages/graph-rag/src/__tests__/extractor.test.ts
git commit -m "feat(graph-rag): add keyword-based entity extractor"
```

---

## Task 7: graph-rag — traverser (BFS N홉 탐색)

**Files:**
- Create: `packages/graph-rag/src/traverser.ts`
- Create: `packages/graph-rag/src/__tests__/traverser.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

`packages/graph-rag/src/__tests__/traverser.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { traverse } from "../traverser";
import { BRAND_GRAPH } from "./fixtures";

describe("traverse", () => {
  it("should return direct connections at depth 1", () => {
    const result = traverse(BRAND_GRAPH, ["brand-a"], { depth: 1 });

    expect(result.nodes.map((n) => n.id)).toContain("brand-a");
    expect(result.nodes.map((n) => n.id)).toContain("color-ff5733");
    expect(result.nodes.map((n) => n.id)).toContain("font-pretendard");
    expect(result.nodes.map((n) => n.id)).toContain("tone-warm");
    expect(result.triples).toHaveLength(4); // t1, t2, t3, t4
    expect(result.metadata.depth).toBe(1);
  });

  it("should expand to 2 hops", () => {
    // brand-a → color-333333 → brand-b (via 세컨더리컬러, then 프라이머리컬러)
    const result = traverse(BRAND_GRAPH, ["brand-a"], { depth: 2 });

    expect(result.nodes.map((n) => n.id)).toContain("brand-b");
    expect(result.metadata.depth).toBe(2);
  });

  it("should traverse bidirectionally", () => {
    // color-333333 is object of both brand-a(세컨더리컬러) and brand-b(프라이머리컬러)
    const result = traverse(BRAND_GRAPH, ["color-333333"], { depth: 1 });

    expect(result.nodes.map((n) => n.id)).toContain("brand-a");
    expect(result.nodes.map((n) => n.id)).toContain("brand-b");
  });

  it("should respect maxNodes limit", () => {
    const result = traverse(BRAND_GRAPH, ["brand-a"], {
      depth: 3,
      maxNodes: 3,
    });

    expect(result.nodes.length).toBeLessThanOrEqual(3);
  });

  it("should prioritize predicate hint triples", () => {
    const result = traverse(BRAND_GRAPH, ["brand-a"], {
      depth: 1,
      predicateHints: ["프라이머리컬러"],
    });

    // 프라이머리컬러 트리플이 포함되어야 함
    expect(result.triples.some((t) => t.predicate === "프라이머리컬러")).toBe(true);
  });

  it("should include start nodes even if no connections", () => {
    const result = traverse(BRAND_GRAPH, ["tone-warm"], { depth: 0 });
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe("tone-warm");
  });

  it("should handle non-existent start node gracefully", () => {
    const result = traverse(BRAND_GRAPH, ["nonexistent"], { depth: 1 });
    expect(result.nodes).toHaveLength(0);
    expect(result.triples).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `cd packages/graph-rag && pnpm test -- --testPathPattern=traverser`
Expected: FAIL — `traverse` 함수가 없음

- [ ] **Step 3: traverser 구현**

`packages/graph-rag/src/traverser.ts`:
```typescript
import type { KnowledgeGraph, Triple } from "@knowledgeview/kg-core";
import type { SubGraph } from "./types";

interface TraverseOptions {
  depth?: number;
  maxNodes?: number;
  predicateHints?: string[];
}

export function traverse(
  graph: KnowledgeGraph,
  startNodeIds: string[],
  options: TraverseOptions = {}
): SubGraph {
  const { depth = 2, maxNodes = 50, predicateHints = [] } = options;

  const visitedNodeIds = new Set<string>();
  const collectedTripleIds = new Set<string>();
  const queue: { nodeId: string; currentDepth: number }[] = [];

  // 시작 노드 초기화
  for (const nodeId of startNodeIds) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (node) {
      visitedNodeIds.add(nodeId);
      queue.push({ nodeId, currentDepth: 0 });
    }
  }

  let maxHop = 0;

  while (queue.length > 0) {
    const { nodeId, currentDepth } = queue.shift()!;

    if (currentDepth >= depth) continue;
    if (visitedNodeIds.size >= maxNodes) break;

    // 해당 노드와 연결된 트리플 찾기 (양방향)
    const connectedTriples = graph.triples.filter(
      (t) => t.subject === nodeId || t.object === nodeId
    );

    // predicateHint가 있으면 해당 트리플 우선 정렬
    const sorted = sortByPredicateHints(connectedTriples, predicateHints);

    for (const triple of sorted) {
      collectedTripleIds.add(triple.id);

      const neighborId =
        triple.subject === nodeId ? triple.object : triple.subject;

      if (!visitedNodeIds.has(neighborId) && visitedNodeIds.size < maxNodes) {
        visitedNodeIds.add(neighborId);
        const nextDepth = currentDepth + 1;
        if (nextDepth > maxHop) maxHop = nextDepth;
        queue.push({ nodeId: neighborId, currentDepth: nextDepth });
      }
    }
  }

  const nodes = graph.nodes.filter((n) => visitedNodeIds.has(n.id));
  const triples = graph.triples.filter((t) => collectedTripleIds.has(t.id));

  return {
    nodes,
    triples,
    metadata: {
      startNodes: startNodeIds.filter((id) => visitedNodeIds.has(id)),
      depth,
      totalHops: maxHop,
    },
  };
}

function sortByPredicateHints(
  triples: Triple[],
  hints: string[]
): Triple[] {
  if (hints.length === 0) return triples;

  const hintSet = new Set(hints);
  return [...triples].sort((a, b) => {
    const aHint = hintSet.has(a.predicate) ? 0 : 1;
    const bHint = hintSet.has(b.predicate) ? 0 : 1;
    return aHint - bHint;
  });
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `cd packages/graph-rag && pnpm test -- --testPathPattern=traverser`
Expected: traverser 테스트 7개 PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/graph-rag/src/traverser.ts packages/graph-rag/src/__tests__/traverser.test.ts
git commit -m "feat(graph-rag): add BFS N-hop subgraph traverser"
```

---

## Task 8: graph-rag — context-builder (자연어 변환)

**Files:**
- Create: `packages/graph-rag/src/context-builder.ts`
- Create: `packages/graph-rag/src/__tests__/context-builder.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

`packages/graph-rag/src/__tests__/context-builder.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { buildContext } from "../context-builder";
import type { SubGraph } from "../types";

const subgraph: SubGraph = {
  nodes: [
    { id: "brand-a", label: "브랜드A", type: "brand" },
    { id: "color-ff5733", label: "#FF5733", type: "color" },
    { id: "font-pretendard", label: "Pretendard", type: "typography" },
  ],
  triples: [
    { id: "t1", subject: "brand-a", predicate: "프라이머리컬러", object: "color-ff5733" },
    { id: "t2", subject: "brand-a", predicate: "주서체", object: "font-pretendard" },
  ],
  metadata: { startNodes: ["brand-a"], depth: 1, totalHops: 1 },
};

describe("buildContext", () => {
  it("should produce a markdown context string", () => {
    const result = buildContext(subgraph);
    expect(result).toContain("## 지식 그래프 컨텍스트");
    expect(result).toContain("브랜드A");
  });

  it("should list entities with their types", () => {
    const result = buildContext(subgraph);
    expect(result).toContain("브랜드A (brand)");
    expect(result).toContain("#FF5733 (color)");
    expect(result).toContain("Pretendard (typography)");
  });

  it("should convert triples to natural language sentences", () => {
    const result = buildContext(subgraph);
    expect(result).toContain("브랜드A");
    expect(result).toContain("프라이머리컬러");
    expect(result).toContain("#FF5733");
  });

  it("should handle empty subgraph", () => {
    const empty: SubGraph = {
      nodes: [],
      triples: [],
      metadata: { startNodes: [], depth: 0, totalHops: 0 },
    };
    const result = buildContext(empty);
    expect(result).toContain("관련 정보를 찾을 수 없습니다");
  });

  it("should include validation results when graph is provided", () => {
    const result = buildContext(subgraph, {
      rules: [
        {
          id: "r1",
          name: "브랜드는 프라이머리컬러 필요",
          expression: "∀x",
          type: "constraint",
          condition: {
            nodeType: "brand",
            predicate: "프라이머리컬러",
            operator: "must_have" as const,
          },
        },
      ],
    });
    expect(result).toContain("규칙 검증");
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `cd packages/graph-rag && pnpm test -- --testPathPattern=context-builder`
Expected: FAIL — `buildContext` 함수가 없음

- [ ] **Step 3: context-builder 구현**

`packages/graph-rag/src/context-builder.ts`:
```typescript
import { validate } from "@knowledgeview/kg-core";
import type { KnowledgeGraph, Rule } from "@knowledgeview/kg-core";
import type { SubGraph } from "./types";

interface BuildContextOptions {
  rules?: Rule[];
}

export function buildContext(
  subgraph: SubGraph,
  options: BuildContextOptions = {}
): string {
  if (subgraph.nodes.length === 0) {
    return "## 지식 그래프 컨텍스트\n\n관련 정보를 찾을 수 없습니다.";
  }

  const nodeMap = new Map(subgraph.nodes.map((n) => [n.id, n]));

  // 엔티티 섹션
  const entityLines = subgraph.nodes.map((n) => {
    const type = n.type ? ` (${n.type})` : "";
    return `- ${n.label}${type}`;
  });

  // 관계 섹션 — 자연어 문장
  const relationLines = subgraph.triples.map((t) => {
    const subject = nodeMap.get(t.subject)?.label ?? t.subject;
    const object = nodeMap.get(t.object)?.label ?? t.object;
    return `- ${subject}의 ${t.predicate}은(는) ${object}이다.`;
  });

  const sections: string[] = [
    "## 지식 그래프 컨텍스트",
    "",
    "다음은 질문과 관련된 온톨로지 정보입니다:",
    "",
    "### 엔티티",
    ...entityLines,
    "",
    "### 관계",
    ...(relationLines.length > 0 ? relationLines : ["(관계 없음)"]),
  ];

  // 규칙 검증 섹션
  if (options.rules && options.rules.length > 0) {
    const miniGraph: KnowledgeGraph = {
      metadata: { name: "", created: "", updated: "" },
      nodes: subgraph.nodes,
      triples: subgraph.triples,
      rules: options.rules,
    };

    const results = validate(miniGraph);
    const failures = results.filter((r) => r.status === "fail");

    sections.push("", "### 규칙 검증");

    if (failures.length === 0) {
      sections.push("- 모든 규칙을 통과함.");
    } else {
      for (const failure of failures) {
        for (const v of failure.violations) {
          sections.push(
            `- 주의: ${failure.ruleName} — ${v.message}`
          );
        }
      }
    }
  }

  return sections.join("\n");
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `cd packages/graph-rag && pnpm test -- --testPathPattern=context-builder`
Expected: context-builder 테스트 5개 PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/graph-rag/src/context-builder.ts packages/graph-rag/src/__tests__/context-builder.test.ts
git commit -m "feat(graph-rag): add subgraph to natural language context builder"
```

---

## Task 9: graph-rag — 파이프라인 통합 및 barrel export

**Files:**
- Create: `packages/graph-rag/src/index.ts`
- Create: `packages/graph-rag/src/__tests__/pipeline.test.ts`

- [ ] **Step 1: 통합 테스트 먼저 작성**

`packages/graph-rag/src/__tests__/pipeline.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { runPipeline } from "../index";
import { BRAND_GRAPH } from "./fixtures";

describe("runPipeline", () => {
  it("should extract context for a direct question", () => {
    const result = runPipeline(
      BRAND_GRAPH,
      "브랜드A의 프라이머리컬러는?"
    );

    expect(result.extraction.entities.length).toBeGreaterThan(0);
    expect(result.subgraph.nodes.length).toBeGreaterThan(0);
    expect(result.context).toContain("브랜드A");
    expect(result.context).toContain("#FF5733");
  });

  it("should include rule validation in context", () => {
    const result = runPipeline(
      BRAND_GRAPH,
      "브랜드A의 정보를 알려줘"
    );

    expect(result.context).toContain("규칙 검증");
  });

  it("should respect depth option", () => {
    const shallow = runPipeline(BRAND_GRAPH, "브랜드A", { depth: 1 });
    const deep = runPipeline(BRAND_GRAPH, "브랜드A", { depth: 3 });

    expect(deep.subgraph.nodes.length).toBeGreaterThanOrEqual(
      shallow.subgraph.nodes.length
    );
  });

  it("should return empty context for unrelated question", () => {
    const result = runPipeline(BRAND_GRAPH, "날씨가 어때요?");
    expect(result.extraction.entities).toHaveLength(0);
    expect(result.context).toContain("관련 정보를 찾을 수 없습니다");
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `cd packages/graph-rag && pnpm test -- --testPathPattern=pipeline`
Expected: FAIL — `runPipeline` 함수가 없음

- [ ] **Step 3: index.ts (파이프라인 + barrel export) 구현**

`packages/graph-rag/src/index.ts`:
```typescript
import type { KnowledgeGraph } from "@knowledgeview/kg-core";
import { extractEntities } from "./extractor";
import { traverse } from "./traverser";
import { buildContext } from "./context-builder";
import type { PipelineOptions, PipelineResult } from "./types";

export function runPipeline(
  graph: KnowledgeGraph,
  question: string,
  options: PipelineOptions = {}
): PipelineResult {
  const { depth = 2, extractorMode = "keyword", maxNodes = 50 } = options;

  // 1. 엔티티 추출
  const extraction = extractEntities(graph, question);

  // 2. 서브그래프 탐색
  const startNodeIds = extraction.entities.map((e) => e.nodeId);
  const subgraph = traverse(graph, startNodeIds, {
    depth,
    maxNodes,
    predicateHints: extraction.predicateHints,
  });

  // 3. 자연어 컨텍스트 변환
  const context = buildContext(subgraph, { rules: graph.rules });

  return { context, subgraph, extraction };
}

// Barrel exports
export { extractEntities } from "./extractor";
export { traverse } from "./traverser";
export { buildContext } from "./context-builder";
export type {
  ExtractionResult,
  SubGraph,
  PipelineOptions,
  PipelineResult,
} from "./types";
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `cd packages/graph-rag && pnpm test`
Expected: 모든 테스트 PASS (extractor 6 + traverser 7 + context-builder 5 + pipeline 4 = 22개)

- [ ] **Step 5: 커밋**

```bash
git add packages/graph-rag/src/index.ts packages/graph-rag/src/__tests__/pipeline.test.ts
git commit -m "feat(graph-rag): add pipeline integration and barrel exports"
```

---

## Task 10: rag-api 앱 생성

**Files:**
- Create: `apps/rag-api/package.json`
- Create: `apps/rag-api/tsconfig.json`
- Create: `apps/rag-api/next.config.ts`
- Create: `apps/rag-api/src/app/layout.tsx`
- Create: `apps/rag-api/src/lib/graph-loader.ts`

- [ ] **Step 1: package.json 생성**

`apps/rag-api/package.json`:
```json
{
  "name": "@knowledgeview/rag-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  "dependencies": {
    "@knowledgeview/kg-core": "workspace:*",
    "@knowledgeview/graph-rag": "workspace:*",
    "ai": "^6.0.141",
    "next": "16.2.1",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "typescript": "^5",
    "vitest": "^4.1.2"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

`apps/rag-api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: next.config.ts 생성**

`apps/rag-api/next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@knowledgeview/kg-core",
    "@knowledgeview/graph-rag",
  ],
};

export default nextConfig;
```

- [ ] **Step 4: layout.tsx 생성 (최소)**

`apps/rag-api/src/app/layout.tsx`:
```tsx
export const metadata = {
  title: "KnowledgeView RAG API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: graph-loader 유틸 생성**

`apps/rag-api/src/lib/graph-loader.ts`:
```typescript
import fs from "node:fs/promises";
import path from "node:path";
import { fromJSON } from "@knowledgeview/kg-core";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";

const DATA_DIR = path.join(process.cwd(), "../../data");

export async function loadGraph(filename: string): Promise<KnowledgeGraph> {
  const safeName = filename.endsWith(".kg.json")
    ? filename
    : `${filename}.kg.json`;

  const filepath = path.join(DATA_DIR, safeName);
  const content = await fs.readFile(filepath, "utf-8");
  return fromJSON(content);
}
```

- [ ] **Step 6: 커밋**

```bash
git add apps/rag-api/
git commit -m "feat: initialize rag-api app skeleton"
```

---

## Task 11: rag-api — /api/context 엔드포인트

**Files:**
- Create: `apps/rag-api/src/app/api/context/route.ts`
- Create: `apps/rag-api/vitest.config.ts`
- Create: `apps/rag-api/src/__tests__/context-route.test.ts`

- [ ] **Step 1: vitest.config.ts 생성**

`apps/rag-api/vitest.config.ts`:
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

- [ ] **Step 2: /api/context Route Handler 구현**

`apps/rag-api/src/app/api/context/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { runPipeline } from "@knowledgeview/graph-rag";
import { loadGraph } from "@/lib/graph-loader";

export async function POST(req: Request) {
  const body = await req.json();
  const { question, graphFile, options } = body;

  if (!question || !graphFile) {
    return NextResponse.json(
      { error: "question and graphFile are required" },
      { status: 400 }
    );
  }

  const graph = await loadGraph(graphFile);
  const result = runPipeline(graph, question, options);

  return NextResponse.json({
    context: result.context,
    subgraph: {
      nodes: result.subgraph.nodes,
      triples: result.subgraph.triples,
    },
    extraction: result.extraction,
    metadata: {
      depth: result.subgraph.metadata.depth,
      nodeCount: result.subgraph.nodes.length,
      tripleCount: result.subgraph.triples.length,
    },
  });
}
```

- [ ] **Step 3: 테스트 작성**

`apps/rag-api/src/__tests__/context-route.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { runPipeline } from "@knowledgeview/graph-rag";
import { BRAND_GRAPH } from "@knowledgeview/graph-rag/src/__tests__/fixtures";

// Route Handler를 직접 테스트하기 어려우므로,
// 핵심 로직인 runPipeline + loadGraph 조합을 검증한다.
describe("context endpoint logic", () => {
  it("should produce valid response shape", () => {
    const result = runPipeline(BRAND_GRAPH, "브랜드A의 프라이머리컬러는?");

    // API 응답 형태 검증
    const response = {
      context: result.context,
      subgraph: {
        nodes: result.subgraph.nodes,
        triples: result.subgraph.triples,
      },
      extraction: result.extraction,
      metadata: {
        depth: result.subgraph.metadata.depth,
        nodeCount: result.subgraph.nodes.length,
        tripleCount: result.subgraph.triples.length,
      },
    };

    expect(response.context).toContain("브랜드A");
    expect(response.subgraph.nodes.length).toBeGreaterThan(0);
    expect(response.metadata.nodeCount).toBeGreaterThan(0);
    expect(response.extraction.mode).toBe("keyword");
  });
});
```

- [ ] **Step 4: 테스트 실행**

Run: `cd apps/rag-api && pnpm install && pnpm test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/rag-api/
git commit -m "feat(rag-api): add /api/context endpoint"
```

---

## Task 12: rag-api — /api/query 엔드포인트 (AI 스트리밍)

**Files:**
- Create: `apps/rag-api/src/app/api/query/route.ts`

- [ ] **Step 1: /api/query Route Handler 구현**

`apps/rag-api/src/app/api/query/route.ts`:
```typescript
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { runPipeline } from "@knowledgeview/graph-rag";
import { loadGraph } from "@/lib/graph-loader";

const SYSTEM_PROMPT = `당신은 브랜드 온톨로지 전문가입니다.
아래 지식 그래프 컨텍스트를 기반으로 질문에 답하세요.
컨텍스트에 없는 정보는 추측하지 마세요.
한국어로 답변합니다.`;

export async function POST(req: Request) {
  const body = await req.json();
  const { question, graphFile, options, messages } = body as {
    question: string;
    graphFile: string;
    options?: { depth?: number; model?: string };
    messages?: UIMessage[];
  };

  if (!question || !graphFile) {
    return new Response(
      JSON.stringify({ error: "question and graphFile are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const graph = await loadGraph(graphFile);
  const { context } = runPipeline(graph, question, options);

  const model = options?.model ?? "anthropic/claude-sonnet-4.6";

  const chatMessages = messages
    ? await convertToModelMessages(messages)
    : [{ role: "user" as const, content: question }];

  const result = streamText({
    model,
    system: `${SYSTEM_PROMPT}\n\n${context}`,
    messages: chatMessages,
  });

  return result.toUIMessageStreamResponse();
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/rag-api/src/app/api/query/route.ts
git commit -m "feat(rag-api): add /api/query streaming endpoint"
```

Note: /api/query는 AI Gateway 호출이 필요하므로 자동화된 단위 테스트가 어렵다. `vercel env pull`로 OIDC 토큰을 설정한 후 수동으로 `curl` 테스트하거나, 개발 서버에서 확인한다.

---

## Task 13: 전체 모노레포 통합 검증

**Files:**
- 기존 파일들 수정 없음 — 빌드 및 테스트 실행만

- [ ] **Step 1: 루트에서 전체 install**

Run: `pnpm install`
Expected: 모든 워크스페이스가 연결됨

- [ ] **Step 2: 전체 테스트 실행**

Run: `pnpm test`
Expected:
- `@knowledgeview/kg-core`: 12개 테스트 PASS
- `@knowledgeview/graph-rag`: 22개 테스트 PASS
- `@knowledgeview/rag-api`: 1개 테스트 PASS
- `@knowledgeview/editor`: 기존 테스트 PASS

- [ ] **Step 3: 전체 빌드**

Run: `pnpm build`
Expected: editor와 rag-api 모두 빌드 성공

- [ ] **Step 4: editor 개발 서버 확인**

Run: `pnpm dev --filter=@knowledgeview/editor`
Expected: localhost:3000에서 기존 에디터가 정상 동작

- [ ] **Step 5: rag-api 개발 서버 확인**

Run: `pnpm dev --filter=@knowledgeview/rag-api`

수동 테스트:
```bash
curl -X POST http://localhost:3001/api/context \
  -H "Content-Type: application/json" \
  -d '{"question": "브랜드A의 프라이머리컬러는?", "graphFile": "brand-a"}'
```

Expected: 서브그래프와 자연어 컨텍스트가 포함된 JSON 응답

- [ ] **Step 6: 최종 커밋**

```bash
git add -A
git commit -m "chore: verify monorepo integration — all tests pass"
```
