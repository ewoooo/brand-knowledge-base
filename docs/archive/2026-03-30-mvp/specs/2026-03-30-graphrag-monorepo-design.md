# GraphRAG 모노레포 설계

> KnowledgeView를 Turborepo 모노레포로 전환하고, GraphRAG 파이프라인을 공유 패키지 + API 서버로 구축한다.

## 배경

KnowledgeView는 브랜드 온톨로지 편집기로, Node/Triple/Rule 모델의 지식 그래프를 시각화하고 편집한다. 이 그래프를 GraphRAG 소스로 활용하여 자연어 질문 답변과 그래프 기반 추론/추천을 지원하려 한다.

로드맵에 계획된 evaluator(에셋 평가)와 generator(에셋 생성) 앱이 모두 GraphRAG 파이프라인을 공유하므로, 모노레포 전환과 GraphRAG 코어를 먼저 구축한다.

## 스코프

이번 작업의 범위:

1. Turborepo 모노레포 전환
2. `kg-core` 공유 패키지 추출 (현재 `src/lib/kg-core`)
3. `graph-rag` 공유 패키지 구축 (GraphRAG 파이프라인 코어)
4. `rag-api` Next.js API 서버 구축 (graph-rag를 HTTP로 노출)

evaluator, generator 앱은 다음 단계.

## 모노레포 구조

```
@KnowledgeView/
├── turbo.json
├── package.json                         # pnpm 워크스페이스 루트
├── apps/
│   ├── editor/                          # 현재 MVP 이동
│   │   ├── src/
│   │   │   ├── app/                     # 페이지, API 라우트 (그래프 CRUD)
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── lib/                     # editor 전용 유틸 (utils.ts)
│   │   └── package.json                 # @knowledgeview/editor
│   │
│   └── rag-api/                         # GraphRAG API 서버
│       ├── src/
│       │   └── app/
│       │       └── api/
│       │           ├── query/route.ts   # POST: 자연어 질문 → 스트리밍 답변
│       │           └── context/route.ts # POST: 서브그래프 컨텍스트 조회
│       └── package.json                 # @knowledgeview/rag-api
│
├── packages/
│   ├── kg-core/                         # 타입, CRUD, 직렬화, 검증
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── operations.ts
│   │   │   ├── validator.ts
│   │   │   └── serializer.ts
│   │   └── package.json                 # @knowledgeview/kg-core
│   │
│   └── graph-rag/                       # GraphRAG 파이프라인 코어
│       ├── src/
│       │   ├── extractor.ts             # 엔티티/키워드 추출
│       │   ├── traverser.ts             # N홉 서브그래프 탐색
│       │   ├── context-builder.ts       # 서브그래프 → 자연어 변환
│       │   └── index.ts                 # 파이프라인 통합 함수
│       └── package.json                 # @knowledgeview/graph-rag
│
└── data/                                # 공유 .kg.json 데이터
```

### 패키지 경계

- `kg-core`: 순수 TypeScript, 외부 의존성 0개. React/Next.js 무관.
- `graph-rag`: `kg-core` + `ai` (AI SDK 코어). 서브그래프 추출과 컨텍스트 변환.
- `rag-api`: `graph-rag`를 Next.js Route Handler로 감싸는 얇은 HTTP 레이어.
- `editor`: `kg-core` + React/D3/shadcn. graph-rag에 의존하지 않음.

### 의존성 방향

```
kg-core (의존성 없음)
   ↑
graph-rag (kg-core + AI SDK)
   ↑
rag-api (graph-rag + Next.js)
editor (kg-core + React/D3)
```

## GraphRAG 파이프라인

### 데이터 흐름

```
사용자 질문 → extractor → traverser → context-builder → LLM (또는 컨텍스트만 반환)
                 │              │              │
            엔티티 추출    N홉 탐색      자연어 변환
```

### extractor.ts — 엔티티 추출

질문에서 그래프 탐색의 시작점이 될 엔티티를 찾는다.

**키워드 모드 (기본)**:

- 질문 텍스트를 토큰화
- 각 토큰을 그래프 노드 label과 매칭 (완전 일치 + 부분 매칭)
- predicate 키워드도 매칭하여 힌트로 저장

**LLM 모드 (폴백)**:

- 키워드 모드에서 매칭 0개일 때 자동 전환
- AI SDK `generateText()` + `Output.object()`로 구조화된 엔티티 추출
- 노드 목록을 프롬프트에 포함하여 정확도 향상

**출력 타입**:

