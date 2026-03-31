# 온톨로지 설계

KnowledgeView의 KG 구조를 Palantir Foundry 온톨로지 패턴을 참고하여 고도화하기 위한 설계 문서.

## 현재 구조의 한계

```typescript
// 현재: 스키마와 데이터가 혼재
interface Node { id: string; label: string; type?: string }
interface Triple { id: string; subject: string; predicate: string; object: string }
interface Rule { id: string; name: string; type: "constraint" | "inference" | "validation"; ... }
```

| 문제 | 설명 |
|------|------|
| 타입 레지스트리 없음 | `type`이 자유 문자열 — "어떤 타입이 존재하는가" 정의가 없음 |
| 속성 스키마 없음 | Node에 `id, label, type`만 — 서술적 지식(왜, 어떤 맥락)을 담을 곳 없음 |
| 관계 제약 없음 | 아무 노드끼리 아무 predicate로 연결 가능 — 구조적 무결성 보장 불가 |
| 관계 메타데이터 없음 | Triple에 가중치, 신뢰도, 출처 등 부가 정보 없음 |
| Action 정의 없음 | CRUD 제약/검증 규칙이 타입 레벨에 없음 |

**핵심 결과:** RAG에서 AI에게 "이 노드가 무엇이고 왜 중요한가"를 전달할 컨텍스트가 부족.

---

## Palantir 온톨로지 3계층 참고 모델

Palantir Foundry의 온톨로지는 3개의 관심사 분리 계층으로 구성된다. 이는 별도 "객체 종류"가 아니라 동일 온톨로지 위에서 역할별로 분류한 구성 요소들이다.

```
┌─────────────────────────────────────────────────┐
│  Semantic Layer    "무엇이 존재하는가"              │
│  Object Type, Property, Link Type, Interface     │
├─────────────────────────────────────────────────┤
│  Kinetic Layer     "무엇을 할 수 있는가"           │
│  Action Type, Function, Webhook                  │
├─────────────────────────────────────────────────┤
│  Dynamic Layer     "어떤 규칙으로 작동하는가"       │
│  Rule, Pipeline, Lifecycle, Access Control       │
└─────────────────────────────────────────────────┘
```

| 레이어 | Palantir | KV 현재 | KV 부족한 것 |
|--------|----------|---------|-------------|
| Semantic | Object Type, Property, Link Type, Interface | Node, Triple | 타입 레지스트리, 속성 스키마, 관계 제약 |
| Kinetic | Action Type, Function, Webhook | `useGraph` 훅 (addNode 등) | Action 스키마 정의 없음, 제약/검증 없음 |
| Dynamic | Rule, Pipeline, Lifecycle | Rule (부분적), graph-rag (부분적) | 파이프라인/자동화 레이어 미비 |

---

## 목표 구조

### 설계 원칙

1. **스키마/데이터 분리** — 타입 정의(스키마)와 인스턴스(데이터)를 명확히 분리
2. **데이터 순수성 유지** — kg-core는 계속 순수 함수, 불변 operation
3. **점진적 도입** — 기존 `.kg.json` 포맷과 하위 호환 유지하며 확장
4. **RAG 품질 향상** — 타입 레지스트리의 description/context를 RAG 컨텍스트로 주입

### 전체 구조

```
KnowledgeGraph (확장)
├── schema                         ← NEW: Semantic Layer
│   ├── nodeTypes: NodeType[]        타입 레지스트리
│   ├── linkTypes: LinkType[]        관계 스키마
│   └── interfaces: Interface[]      공유 형태 (선택적, 2단계)
├── nodes: Node[]                  ← 기존 + props 확장
├── triples: Triple[]              ← 기존 + metadata 확장
├── rules: Rule[]                  ← 기존 (Dynamic Layer)
└── metadata: GraphMetadata        ← 기존
```

---

## Semantic Layer: 스키마 정의

### NodeType (타입 레지스트리)

```typescript
interface NodeType {
    /** kebab-case 식별자 (예: "core-value") */
    type: string;

    /** 사용자 표시명 (예: "핵심 가치") */
    displayName: string;

    /** 타입 설명 — RAG 컨텍스트로 주입됨 */
    description: string;

    /** 이 타입의 노드가 가질 수 있는 속성 정의 */
    properties: PropertyDef[];

    /** 시각화 힌트 */
    visual?: {
        color?: string;
        size?: number;
        icon?: string;
    };
}
```

