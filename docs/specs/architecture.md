# Architecture

## Monorepo 구조

```
@knowledgeview/root (pnpm + turborepo)
├── apps/
│   ├── editor          # Next.js 16 — 그래프 편집 UI
│   └── rag-api         # Next.js 16 — RAG 질의 API 서버
├── packages/
│   ├── kg-core         # 순수 함수: 타입, CRUD, 검증, 직렬화, normalizeType
│   └── graph-rag       # RAG 파이프라인: 엔티티 추출 → BFS → 컨텍스트
├── data/               # 런타임 KG 데이터 (.kg.json)
├── scripts/            # 데이터 변환 스크립트
└── __tests__/          # 루트 레벨 통합 테스트
```

**의존 관계:** `editor → kg-core`, `rag-api → graph-rag → kg-core`

## Editor 앱 상세

### 컴포넌트 위계

```
ui/            ← ① shadcn 원자 (button, input, badge...)
patterns/      ← ② 조합 (dialog, tabs, search-overlay...)
blocks/        ← ③ 도메인 데이터 단위 (property/, node/, triple/...)
layout/        ← ④ 앱 골격 (left-sidebar, right-sidebar)
graph/         ← D3 캔버스 (위계 밖)
```

의존 방향: `ui → patterns → blocks → layout → graph` (역방향 금지)

### 컴포넌트 트리

```
page.tsx — 훅 조합 + 3단 레이아웃 (오케스트레이터)
├── AppSidebarLeft  [layout]   좌측 래퍼 (w-[220px] + border-r)
│   └── Sidebar  [blocks]   그래프 목록, 타입 필터, 규칙 결과
├── AppGraph  [layout]   중앙 래퍼 (flex-1 flex-col)
│   ├── GraphHeader  [layout]   툴바 (노드/관계 추가 + 통계 + 저장)
│   │   └── GraphInfo  [blocks]   노드·관계·규칙 카운트 표시
│   ├── SearchOverlay  [patterns]  ⌘K 검색 오버레이
│   ├── Canvas  [graph]   D3 force simulation (SVG) ← graph 직접 접근 허용 (예외)
│   └── NodeContextMenu            노드 우클릭 메뉴
├── AppSidebarRight  [layout]   우측 래퍼 (w-[350px] + border-l)
│   └── DetailPanel [blocks]  속성 탭 + AI 채팅 탭
│       ├── NodeInfoPanel [blocks/node]   노드 상세
│       ├── EdgeInfoPanel [blocks/edge]   엣지 상세
│       └── ChatPanel     [blocks]        AI 채팅
└── Dialogs (모달, useDialog × 3)
    ├── NodeForm   [blocks/node]     노드 생성/편집
    ├── TripleForm [blocks/triple]   관계 생성/편집
    └── RuleForm   [blocks/rule]     규칙 생성/편집
```

### 훅 구조

| 훅 | 역할 |
|----|------|
| `useGraph(null)` | 핵심 — 그래프 상태 + 저장/로드 + isDirty + 파생 데이터(stats, systemPrompt, linkTypes) |
| `useNode({...})` | 노드 도메인 — CRUD + getNode/getNodeLabel/nodeTypes/existingTypes/getRelations |
| `useTriple({...})` | 트리플 도메인 — CRUD + getTriple/predicates |
| `useRule({...})` | 룰 도메인 — CRUD + getRule/results(사용자 규칙만 필터링) |
| `useDialog()` | UI 상태 — 모달 open/close/editingId (도메인 무관, 재사용 가능) |
| `useValidation(graph)` | 그래프 변경마다 자동 검증 → violatedNodeIds/TripleIds |
| `useSelection()` | 단일 선택 (node \| edge \| null) |
| `useContextMenu()` | 우클릭 메뉴 상태 |
| `useSearch(nodes, { onOpen })` | ⌘K 검색 상태 + 키보드 단축키 |

### 은닉화 원칙

