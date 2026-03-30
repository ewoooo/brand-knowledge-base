# KnowledgeView API Reference

KnowledgeView는 두 개의 API 서버로 구성됩니다:

- **Editor API** (`apps/editor`, `:3000`) — 그래프 CRUD + AI 채팅
- **RAG API** (`apps/rag-api`, `:3001`) — RAG 파이프라인 질의

모든 API는 인증 없이 사용 가능하며, 데이터는 `data/` 디렉토리의 `.kg.json` 파일로 저장됩니다.

---

## Editor API

### `GET /api/graphs`

모든 지식 그래프 목록을 반환합니다.

**Response** `200`

```json
[
  {
    "filename": "worxphere.kg.json",
    "name": "Worxphere Brand Guide",
    "nodeCount": 42,
    "tripleCount": 128,
    "ruleCount": 5
  }
]
```

---

### `POST /api/graphs`

새 지식 그래프를 생성합니다.

**Request Body**

```json
{
  "name": "새 그래프 이름"
}
```

**Response** `201`

```json
{
  "filename": "새-그래프-이름.kg.json",
  "name": "새 그래프 이름"
}
```

**Errors**

| 상태 코드 | 원인 |
|-----------|------|
| `400` | `name` 필드 누락 |

---

### `GET /api/graphs/[filename]`

특정 지식 그래프를 반환합니다.

**Path Parameters**

| 이름 | 타입 | 설명 |
|------|------|------|
| `filename` | `string` | 그래프 파일명 (예: `worxphere.kg.json`) |

**Response** `200`

```json
{
  "metadata": {
    "name": "Worxphere Brand Guide",
    "created": "2026-03-30",
    "updated": "2026-03-30"
  },
  "nodes": [
    { "id": "node-1", "label": "Worxphere", "type": "brand" }
  ],
  "triples": [
    { "id": "triple-1", "subject": "node-1", "predicate": "has_color", "object": "node-2" }
  ],
  "rules": [
    {
      "id": "rule-1",
      "name": "브랜드 필수 컬러",
      "expression": "∀x (brand(x) → ∃y 프라이머리컬러(x, y))",
      "type": "constraint",
      "condition": {
        "nodeType": "brand",
        "predicate": "프라이머리컬러",
        "operator": "must_have"
      }
    }
  ]
}
```

**Errors**

| 상태 코드 | 원인 |
|-----------|------|
| `404` | 파일 없음 |

---

### `PUT /api/graphs/[filename]`

기존 지식 그래프를 덮어씁니다. `metadata.updated`는 자동으로 현재 날짜로 갱신됩니다.

**Request Body** — `KnowledgeGraph` 전체 객체 (GET 응답과 동일한 구조)

**Response** `200`

```json
{ "success": true }
```

---

### `DELETE /api/graphs/[filename]`

지식 그래프 파일을 삭제합니다.

**Response** `200`

```json
{ "success": true }
```

**Errors**

| 상태 코드 | 원인 |
|-----------|------|
| `404` | 파일 없음 |

---

### `POST /api/chat`

지식 그래프 컨텍스트 기반 AI 채팅 (SSE 스트리밍).

**Request Body**

```json
{
  "messages": [
    {
      "role": "user",
      "parts": [{ "type": "text", "text": "이 브랜드의 주요 컬러는?" }]
    }
  ],
  "graph": { ... }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `messages` | `UIMessage[]` | AI SDK v6 UIMessage 형식의 대화 이력 |
| `graph` | `KnowledgeGraph` | 현재 편집 중인 그래프 전체 |

**Response** — `text/event-stream` (SSE)

```
event: text
data: {"type":"text-delta","text":"주요 컬러는..."}

