# KnowledgeView — MVP 설계 문서

> 브랜드 온톨로지를 SPO 트리플로 수동 입력하고, D3 force graph로 시각화하며, 노드를 클릭해서 편집할 수 있는 웹앱.

## 배경

- 5년간 축적된 브랜드 가이드라인이 PDF로만 존재
- 브랜드마다 구조가 달라 고정 스키마로 통합이 어려움
- 온톨로지(SPO 트리플)로 유연하게 데이터화하여, 향후 브랜드 에셋 생성/평가에 활용
- 1-3개 브랜드로 시작, 확장 가능한 구조

## 데이터 모델

### SPO 트리플

모든 데이터는 Subject-Predicate-Object 트리플로 표현한다.

```
(Subject) ──[Predicate]──→ (Object)
   노드         엣지          노드
```

- **Subject/Object** = 그래프의 노드
- **Predicate** = 그래프의 엣지 (방향 있는 관계)
- Predicate는 자유 텍스트. 미리 정의된 관계 타입 없음.

### 타입 정의

```typescript
interface Triple {
    id: string; // 고유 ID
    subject: string; // 노드 ID
    predicate: string; // 관계 이름 (자유 텍스트)
    object: string; // 노드 ID
}

interface Node {
    id: string; // 시스템 내부 식별자 (slug)
    label: string; // 화면 표시 이름
    type?: string; // 선택적 분류 ("brand", "color", "typography", "concept")
}

interface Rule {
    id: string;
    name: string; // "브랜드는 프라이머리컬러 필수"
    expression: string; // FOL 표현식 "∀x (brand(x) → ∃y 프라이머리컬러(x, y))"
    type: "constraint" | "inference" | "validation";
    // 조건 빌더 데이터 (GUI에서 생성)
    condition: {
        nodeType: string; // 대상 노드 타입 ("brand")
        predicate: string; // 대상 관계 ("프라이머리컬러")
        operator: "must_have" | "must_not_have" | "conflicts_with";
        conflictPredicate?: string; // operator가 "conflicts_with"일 때
    };
}

interface KnowledgeGraph {
    metadata: {
        name: string;
        created: string;
        updated: string;
    };
    nodes: Node[];
    triples: Triple[];
    rules: Rule[];
}
```

### 저장 포맷

- 브랜드별 `.kg.json` 파일 (`data/brand-a.kg.json`)
- DB 없이 파일 기반. Git으로 버전관리 가능.
- 향후 모노레포 앱에서 같은 파일을 직접 import.

