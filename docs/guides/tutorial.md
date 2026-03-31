# KnowledgeView 프로젝트 튜토리얼

> 이 문서는 프로젝트의 전체 그림을 이해하기 위한 가이드입니다.
> 코드 구조는 `docs/specs/architecture.md`, API 스펙은 `docs/specs/api.md`를 참조하세요.

## 1. 프로젝트가 뭔가요?

KnowledgeView는 **지식 그래프 편집기 + AI 탐색 도구**입니다.

핵심 문제: 브랜드 가이드라인은 정적 PDF로 존재하고, 한번 납품하면 끝. 에이전틱 AI 도구들이 만든 결과물이 브랜드를 지키는지 판단할 "심판"이 없음.

해결: 가이드라인을 **노드(Node)**와 **관계(Triple)**로 분해하여 지식 그래프로 만들고, AI가 숨겨진 패턴을 발견하고, 위반을 감지하고, 규칙 개정까지 제안하는 **리빙 브랜드 가이드라인** 시스템.

```
정적 PDF 가이드라인
       ↓ AI 보조 변환
지식 그래프 (.kg.json)
       ↓ 편집 + AI 탐색
캔버스 에디터 + RAG 채팅
       ↓ (Phase 2)
브랜드 린터 API
       ↓ (Phase 3)
자동 개정 제안
```

---

## 2. 데이터 모델 — 3가지 핵심 개념

### Node (노드)

지식의 단위. "프라이머리 블루", "헤딩 타이포", "로고 최소 크기 규칙" 같은 것들.

```typescript
// packages/kg-core/src/types.ts
interface Node {
  id: string;        // 고유 식별자 (UUID)
  label: string;     // 표시명
  type?: string;     // 분류 (kebab-case: "color", "typography", "logo")
}
```

- `type`은 자유 텍스트지만, 반드시 kebab-case여야 함
- `normalizeType()`이 PascalCase/camelCase를 자동으로 kebab-case로 변환
- 예: `"BrandName"` → `"brand-name"`, `"keyVisual"` → `"key-visual"`

### Triple (트리플 = 관계)

두 노드 사이의 관계. "A는 B를 사용한다", "A는 B와 충돌한다" 같은 것들.

```typescript
interface Triple {
  id: string;
  subject: string;    // 출발 노드 id
  predicate: string;  // 관계명 (자유 텍스트)
  object: string;     // 도착 노드 id
}
```

```
(프라이머리 블루) ──[usesColor]──→ (헤딩 타이포)
    subject           predicate         object
```

- Subject-Predicate-Object (SPO) 구조
- predicate는 아무 문자열이나 가능 ("ownsColor", "appliesTo", "requires" 등)

### Rule (규칙)

그래프의 검증 조건. "color 타입 노드는 반드시 usesColor 관계가 있어야 한다" 같은 것들.

```typescript
interface Rule {
  id: string;
  name: string;            // "색상 사용 규칙"
  expression: string;      // 사람이 읽는 설명
  type: "constraint" | "inference" | "validation";
  condition: {
    nodeType: string;      // 대상 타입 ("color")
    predicate: string;     // 검사할 관계 ("usesColor")
    operator: "must_have" | "must_not_have" | "conflicts_with";
  };
}
```

3가지 검증 연산자:
- `must_have`: 이 타입의 노드는 이 관계가 반드시 있어야 함
- `must_not_have`: 이 타입의 노드는 이 관계가 있으면 안 됨
- `conflicts_with`: 두 관계가 같은 대상을 가리키면 충돌

### KnowledgeGraph (전체)

```typescript
interface KnowledgeGraph {
  metadata: {
    name: string;
    created: string;
    updated: string;
    systemPrompt?: string;  // AI 채팅 성격 설정
  };
  nodes: Node[];
  triples: Triple[];
  rules: Rule[];
}
```

이게 `.kg.json` 파일의 구조 그대로입니다. `data/worxphere.kg.json`을 열어보면 이 형태.

---

## 3. 패키지별 역할 — "누가 뭘 하나?"

### kg-core — 순수 함수의 심장

**위치:** `packages/kg-core/src/`

모든 데이터 조작의 기반. React도 Next.js도 모름. 순수한 TypeScript 함수.

| 파일 | 역할 | 핵심 함수 |
|------|------|----------|
| `types.ts` | 데이터 모델 정의 | Node, Triple, Rule, KnowledgeGraph |
| `operations.ts` | 불변 CRUD | addNode, removeNode, addTriple 등 |
| `validator.ts` | 규칙 검증 | validate(graph) → ValidationResult[] |
| `serializer.ts` | JSON 변환 | toJSON, fromJSON, serializeGraphForPrompt |
| `normalize-type.ts` | 타입 정규화 | normalizeType("BrandName") → "brand-name" |