- **컴포넌트는 `graph` 객체를 모른다** — Canvas를 제외한 모든 컴포넌트에서 `KnowledgeGraph` 타입을 import하지 않는다
- **데이터 접근(읽기 포함)은 훅을 통해** — `find`, `filter`, `map` 등 데이터 로직은 도메인 훅에서 처리하고, 컴포넌트는 가공된 결과만 prop으로 받는다
- **CRUD와 UI 상태 분리** — 데이터 조작은 도메인 훅(`useNode`, `useTriple`, `useRule`), 모달 열기/닫기는 `useDialog`
- **React Compiler 활성화** — `useCallback`/`useMemo` 수동 메모이제이션 불필요 (컴파일러가 자동 최적화)

### Canvas (D3) 모듈 구조

```
components/graph/
├── canvas.tsx              메인 — useEffect 2개 (구조/스타일 분리)
├── canvas-types.ts         타입 + nodeColor/nodeSize/hexToRgba 유틸
├── rendering/
│   ├── create-defs.ts      SVG defs (화살표, 글로우 필터)
│   ├── render-edges.ts     엣지 선 + 라벨 (class: .link-label)
│   └── render-nodes.ts     노드 원 + 아이콘(.node-icon) + 라벨(.node-label)
├── core/
│   ├── create-simulation.ts  D3 force simulation 생성
│   └── fit-to-view.ts       시뮬레이션 종료 후 뷰 맞춤
└── styles/
    └── update-styles.ts    선택/위반/포커스 상태별 스타일 갱신
```

**핵심 패턴:**
- 두 개의 useEffect: 구조 변경(`[graph.nodes, graph.triples, graph.schema]` — 시뮬레이션 재구성) + 스타일 변경(선택/위반만 갱신, 룰 변경 시 리빌드 없음)
- 이벤트 핸들러는 ref에 저장 → stale closure 방지
- 노드 색상/크기는 type 기반 (canvas-types.ts의 NODE_COLORS/NODE_SIZES)
- 더블클릭 = focus mode (비이웃 노드 dimmed)

### CSS 구조

```
app/styles/
├── typography.css      --font-sans/--font-mono 토큰 + body/code 적용
├── canvas.css          .link-label(Geist Mono), .node-label, .node-icon
├── overrides.css       Radix ScrollArea 등 서드파티 오버라이드
└── chat.css            .chat-markdown (채팅 패널 마크다운 스타일)
```

`globals.css`는 Tailwind 임포트 + @theme 토큰(OKLch) + @layer base만 담당.

### API 라우트

| 경로 | 메서드 | 역할 |
|------|--------|------|
| `/api/graphs` | GET | 그래프 목록 (`data/*.kg.json` 스캔) |
| `/api/graphs` | POST | 새 그래프 생성 |
| `/api/graphs/[filename]` | GET/PUT/DELETE | 개별 그래프 CRUD |
| `/api/chat` | POST | AI 채팅 (graph-rag → Anthropic 스트리밍) |

## kg-core 패키지

### 도메인 모델

- `Node` — `{ id, label, type? }` — type은 kebab-case (normalizeType 자동 정규화)
- `Triple` — `{ id, subject, predicate, object }` — subject/object는 nodeId
- `Rule` — `{ id, name, expression, type, condition }` — condition.operator: must_have | must_not_have | conflicts_with
- `KnowledgeGraph` — `{ metadata, nodes[], triples[], rules[] }`

### 핵심 규칙

- 모든 operation은 불변 — 새 KnowledgeGraph 반환
- addNode/updateNode/addRule은 type을 자동 정규화 (normalizeType)
- fromJSON도 로드 시 정규화 적용
- removeNode는 연관 Triple도 함께 제거
- metadata.updated는 모든 변경 시 자동 갱신

## Data Methodology (SPO + FOL)

설계 스펙: `docs/archive/2026-03-30-mvp/specs/2026-03-30-knowledgeview-design.md`
로드맵: `docs/archive/2026-03-30-mvp/specs/2026-03-30-knowledgeview-roadmap.md`

### SPO (Subject-Predicate-Object)

```
(Subject) ──[Predicate]──→ (Object)
   노드         엣지          노드
```

- 모든 관계는 방향 있는 SPO 트리플로 표현
- Predicate는 자유 텍스트

### FOL (First-Order Logic) 규칙

- Rule의 expression에 FOL 표현식 저장
- GUI 조건 빌더(condition)로 생성, FOL은 미리보기 용도
- 검증은 condition의 3가지 operator로 수행
- 검증 엔진: `packages/kg-core/src/validator.ts`