### 예시 데이터

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
        {
            "id": "font-pretendard",
            "label": "Pretendard",
            "type": "typography"
        },
        { "id": "tone-warm", "label": "따뜻하고 친근한", "type": "concept" }
    ],
    "triples": [
        {
            "id": "t1",
            "subject": "brand-a",
            "predicate": "프라이머리컬러",
            "object": "color-ff5733"
        },
        {
            "id": "t2",
            "subject": "brand-a",
            "predicate": "주서체",
            "object": "font-pretendard"
        },
        {
            "id": "t3",
            "subject": "brand-a",
            "predicate": "톤앤매너",
            "object": "tone-warm"
        }
    ],
    "rules": [
        {
            "id": "r1",
            "name": "브랜드는 프라이머리컬러 필수",
            "expression": "∀x (brand(x) → ∃y 프라이머리컬러(x, y))",
            "type": "constraint",
            "condition": {
                "nodeType": "brand",
                "predicate": "프라이머리컬러",
                "operator": "must_have"
            }
        },
        {
            "id": "r2",
            "name": "프라이머리컬러와 금지색상 충돌 방지",
            "expression": "∀x ∀y (프라이머리컬러(x, y) → ¬금지색상(x, y))",
            "type": "validation",
            "condition": {
                "nodeType": "brand",
                "predicate": "프라이머리컬러",
                "operator": "conflicts_with",
                "conflictPredicate": "금지색상"
            }
        }
    ]
}
```

### 표준 호환성

- 현재 구조는 비표준 (SPO 트리플 + Node 메타데이터 하이브리드)
- RDF/OWL보다 단순하고 직관적. 브랜드 데이터에 충분.
- Protege export는 변환 레이어로 대응 가능 (Node → URI, Predicate → URI, type → rdf:type)
- 필요 시 JSON-LD export 기능 추가.

## 기술 스택

| 영역          | 기술                                                                                  |
| ------------- | ------------------------------------------------------------------------------------- |
| 프레임워크    | Next.js 16 (App Router)                                                               |
| 언어          | TypeScript                                                                            |
| 그래프 시각화 | D3.js (force-directed graph)                                                          |
| UI 컴포넌트   | shadcn/ui                                                                             |
| 스타일링      | Tailwind CSS                                                                          |
| 디자인 시스템 | shadcn/ui --preset b2fA                                                               |
| 디자인 상세   | style: nova, baseColor: neutral, theme: neutral, chartColor: neutral, radius: default |
| 메뉴          | default/solid, accent: subtle                                                         |
| 폰트          | Geist (heading + body)                                                                |
| 아이콘        | Lucide                                                                                |
| 패키지 매니저 | pnpm (향후 모노레포 전환 대비)                                                        |
| 데이터 저장   | 파일 기반 (.kg.json)                                                                  |
| 테마          | 다크 모드 기본                                                                        |

## UI 설계

### 3패널 레이아웃

```
┌──────────┬─────────────────────────┬────────────┐
│  좌측     │      중앙 캔버스         │   우측      │
│  사이드바  │    D3 Force Graph       │ 디테일 패널  │
│          │                         │            │
│ 파일 목록  │   (브랜드A)              │ 선택된 노드  │
│ 타입 필터  │    ├──→ (#FF5733)       │ label, type │
│          │    ├──→ (Pretendard)    │            │
│ ───────  │    └──→ (따뜻하고 친근한)   │ 연결된 트리플 │
│ 규칙 목록  │   위반 엣지: 빨간 점선 🔴  │ 편집/삭제    │
│ ✓통과/✗위반│   위반 알림 배너          │ 규칙 위반 상세│
└──────────┴─────────────────────────┴────────────┘
```

### shadcn 컴포넌트 매핑

| 영역                | 컴포넌트                                 |
| ------------------- | ---------------------------------------- |
| 좌측 파일 목록      | Sidebar, Command (검색)                  |
| 노드 타입 필터      | Badge, Toggle                            |
| 우측 디테일 패널    | Sheet 또는 Card                          |
| 노드/트리플 생성 폼 | Dialog + Input + Select                  |
| 트리플 목록         | 커스텀 리스트                            |
| 액션 버튼           | Button, AlertDialog                      |
| 규칙 목록 (좌측)    | Card + Badge (통과/위반/미확인)          |
| 규칙 생성 폼        | Dialog + Select + Combobox + ToggleGroup |
| 위반 알림 (캔버스)  | Alert                                    |
| 위반 상세 (우측)    | Alert (destructive variant)              |
| 규칙 삭제 확인      | AlertDialog                              |

### 노드 타입별 시각화

| type       | 스타일                |
| ---------- | --------------------- |
| brand      | 큰 원, 파란 계열      |
| color      | 실제 색상 스와치 표시 |
| typography | 서체 프리뷰 (Aa)      |
| concept    | 기본 원형, 회색       |

### 인터랙션

**캔버스:**

- 노드 드래그 → 위치 이동
- 노드 클릭 → 우측 패널에 디테일
- 빈 공간 더블클릭 → 새 노드 생성
- 스크롤 → 줌 인/아웃
- 배경 드래그 → 패닝

**편집:**

- "+ 노드" 버튼 → 노드 생성 Dialog (label, type 입력)
- "+ 트리플" 버튼 → S-P-O 입력 Dialog (Subject/Object는 기존 노드에서 선택, Predicate는 자유 텍스트)
- 우측 패널에서 선택 노드 편집/삭제
- 엣지 클릭 → Predicate 편집

**규칙:**

- "+ 규칙" 버튼 → 조건 빌더 Dialog (GUI로 조합, FOL 미리보기)
- 규칙 패턴 3가지: must_have (필수 관계), must_not_have (금지 관계), conflicts_with (충돌 방지)
- 트리플 변경 시 자동 검증 실행
- 위반 시: 좌측 규칙 목록에 ✗ 표시, 캔버스에 빨간 점선 엣지, 우측 패널에 위반 상세

## 프로젝트 구조

```
@KnowledgeView/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       └── graphs/
│   │           └── route.ts        # .kg.json CRUD API
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn
│   │   ├── graph/
│   │   │   ├── canvas.tsx          # D3 force graph ('use client')
│   │   │   ├── node-renderer.tsx   # 타입별 노드 렌더링
│   │   │   └── edge-renderer.tsx   # 엣지 + Predicate 라벨
│   │   ├── panels/
│   │   │   ├── sidebar.tsx         # 좌측: 파일목록, 필터, 검색
│   │   │   └── detail-panel.tsx    # 우측: 노드 디테일 + 트리플
│   │   └── forms/
│   │       ├── node-form.tsx       # 노드 생성/편집 폼
│   │       ├── triple-form.tsx     # 트리플 생성/편집 폼
│   │       └── rule-form.tsx       # 규칙 생성/편집 폼 (조건 빌더)
│   │
│   ├── lib/
│   │   ├── kg-core/
│   │   │   ├── types.ts            # Triple, Node, Rule, KnowledgeGraph 타입
│   │   │   ├── operations.ts       # CRUD 함수
│   │   │   ├── validator.ts        # FOL 규칙 검증 엔진
│   │   │   └── serializer.ts       # JSON 직렬화/역직렬화
│   │   └── d3/
│   │       ├── force-layout.ts     # D3 force simulation 설정
│   │       └── interactions.ts     # 드래그, 줌, 클릭 핸들러
│   │
│   └── hooks/
│       ├── use-graph.ts            # 그래프 상태 관리
│       ├── use-selection.ts        # 노드/엣지 선택 상태
│       └── use-rules.ts            # 규칙 상태 + 검증 결과
│
├── data/                           # .kg.json 파일 저장소
├── components.json                 # shadcn 설정
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── pnpm-lock.yaml
```

### 핵심 설계 결정

- **kg-core 분리**: `lib/kg-core/`에 타입, CRUD, 직렬화를 격리. 향후 모노레포의 `packages/kg-core`로 그대로 추출.
- **파일 기반 저장**: API Route로 `data/` 폴더의 `.kg.json` 파일 CRUD. DB 없이 시작.
- **D3 = 'use client'**: 그래프 캔버스는 클라이언트 컴포넌트. SVG 렌더링 + 인터랙션은 브라우저에서.
- **다크 모드 기본**: 그래프 에디터에 시각적으로 적합.

## MVP 기능 범위

- 그래프 파일 CRUD (.kg.json 생성, 열기, 저장, 삭제)
- 노드 생성/편집/삭제 (label, type 입력)
- 트리플 폼 기반 S-P-O 생성/편집/삭제
- D3 force-directed graph 시각화 (줌, 패닝, 노드 드래그)
- 노드 타입별 시각 구분 (brand, color, typography, concept)
- 노드 선택 → 우측 디테일 패널 (정보 + 연결된 트리플)
- 엣지에 Predicate 라벨 표시
- 3패널 레이아웃 (좌측 사이드바 + 중앙 캔버스 + 우측 디테일)
- FOL 규칙 시스템 (조건 빌더 GUI로 생성, 자동 검증, 위반 시각화)
- 다크 모드