**핵심 원칙:**
- 모든 함수가 **불변** — 원본 그래프를 절대 수정하지 않고 새 객체 반환
- side-effect 없음 — 파일 읽기/쓰기, 네트워크 호출 없음
- React 의존성 없음 — 어디서든 import 가능

```typescript
// 사용 예시
const newGraph = addNode(graph, { id: "n1", label: "블루", type: "color" });
// graph는 그대로, newGraph에 노드가 추가된 새 객체
```

### graph-rag — AI에게 맥락을 주는 파이프라인

**위치:** `packages/graph-rag/src/`

사용자가 "이 브랜드의 색상 규칙은?" 같은 질문을 하면, 전체 그래프에서 관련된 부분만 추출하여 AI에게 전달하는 역할.

```
질문: "프라이머리 컬러와 타이포의 관계는?"
       ↓
[1] extractEntities() — 질문에서 키워드 추출
       "프라이머리 컬러" → 노드 n1 매칭
       "타이포" → 노드 n5 매칭
       ↓
[2] traverse() — BFS로 관련 서브그래프 탐색
       n1에서 깊이 2까지 연결된 노드/트리플 수집
       ↓
[3] buildContext() — 마크다운으로 변환
       "## 노드\n- 프라이머리 블루 (color)\n..."
       ↓
AI (Claude)에게 전달 → 답변 생성
```

| 파일 | 역할 |
|------|------|
| `extractor.ts` | 질문에서 노드명/타입 키워드 추출 (현재 keyword 모드만) |
| `traverser.ts` | BFS 탐색 (깊이 2, 최대 50노드, 양방향) |
| `context-builder.ts` | 서브그래프를 한국어 마크다운으로 변환 |
| `index.ts` | runPipeline() — 위 3단계를 순차 실행 |

**한계:** `extractor.ts`의 TYPE_KEYWORDS가 4개 타입만 하드코딩. Phase 0에서 TypeRegistry 기반으로 교체 예정.

### chat-core — RAG + 시스템 프롬프트 래퍼

**위치:** `packages/chat-core/src/`

graph-rag와 system prompt를 결합하는 얇은 글루 레이어.

```typescript
buildChatContext(graph, question)
  → entity 매칭됨? → graph-rag의 runPipeline() (RAG 모드)
  → 매칭 안 됨?    → serializeGraphForPrompt() (전체 그래프 덤프, fallback 모드)
```

---

## 4. 앱별 역할 — "사용자가 보는 것"

### editor (port 3000) — 메인 UI

사용자가 실제로 사용하는 앱. 3단 레이아웃:

```
┌──────────┬──────────────────────┬──────────┐
│ Sidebar  │      D3 Canvas       │  Detail  │
│          │                      │  Panel   │
│ 그래프   │   ● ─── ● ─── ●     │          │
│ 목록     │    \   / \   /      │ 속성 탭  │
│          │     ● ─── ●        │ AI Chat  │
│ 통계     │                      │  탭      │
│ 타입필터 │                      │          │
│ 규칙결과 │                      │          │
└──────────┴──────────────────────┴──────────┘
```

**주요 사용자 흐름:**

1. 사이드바에서 .kg.json 파일 선택 → 그래프 로드
2. 캔버스에 노드/엣지가 D3 force simulation으로 시각화
3. 노드 클릭 → DetailPanel에 상세 정보
4. 우클릭 → 노드 편집/삭제/관계 추가 메뉴
5. ⌘K → 노드 검색
6. AI Chat 탭 → 질문하면 RAG로 답변 + 언급된 노드 캔버스에서 포커스

**Observe by Chat:** AI 답변에서 노드명이 나오면 클릭 가능한 버튼으로 렌더링. 클릭하면 캔버스가 해당 노드로 자동 줌/포커스.

### rag-api (port 3001) — Headless RAG 서버

UI 없는 API 서버. 외부 시스템이 KG에 질문할 때 사용.

| Route | 역할 |
|-------|------|
| `POST /api/query` | 질문 → JSON 결과 (서브그래프 + 추출 정보) |
| `POST /api/context` | 질문 → AI 스트리밍 답변 (멀티턴 지원) |

### generator (port 3002) — 이미지 생성

Gemini 기반 이미지 생성. 메인 프로젝트와 독립.

---

## 5. 데이터 흐름 — "클릭부터 저장까지"

### 노드 추가 흐름