event: finish
data: {"finishReason":"stop"}
```

**동작 방식**

1. 마지막 사용자 메시지에서 질문 추출
2. `buildChatContext(graph, question)`으로 RAG 파이프라인 실행
3. 서브그래프 컨텍스트를 시스템 프롬프트에 포함
4. Claude Sonnet 4.6으로 스트리밍 응답 생성

**Errors**

| 상태 코드 | 원인 |
|-----------|------|
| `500` | 서버 오류 (JSON `{ error: "..." }`) |

---

## RAG API

### `POST /api/query`

RAG 파이프라인을 실행하고 구조화된 서브그래프 결과를 반환합니다 (비스트리밍).

**Request Body**

```json
{
  "question": "브랜드 컬러 규칙은?",
  "graphFile": "worxphere.kg.json",
  "options": {
    "depth": 2,
    "maxNodes": 50
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `question` | `string` | O | 질의 텍스트 |
| `graphFile` | `string` | O | 대상 그래프 파일명 |
| `options.depth` | `number` | X | BFS 탐색 깊이 (기본값: 2) |
| `options.maxNodes` | `number` | X | 서브그래프 최대 노드 수 (기본값: 50) |

**Response** `200`

```json
{
  "context": "## 현재 그래프: Worxphere\n### 노드 (3개)\n...",
  "subgraph": {
    "nodes": [
      { "id": "node-1", "label": "Worxphere", "type": "brand" }
    ],
    "triples": [
      { "id": "triple-1", "subject": "node-1", "predicate": "has_color", "object": "node-2" }
    ]
  },
  "extraction": {
    "entities": [
      { "nodeId": "node-1", "label": "Worxphere", "matchType": "exact" }
    ],
    "predicateHints": ["has_color"],
    "typeHints": ["brand"],
    "mode": "keyword"
  },
  "metadata": {
    "depth": 2,
    "nodeCount": 3,
    "tripleCount": 5
  }
}
```

**Errors**

| 상태 코드 | 원인 |
|-----------|------|
| `400` | `question` 또는 `graphFile` 누락 |
| `404` | 그래프 파일 없음 |

---

### `POST /api/context`

RAG 파이프라인 + AI 스트리밍 응답을 반환합니다.

**Request Body**

```json
{
  "question": "브랜드 컬러 규칙은?",
  "graphFile": "worxphere.kg.json",
  "options": {
    "depth": 2,
    "model": "claude-sonnet-4-6"
  },
  "messages": []
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `question` | `string` | O | 질의 텍스트 |
| `graphFile` | `string` | O | 대상 그래프 파일명 |
| `options.depth` | `number` | X | BFS 탐색 깊이 (기본값: 2) |
| `options.model` | `string` | X | Anthropic 모델명 (기본값: `claude-sonnet-4-6`) |
| `messages` | `UIMessage[]` | X | 대화 이력 (없으면 question으로 단일 메시지 생성) |

**Response** — `text/event-stream` (SSE)

`/api/chat`과 동일한 SSE 스트림 형식

**Errors**

| 상태 코드 | 원인 |
|-----------|------|
| `400` | `question` 또는 `graphFile` 누락 |
| `404` | 그래프 파일 없음 |

---

## 데이터 모델

### KnowledgeGraph

```typescript
interface KnowledgeGraph {
  metadata: {
    name: string;        // 그래프 이름
    created: string;     // 생성일 (YYYY-MM-DD)
    updated: string;     // 수정일 (YYYY-MM-DD)
  };
  nodes: Node[];
  triples: Triple[];
  rules: Rule[];
}
```

### Node

```typescript
interface Node {
  id: string;            // UUID
  label: string;         // 표시 이름
  type?: string;         // 자유 문자열 (brand, color, typography, concept 등)
}
```

### Triple

```typescript
interface Triple {
  id: string;            // UUID
  subject: string;       // Node ID (출발 노드)
  predicate: string;     // 관계명 (자유 텍스트)
  object: string;        // Node ID (도착 노드)
}
```

### Rule

```typescript
interface Rule {
  id: string;
  name: string;          // 규칙 이름
  expression: string;    // FOL 표현식 (사람이 읽는 용도)
  type: "constraint" | "inference" | "validation";
  condition: {
    nodeType: string;    // 대상 노드 타입
    predicate: string;   // 검사할 관계명
    operator: "must_have" | "must_not_have" | "conflicts_with";
    conflictPredicate?: string;  // conflicts_with 전용
  };
}
```

---

## RAG 파이프라인

```
질문 입력
  ↓
1. extractEntities(graph, question)
   → 질문에서 키워드 추출 → 그래프 노드와 매칭 (exact/partial)
  ↓
2. traverse(graph, matchedNodes, { depth })
   → 매칭된 노드에서 BFS로 depth만큼 탐색 → 서브그래프 추출
  ↓
3. buildContext(subgraph, rules)
   → 서브그래프 + 관련 규칙을 한국어 마크다운 텍스트로 직렬화
  ↓
시스템 프롬프트에 포함 → LLM 응답 생성
```

---

## 엔드포인트 요약

| 엔드포인트 | 메서드 | 앱 | 스트리밍 | 설명 |
|-----------|--------|-----|---------|------|
| `/api/graphs` | `GET` | Editor | X | 그래프 목록 |
| `/api/graphs` | `POST` | Editor | X | 그래프 생성 |
| `/api/graphs/[filename]` | `GET` | Editor | X | 그래프 조회 |
| `/api/graphs/[filename]` | `PUT` | Editor | X | 그래프 수정 |
| `/api/graphs/[filename]` | `DELETE` | Editor | X | 그래프 삭제 |
| `/api/chat` | `POST` | Editor | O (SSE) | AI 채팅 |
| `/api/query` | `POST` | RAG API | X | RAG 구조화 결과 |
| `/api/context` | `POST` | RAG API | O (SSE) | RAG + AI 스트리밍 |
