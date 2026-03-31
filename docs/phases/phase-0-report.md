# Phase 0: TypeRegistry 도입

> **세션간 통신 문서** — 어떤 세션이든 이 파일을 읽고 현재 진행 상태를 파악한 뒤, 작업 후 반드시 업데이트할 것.

## 상태: NOT STARTED

| 항목 | 상태 | 담당 세션 | 완료일 |
|------|------|-----------|--------|
| Task 1: 타입 정의 | NOT STARTED | - | - |
| Task 2: operations 확장 | NOT STARTED | - | - |
| Task 3: serializer 확장 | NOT STARTED | - | - |
| Task 4: validator 확장 | NOT STARTED | - | - |
| Task 5: RAG 스키마 주입 | NOT STARTED | - | - |
| Task 6: canvas-types 동적 읽기 | NOT STARTED | - | - |
| Task 7: Combobox 교체 | NOT STARTED | - | - |
| Task 8: 테스트 | NOT STARTED | - | - |
| Task 9: 데이터 마이그레이션 | NOT STARTED | - | - |

---

## 설계 소스

- 온톨로지 설계: `docs/specs/ontology-design.md`
- CEO Plan: `~/.gstack/projects/knowledgeview/ceo-plans/2026-03-31-living-brand-guidelines.md`
- Eng Review Test Plan: `~/.gstack/projects/knowledgeview/plusx-main-eng-review-test-plan-20260331-132534.md`

---

## Task 1: 타입 정의 (`kg-core/src/types.ts`)

### 현재 상태

```typescript
// types.ts — 현재 (40줄)
export interface Triple { id, subject, predicate, object }
export interface Node { id, label, type? }
export interface RuleCondition { nodeType, predicate, operator, conflictPredicate? }
export interface Rule { id, name, expression, type, condition }
export interface KnowledgeGraph { metadata, nodes[], triples[], rules[] }
export interface ValidationResult { ruleId, ruleName, status, violations[] }
```

### 목표

기존 인터페이스를 확장하고, 새 타입을 추가한다.

#### 새로 추가할 타입

```typescript
// --- Semantic Layer: 스키마 정의 ---

export interface PropertyDef {
    key: string;
    displayName: string;
    valueType: "string" | "number" | "boolean" | "date" | "url" | "enum";
    required?: boolean;
    enumValues?: string[];
    description?: string;
}

export interface NodeType {
    type: string;                  // kebab-case 식별자
    displayName: string;           // UI 표시명
    description: string;           // RAG 컨텍스트용 서술
    properties: PropertyDef[];
    visual?: {
        color?: string;
        size?: number;
        icon?: string;
    };
}

export interface LinkType {
    predicate: string;             // kebab-case 식별자
    displayName: string;
    description?: string;
    sourceTypes: string[];         // 빈 배열 = 모두 허용
    targetTypes: string[];
    cardinality: "1:1" | "1:N" | "N:1" | "N:N";
    inverseDisplayName?: string;
}

export interface TypeRegistry {
    nodeTypes: NodeType[];
    linkTypes: LinkType[];
}

export interface TripleMetadata {
    confidence?: number;           // 0-1
    source?: string;               // "manual" | "ai-extracted" | "imported"
    createdAt?: string;
    note?: string;
}
```

#### 기존 타입 변경

```typescript
// Node: type을 필수로, props 추가
export interface Node {
    id: string;
    label: string;
    type: string;                  // optional → required
    props?: Record<string, unknown>;  // NEW
}

// Triple: metadata 추가
export interface Triple {
    id: string;
    subject: string;
    predicate: string;
    object: string;
    metadata?: TripleMetadata;     // NEW
}

// KnowledgeGraph: schema 추가, metadata 확장
export interface KnowledgeGraph {
    metadata: {
        name: string;
        created: string;
        updated: string;
        schemaVersion?: string;    // NEW: "2.0"
        systemPrompt?: string;
    };
    schema?: TypeRegistry;         // NEW: optional for backward compat
    nodes: Node[];
    triples: Triple[];
    rules: Rule[];
}
```

### 주의사항

- `Node.type`이 `optional → required`로 변경됨 — 기존 코드에서 `type?`에 의존하는 곳 모두 확인 필요
- `KnowledgeGraph.schema`는 optional — 하위 호환 유지
- `ValidationResult`와 `Rule`/`RuleCondition`은 변경 없음

### 영향 범위