```
사용자: "노드 추가" 클릭
       ↓
NodeForm (모달) — label, type 입력
       ↓
useGraph.addNode({ label, type })
       ↓
kg-core/operations.addNode(graph, node)
  → normalizeType(type)으로 kebab-case 변환
  → 새 KnowledgeGraph 반환 (불변)
       ↓
React 상태 업데이트 (setGraph)
       ↓
canvas.tsx useEffect 감지
  → D3 시뮬레이션 재구성 → 새 노드가 캔버스에 나타남
       ↓
useRules(graph) 자동 실행
  → validator.validate(graph) → 위반 노드 하이라이트
       ↓
사용자: "저장" 클릭 → PUT /api/graphs/[filename] → data/ 폴더에 .kg.json 저장
```

### AI 채팅 흐름

```
사용자: "이 가이드라인에서 색상 간 충돌이 있나요?"
       ↓
ChatPanel → useChat (AI SDK) → POST /api/chat
       ↓
/api/chat route:
  1. buildChatContext(graph, question) — chat-core
     → extractEntities("색상 간 충돌") — graph-rag
     → traverse(graph, [matchedNodeIds]) — BFS
     → buildContext(subgraph) — 마크다운 변환
  2. streamText(model: claude-sonnet-4-6, context)
  3. 스트리밍 응답 반환
       ↓
ChatPanel에서 답변 스트리밍 렌더링
  → 답변 내 노드명 감지 → 클릭 버튼으로 변환
  → 첫 번째 노드로 캔버스 자동 포커스
```

---

## 6. 파일 시스템 — "데이터는 어디에?"

```
data/
  └── worxphere.kg.json     ← 실제 브랜드 가이드라인 데이터
                                 (71 노드, 102 트리플, 0 규칙)

.env.local
  └── ANTHROPIC_API_KEY=... ← AI 채팅에 필요
```

- 그래프 데이터는 파일 시스템에 JSON으로 저장 (DB 없음)
- API route에서 `process.cwd() + "data"`로 읽기/쓰기
- 프로덕션에서는 Phase 3 이후 GraphDB 전환 검토

---

## 7. 테스트 — "뭘 테스트하고 있나?"

```bash
pnpm test          # 전체 테스트
pnpm --filter @knowledgeview/kg-core test       # kg-core만
pnpm --filter @knowledgeview/graph-rag test      # graph-rag만
```

| 패키지 | 커버리지 | 테스트 내용 |
|--------|---------|------------|
| kg-core | ★★★ 우수 | CRUD, cascade delete, type normalization, JSON round-trip, 규칙 평가 3 연산자 |
| graph-rag | ★★★ 우수 | entity extraction, BFS, context format, 전체 파이프라인 |
| chat-core | ★★ 양호 | RAG vs fallback 모드, system message |
| editor | ★★ 부분 | 노드 추출, 검색 매칭만 (API route 테스트 없음) |
| rag-api | ★ 최소 | context route 1개만 |

---

## 8. 로드맵 — 앞으로 만들 것

### Phase 0: 타입 시스템 도입 (현재 → 다음 구현)

**문제:** Node.type이 자유 텍스트라서 "어떤 타입에 어떤 속성이 있는지" 정의가 없음.

**해결:** TypeRegistry 도입

```typescript
// Phase 0 이후 추가될 구조
interface TypeRegistry {
  nodeTypes: NodeType[];    // 어떤 노드 타입이 있는지
  linkTypes: LinkType[];    // 어떤 관계가 있는지
}

interface NodeType {
  type: string;             // "color"
  description: string;      // "브랜드 색상 규칙"
  properties: PropertySchema[];  // [{ name: "hex", type: "string", required: true }]
}

interface LinkType {
  predicate: string;        // "requires"
  description: string;
  sourceTypes: string[];    // ["logo"]
  targetTypes: string[];    // ["clearspace"]
}
```

Node에도 props 추가:

```typescript
interface Node {
  id: string;
  label: string;
  type?: string;
  props?: Record<string, unknown>;  // { hex: "#FF5733", usage: "primary" }
}
```

### Phase 1: AI 관계 발견 데모

실제 가이드라인을 KG로 변환하고, AI가 "이 색상 규칙과 접근성 규칙이 충돌합니다" 같은 관계를 발견하는 데모.

- 도메인별 노드 아이콘/색상 (color는 파란색 원, typography는 초록색 등)
- AI 채팅 프리셋 질문 버튼
- 가이드라인 통계 (노드 수, 트리플 수 등)

### Phase 2: 브랜드 린터 API

외부에서 "이 디자인이 가이드라인을 지키는지" 검사할 수 있는 API.

```
POST /api/lint
{ artifact: { colors: ["#FF5733"], fonts: [...] } }
       ↓
결정적 평가: hex 정확히 일치? (순수 함수)
확률적 평가: "이 색상 조합이 브랜드 톤에 맞나?" (RAG + AI)
       ↓
{ violations: [...], score: 78, paths: [...] }
```

위반 경로를 캔버스에서 빨간색으로 하이라이트.

### Phase 3: 자동 개정 (R&D 탐색)