```typescript
interface ExtractionResult {
    entities: {
        nodeId: string;
        label: string;
        matchType: "exact" | "partial" | "semantic";
    }[];
    predicateHints: string[];
    typeHints: string[];
    mode: "keyword" | "llm";
}
```

### traverser.ts — N홉 서브그래프 탐색

추출된 엔티티에서 BFS로 관련 서브그래프를 수집한다.

**알고리즘**: BFS (너비 우선 탐색)

- 양방향 탐색 (subject→object, object→subject)
- predicateHint 매칭 트리플 우선 포함
- 최대 노드 수 제한 (기본 50개)

**depth 전략**:
| 질문 유형 | depth | 이유 |
|-----------|-------|------|
| 직접 조회 | 1 | 한 다리만 건너면 답 |
| 관계 탐색 | 2 | 간접 연결까지 |
| 추천/추론 | 3 | 넓은 컨텍스트 필요 |

**출력 타입**:

```typescript
interface SubGraph {
    nodes: Node[];
    triples: Triple[];
    metadata: {
        startNodes: string[];
        depth: number;
        totalHops: number;
    };
}
```

### context-builder.ts — 자연어 컨텍스트 변환

서브그래프를 LLM이 이해할 수 있는 자연어 텍스트로 변환한다.

**변환 단계**:

1. 트리플 → 한국어 자연어 문장 ("[subject]는 [predicate]로 [object]를 가진다")
2. 노드 type 메타데이터 포함
3. kg-core validator로 규칙 검증, 위반 시 주의사항 추가
4. 마크다운 형식으로 구조화 (엔티티, 관계, 규칙 검증 섹션)

**토큰 예산 관리**: 컨텍스트가 길면 predicateHint 매칭 트리플 우선, 나머지는 요약.

### index.ts — 파이프라인 통합

```typescript
async function buildContext(
    graph: KnowledgeGraph,
    question: string,
    options?: { depth?: number; extractorMode?: "keyword" | "llm" },
): Promise<{
    context: string;
    subgraph: SubGraph;
    extraction: ExtractionResult;
}>;
```

하나의 함수로 extractor → traverser → context-builder를 순차 실행.

## API 엔드포인트

### POST /api/query — 스트리밍 AI 답변

풀 파이프라인: 질문 → 컨텍스트 추출 → LLM 스트리밍 응답.

```typescript
// 요청
{
  question: string;
  graphFile: string;
  options?: {
    depth?: number;
    extractorMode?: "keyword" | "llm";
    model?: string;  // AI Gateway 모델 (기본 anthropic/claude-sonnet-4.6)
  }
}

// 응답: SSE 스트리밍 (AI SDK toUIMessageStreamResponse)
```

시스템 프롬프트:

- 브랜드 온톨로지 전문가 역할 부여
- context-builder 출력을 컨텍스트로 주입
- 컨텍스트에 없는 정보는 추측하지 않도록 지시

### POST /api/context — 컨텍스트 조회 (비-AI)

AI 호출 없이 서브그래프와 자연어 컨텍스트만 반환. evaluator/generator가 자체 프롬프트에 조합하기 위한 엔드포인트.

```typescript
// 요청
{
  question: string;
  graphFile: string;
  options?: { depth?: number; extractorMode?: string }
}

// 응답
{
  context: string;
  subgraph: { nodes: Node[]; triples: Triple[] };
  extraction: ExtractionResult;
  metadata: { depth: number; nodeCount: number; tripleCount: number }
}
```

## 테스팅 전략

| 패키지      | 테스트 종류 | 내용                                                |
| ----------- | ----------- | --------------------------------------------------- |
| `kg-core`   | 단위 테스트 | types/operations/validator/serializer               |
| `graph-rag` | 단위 테스트 | extractor 매칭, traverser BFS, context-builder 변환 |
| `graph-rag` | 통합 테스트 | 풀 파이프라인 (질문 → 컨텍스트) — LLM mock          |
| `rag-api`   | API 테스트  | Route Handler 요청/응답 검증                        |

- `graph-rag` 단위 테스트는 LLM 없이 동작 (키워드 모드 + fixture 그래프)
- LLM 모드 테스트는 AI SDK mock provider 사용
- 테스트용 fixture 그래프 사용 (`data/` 실제 파일 아님)

## 기술 스택

- **모노레포**: Turborepo + pnpm 워크스페이스
- **프레임워크**: Next.js 16 (editor, rag-api 모두)
- **AI**: AI SDK v6 + AI Gateway (OIDC 인증)
- **테스트**: Vitest
- **배포**: Vercel (앱별 독립 배포)