**설계 의도:**
- `description`이 핵심 — "core-value 타입은 브랜드가 추구하는 핵심 가치를 나타낸다"처럼 AI가 맥락을 이해할 수 있는 서술
- `visual`은 현재 `canvas-types.ts`의 `NODE_COLORS`, `NODE_SIZES` 하드코딩을 대체
- `properties`로 각 타입별 허용 속성을 정의 → 편집 UI 자동 생성 가능

### PropertyDef (속성 정의)

```typescript
interface PropertyDef {
    /** 속성 키 (예: "hexCode") */
    key: string;

    /** 표시명 (예: "HEX 색상 코드") */
    displayName: string;

    /** 데이터 타입 */
    valueType: "string" | "number" | "boolean" | "date" | "url" | "enum";

    /** 필수 여부 */
    required?: boolean;

    /** enum일 경우 허용 값 목록 */
    enumValues?: string[];

    /** 설명 (RAG 컨텍스트용) */
    description?: string;
}
```

### LinkType (관계 스키마)

```typescript
interface LinkType {
    /** predicate 식별자 (예: "has-color") */
    predicate: string;

    /** 표시명 (예: "색상을 가진다") */
    displayName: string;

    /** 설명 */
    description?: string;

    /** 허용되는 주체 타입 (빈 배열 = 모두 허용) */
    sourceTypes: string[];

    /** 허용되는 객체 타입 (빈 배열 = 모두 허용) */
    targetTypes: string[];

    /** 카디널리티 */
    cardinality: "1:1" | "1:N" | "N:1" | "N:N";

    /** 역방향 표시명 (예: "~의 색상이다") */
    inverseDisplayName?: string;
}
```

**설계 의도:**
- `sourceTypes`/`targetTypes`로 관계 무결성 검증 가능 (예: "has-color"는 brand→color만 허용)
- `cardinality`로 중복 관계 방지
- `inverseDisplayName`으로 양방향 탐색 시 자연어 표현 지원

---

## 확장된 데이터 모델

### Node (확장)

```typescript
interface Node {
    id: string;
    label: string;
    type: string;            // 필수로 변경, NodeType.type 참조
    props?: Record<string, unknown>;  // NEW: 타입별 속성 값
}
```

**예시:**
```json
{
    "id": "abc-123",
    "label": "#2E5BFF",
    "type": "color",
    "props": {
        "hexCode": "#2E5BFF",
        "usage": "Primary Blue",
        "category": "primary"
    }
}
```

### Triple (확장)

```typescript
interface Triple {
    id: string;
    subject: string;
    predicate: string;        // LinkType.predicate 참조
    object: string;
    metadata?: TripleMetadata;  // NEW
}

interface TripleMetadata {
    confidence?: number;      // 0-1 신뢰도
    source?: string;          // 출처 (manual, ai-extracted, imported)
    createdAt?: string;       // 생성 시점
    note?: string;            // 부가 설명
}
```

---

## Kinetic Layer: Action 정의

현재 `useGraph` 훅의 CRUD 메서드에 대응. 1단계에서는 별도 스키마를 두지 않고, **LinkType/NodeType의 제약을 operations에서 검증**하는 방식으로 구현.

```
현재 흐름:   useGraph.addTriple(triple) → kg-core.addTriple(graph, triple) → 새 그래프
목표 흐름:   useGraph.addTriple(triple) → kg-core.addTriple(graph, triple)
                                           ├── 양쪽 노드 존재 확인 (기존)
                                           ├── LinkType 존재 확인 (NEW)
                                           ├── source/target 타입 제약 확인 (NEW)
                                           └── 카디널리티 제약 확인 (NEW)
```

2단계에서 Action Type 스키마를 도입할 경우:

```typescript
interface ActionType {
    id: string;
    name: string;
    description: string;
    /** 이 액션이 적용되는 대상 타입 */
    targetTypes: string[];
    /** 필요한 파라미터 */
    parameters: PropertyDef[];
    /** 실행 전 검증 규칙 */
    preconditions?: string[];  // Rule ID 참조
}
```

---

## Dynamic Layer: 규칙 확장

현재 Rule 구조를 유지하되, 스키마 기반 검증을 추가.

```typescript
// 기존 Rule은 유지
interface Rule {
    id: string;
    name: string;
    expression: string;
    type: "constraint" | "inference" | "validation";
    condition: RuleCondition;
}

// NEW: 스키마 기반 자동 검증 (Rule과 별도)
// NodeType.properties의 required, valueType 등에서 자동 도출
// LinkType.sourceTypes, targetTypes, cardinality에서 자동 도출
// → validate() 함수에서 스키마 제약도 함께 검사
```