| 파일 | 영향 | 이유 |
|------|------|------|
| `operations.ts` | 중간 | `addNode`의 type 처리 로직 변경 (optional → required) |
| `serializer.ts` | 중간 | `fromJSON`에서 schema 파싱, `serializeGraphForPrompt`에 스키마 포함 |
| `validator.ts` | 중간 | 스키마 기반 검증 추가 (LinkType 제약 등) |
| `normalize-type.ts` | 없음 | 변경 불필요 |
| `index.ts` | 작음 | 새 타입 re-export |
| `__tests__/*.test.ts` | 중간 | 기존 테스트의 Node 생성 부분에 type 필수 추가 |
| `apps/editor/**` | 중간 | useGraph, NodeForm, TripleForm, canvas-types |
| `packages/graph-rag/**` | 작음 | context-builder에 스키마 섹션 추가 |
| `packages/chat-core/**` | 작음 | buildChatContext에 스키마 주입 |

---

## Task 2: operations 확장 (`kg-core/src/operations.ts`)

### 현재 상태 (148줄)

- `createEmptyGraph`, `addNode`, `removeNode`, `updateNode`
- `addTriple`, `removeTriple`, `updateTriple`
- `addRule`, `removeRule`
- 모든 함수 불변 (새 객체 반환)

### 변경 사항

1. **`createEmptyGraph`** — `schema` 필드 초기화 옵션 추가
2. **`addNode`** — `type` 필수 검증, `props` 전달
3. **`updateNode`** — `props` 머지 로직 (shallow merge)
4. **`addTriple`** — `schema` 있으면 LinkType 제약 검증:
   - predicate가 `schema.linkTypes`에 존재하는지
   - subject/object 노드의 type이 sourceTypes/targetTypes에 맞는지
   - cardinality 제약 확인 (1:1이면 기존 동일 predicate 중복 체크)
5. **`addRule`** — 변경 없음

### 검증 정책

- `schema`가 없으면 기존 동작 그대로 (자유 모드)
- `schema`가 있으면 제약 검증, 위반 시 `Error` throw
- 이 정책으로 기존 `.kg.json` 하위 호환 보장

---

## Task 3: serializer 확장 (`kg-core/src/serializer.ts`)

### 현재 상태 (67줄)

- `toJSON` / `fromJSON` / `generateId` / `serializeGraphForPrompt`

### 변경 사항

1. **`fromJSON`** — `schema` 필드 파싱, `Node.props` / `Triple.metadata` 보존
2. **`toJSON`** — 변경 없음 (JSON.stringify가 자동 처리)
3. **`serializeGraphForPrompt`** — TypeRegistry 정보 포함:
   ```
   ## 스키마
   ### 노드 타입 (N개)
   - brand (브랜드): 기업/제품 브랜드 엔티티...
   - color (색상): 브랜드 색상 팔레트의 개별 색상... [속성: hexCode, usage, category]
   
   ### 관계 타입 (N개)
   - has-color (색상을 가진다): brand, application → color (1:N)
   ```

---

## Task 4: validator 확장 (`kg-core/src/validator.ts`)

### 현재 상태 (83줄)

- Rule 기반 검증 (must_have, must_not_have, conflicts_with)

### 변경 사항

- `schema` 있으면 **스키마 기반 자동 검증** 추가:
  1. 노드 타입이 `schema.nodeTypes`에 정의되어 있는지
  2. 필수 속성(`required: true`) 존재 확인
  3. `props` 값의 `valueType` 매칭 검증
  4. Triple의 predicate가 `schema.linkTypes`에 정의되어 있는지
  5. source/target 타입 제약 확인
- 기존 Rule 기반 검증은 그대로 유지, 스키마 검증 결과를 앞에 추가

---

## Task 5: RAG 스키마 주입

### 대상 파일

- `packages/graph-rag/src/context-builder.ts` — traversal 결과를 프롬프트 텍스트로 조합하는 모듈
- `packages/chat-core/src/build-chat-context.ts` — 채팅용 컨텍스트 빌더

### 변경 사항

- `serializeGraphForPrompt()` 결과에 이미 스키마 섹션이 포함됨 (Task 3)
- context-builder에서 관련 노드의 `NodeType.description` + `PropertyDef.description`을 추가 주입
- "이 노드는 [타입 설명]이며, [속성 값들]을 가진다" 형태의 서술적 컨텍스트

---

## Task 6: canvas-types 동적 읽기

### 대상 파일