같은 규칙이 반복 위반되면 AI가 규칙 개정안을 트리플 diff로 제안.
Phase 2 결과에 따라 스코프 조정 예정.

---

## 9. 주요 설계 결정 (왜 이렇게?)

| 결정 | 이유 |
|------|------|
| kg-core가 순수 함수 | side-effect 없으면 테스트/디버깅이 쉬움. storage layer 교체도 가능 |
| 불변 operation | React 상태 관리와 자연스러운 통합. 변경 감지 용이 |
| kebab-case 강제 | 일관성. "BrandName"과 "brand-name"이 같은 타입으로 인식 |
| 파일 기반 저장 | R&D 단계에서 충분. DB 오버헤드 없이 빠른 개발 |
| RAG keyword 모드 | 벡터 DB 없이도 작동. 작은 그래프에서는 keyword가 충분 |
| Observe by Chat | AI 답변이 그래프와 연결되는 "와" 모먼트 제공 |
| kg-lint 별도 패키지 | kg-core 순수성 유지. 린터는 LLM 의존이 있어서 분리 |

---

## 10. 빠른 참조

### 실행

```bash
pnpm dev                    # 전체 실행
pnpm --filter @knowledgeview/editor dev   # editor만
```

### 포트

| 앱 | 포트 |
|----|------|
| editor | 3000 |
| rag-api | 3001 |
| generator | 3002 |

### 핵심 파일

| 찾고 싶은 것 | 파일 |
|-------------|------|
| 데이터 타입 정의 | `packages/kg-core/src/types.ts` |
| 그래프 CRUD | `packages/kg-core/src/operations.ts` |
| 규칙 검증 | `packages/kg-core/src/validator.ts` |
| JSON 직렬화 | `packages/kg-core/src/serializer.ts` |
| RAG 파이프라인 | `packages/graph-rag/src/index.ts` |
| 캔버스 렌더링 | `apps/editor/src/components/graph/canvas.tsx` |
| AI 채팅 | `apps/editor/src/components/panels/chat-panel.tsx` |
| 그래프 상태 훅 | `apps/editor/src/hooks/use-graph.ts` |
| 실제 데이터 | `data/worxphere.kg.json` |

### 관련 문서

| 문서 | 내용 |
|------|------|
| `docs/specs/architecture.md` | 코드 구조, 컴포넌트 트리, CSS |
| `docs/specs/api.md` | API 스펙 |
| `docs/specs/ontology-design.md` | 온톨로지 설계 |
| `docs/guides/git-convention.md` | Git 브랜치/커밋 규칙 |
| `TODOS.md` | 할 일 목록 |
| `CLAUDE.md` | AI 코딩 도우미 규칙 |

---

## 11. 문서 컨벤션

### 파일 구조

```
루트/ (도구 설정, SCREAMING_CASE)
├── CLAUDE.md             AI 코딩 도우미 설정 (Claude Code 표준)
├── AGENTS.md             프레임워크 경고 (Claude Code 표준)
├── TODOS.md              할 일 목록
└── README.md             프로젝트 소개

docs/ (사람이 읽는 문서, kebab-case)
├── guides/               가이드/튜토리얼
│   ├── tutorial.md         프로젝트 전체 가이드 (이 파일)
│   └── git-convention.md   Git 브랜치/커밋 규칙
├── specs/                설계/스펙 문서
│   ├── architecture.md     코드 구조 (컴포넌트 트리, 훅, D3)
│   ├── api.md              API 스펙
│   └── ontology-design.md  온톨로지 설계
└── archive/              과거 문서 (읽기 전용)
    └── 2026-03-30-mvp/     MVP 단계 자동 생성 문서
        ├── plans/
        └── specs/

패키지별 CLAUDE.md (해당 패키지의 AI 코딩 규칙)
├── apps/editor/CLAUDE.md
├── apps/rag-api/CLAUDE.md
├── packages/kg-core/CLAUDE.md
└── packages/graph-rag/CLAUDE.md
```

### 네이밍 규칙

| 위치 | 네이밍 | 예시 |
|------|--------|------|
| 루트 | SCREAMING_CASE | `CLAUDE.md`, `TODOS.md` |
| docs/ | kebab-case | `architecture.md`, `git-convention.md` |
| docs/archive/ | 날짜-설명/ | `2026-03-30-mvp/` |
| 패키지 | SCREAMING_CASE (CLAUDE.md만) | `apps/editor/CLAUDE.md` |

### 새 문서 추가 시

- **가이드/튜토리얼** → `docs/guides/이름.md`
- **설계/스펙** → `docs/specs/이름.md`
- **과거 문서 보관** → `docs/archive/날짜-설명/`
- **AI 도구 설정** → 루트 또는 패키지 루트에 SCREAMING_CASE