---

## 데이터 포맷 (.kg.json) 확장

```json
{
    "metadata": {
        "name": "Worxphere Brand Guidelines",
        "created": "2025-01-01",
        "updated": "2026-03-31",
        "schemaVersion": "2.0",
        "systemPrompt": "..."
    },
    "schema": {
        "nodeTypes": [
            {
                "type": "brand",
                "displayName": "브랜드",
                "description": "기업/제품 브랜드 엔티티. 하위에 미션, 비전, 핵심 가치, 슬로건 등을 가진다.",
                "properties": [],
                "visual": { "color": "#6496ff", "size": 36 }
            },
            {
                "type": "color",
                "displayName": "색상",
                "description": "브랜드 색상 팔레트의 개별 색상. HEX 코드와 용도를 가진다.",
                "properties": [
                    { "key": "hexCode", "displayName": "HEX 코드", "valueType": "string", "required": true },
                    { "key": "usage", "displayName": "용도", "valueType": "string" },
                    { "key": "category", "displayName": "분류", "valueType": "enum", "enumValues": ["primary", "secondary", "accent", "neutral"] }
                ],
                "visual": { "color": "#ff5733", "size": 20 }
            }
        ],
        "linkTypes": [
            {
                "predicate": "has-color",
                "displayName": "색상을 가진다",
                "sourceTypes": ["brand", "application"],
                "targetTypes": ["color"],
                "cardinality": "1:N",
                "inverseDisplayName": "~의 색상이다"
            }
        ]
    },
    "nodes": [
        { "id": "abc", "label": "Worxphere", "type": "brand" },
        { "id": "def", "label": "#2E5BFF", "type": "color", "props": { "hexCode": "#2E5BFF", "category": "primary" } }
    ],
    "triples": [
        { "id": "t1", "subject": "abc", "predicate": "has-color", "object": "def", "metadata": { "source": "manual" } }
    ],
    "rules": []
}
```

---

## 마이그레이션 전략

### 1단계: 하위 호환 확장 (스키마 옵셔널)

- `schema` 필드를 `.kg.json`에 추가하되 **optional**로 유지
- `schema`가 없으면 기존 동작 그대로 (자유 문자열 타입, 제약 없음)
- `schema`가 있으면 검증 활성화
- `Node.props` 추가 (optional)
- `Triple.metadata` 추가 (optional)
- `canvas-types.ts`의 하드코딩 색상/크기를 `schema.nodeTypes[].visual`에서 읽도록 전환

### 2단계: 스키마 기반 UI

- NodeForm에서 `NodeType.properties` 기반 동적 폼 필드 생성
- TripleForm에서 `LinkType.sourceTypes/targetTypes`로 선택지 필터링
- TripleForm의 predicate Select → Combobox 교체 (타이핑 검색)
- 타입 필터 사이드바에서 `NodeType.displayName` 표시

### 3단계: RAG 품질 향상

- RAG 컨텍스트 빌드 시 `NodeType.description` + `PropertyDef.description` 주입
- "이 노드는 [타입 설명]이며, [속성들]을 가진다" 형태의 자연어 컨텍스트 생성
- `LinkType.description`으로 관계의 의미를 AI에게 전달

### 4단계: Kinetic/Dynamic 고도화 (선택적)

- Action Type 스키마 도입 (Kinetic Layer 명시화)
- Rule 시스템 확장 (복합 조건, 스키마 기반 자동 검증)
- 변경 이력/감사 로그 (Dynamic Layer)

---

## 참고 자료

### Palantir Foundry 문서

- [Ontology Overview](https://www.palantir.com/docs/foundry/ontology/overview)
- [Core Concepts](https://www.palantir.com/docs/foundry/ontology/core-concepts)
- [Object Types](https://www.palantir.com/docs/foundry/object-link-types/object-types-overview)
- [Link Types](https://www.palantir.com/docs/foundry/object-link-types/link-types-overview)
- [Properties](https://www.palantir.com/docs/foundry/object-link-types/properties-overview)
- [Type Classes](https://www.palantir.com/docs/foundry/object-link-types/metadata-typeclasses)
- [Action Types](https://www.palantir.com/docs/foundry/action-types/overview)
- [3 Layers 해설 (Medium)](https://pythonebasta.medium.com/understanding-palantirs-ontology-semantic-kinetic-and-dynamic-layers-explained-c1c25b39ea3c)