- `apps/editor/src/components/canvas/types/canvas-types.ts`

### 현재 상태

```typescript
// 하드코딩된 색상/크기 맵
export const NODE_COLORS: Record<string, string> = { brand: "#6496ff", ... };
export const NODE_SIZES: Record<string, number> = { brand: 36, ... };
```

### 변경 사항

- TypeRegistry에서 `NodeType.visual` 읽어서 동적으로 색상/크기 결정
- `schema`가 없으면 기존 하드코딩 값을 fallback으로 사용

---

## Task 7: Combobox 교체

### 대상 파일

- `apps/editor/src/components/panel/triple-form.tsx` (또는 관련 폼 컴포넌트)

### 변경 사항

- predicate `<Select>` → `<Combobox>` (Popover + Command 패턴, shadcn/ui)
- `schema.linkTypes`에서 선택지 목록 생성
- 타이핑으로 필터링 가능
- source/target 타입에 따라 허용 predicate만 표시
- `schema`가 없으면 기존 자유 입력 모드

---

## Task 8: 테스트

### TDD 순서

1. `types.ts` 타입 컴파일 테스트 (타입 에러 없는지)
2. `operations.test.ts` — 스키마 있는/없는 경우 분기 테스트
   - addNode: type 필수 검증
   - addTriple: LinkType 제약 검증 (sourceTypes, targetTypes, cardinality)
   - updateNode: props 머지
3. `serializer.test.ts` — fromJSON에서 schema/props/metadata 보존
4. `validator.test.ts` — 스키마 기반 자동 검증
5. `serializeGraphForPrompt` — 스키마 섹션 출력 확인

### 기존 테스트 수정

- 모든 Node 생성에 `type` 필수 → 기존 테스트에서 `type` 없이 만드는 곳 수정 필요

---

## Task 9: 데이터 마이그레이션

### 대상

- `data/worxphere.kg.json` — 현재 유일한 실 데이터

### 전략

1. 기존 데이터의 고유 `type` 값들을 추출
2. 각 type에 대해 `NodeType` 정의 생성 (displayName, description)
3. 기존 predicate들에 대해 `LinkType` 정의 생성
4. `schema` 필드를 파일에 추가
5. 기존 노드에 `props` 추가는 선택적 (빈 props부터 시작 가능)

### 마이그레이션 스크립트

- `scripts/migrate-to-schema.ts` — 기존 데이터에서 자동으로 스키마 초안 생성
- 수동 검토 후 description, properties 등 보강

---

## 구현 순서 (의존성 기반)

```
Task 1 (types.ts)
  ├→ Task 2 (operations.ts)   ← Task 1에 의존
  ├→ Task 3 (serializer.ts)   ← Task 1에 의존
  ├→ Task 4 (validator.ts)    ← Task 1에 의존
  └→ Task 8 (tests)           ← Task 1~4와 병행 (TDD)

Task 3 완료 후:
  └→ Task 5 (RAG 주입)        ← serializeGraphForPrompt 변경에 의존

Task 1 완료 후:
  ├→ Task 6 (canvas-types)    ← NodeType.visual 타입 필요
  └→ Task 7 (Combobox)        ← LinkType 타입 필요

전체 완료 후:
  └→ Task 9 (데이터 마이그레이션)
```

### 권장 세션 배분

| 세션 | 작업 | 예상 시간 |
|------|------|-----------|
| 세션 A (kg-core) | Task 1 → 8 → 2 → 3 → 4 (TDD) | ~1시간 |
| 세션 B (editor) | Task 6 → 7 (Task 1 완료 대기 후) | ~30분 |
| 세션 C (RAG) | Task 5 (Task 3 완료 대기 후) | ~15분 |
| 세션 D (migration) | Task 9 (전체 완료 후) | ~15분 |

---

## 세션 로그

> 작업한 세션은 아래에 기록을 남길 것.

| 시간 | 세션 | 작업 내용 | 변경 파일 | 상태 |
|------|------|-----------|-----------|------|
| - | - | - | - | - |

---

## 결정 사항 로그

> Phase 0 진행 중 내린 설계 결정을 기록.

| 번호 | 결정 | 이유 | 대안 |
|------|------|------|------|
| - | - | - | - |

---

## 블로커 / 이슈

> 진행 중 발견된 문제를 기록.

| 번호 | 이슈 | 심각도 | 상태 | 해결 |
|------|------|--------|------|------|
| - | - | - | - | - |
