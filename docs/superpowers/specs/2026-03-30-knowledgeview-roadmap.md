# KnowledgeView — 향후 로드맵

> MVP 이후 확장 계획. 우선순위는 상황에 따라 조정.

## 규칙 시스템 확장

### 추가 규칙 패턴
- 범위 제약: "color 타입 노드의 명도 값은 0-100 사이"
- 카디널리티: "brand 타입 노드는 프라이머리컬러를 최대 3개까지"
- 추론: "프라이머리컬러(x, y) ∧ 명도(y, 밝음) → 톤앤매너(x, 밝은)"

### 규칙 Import/Export
- 규칙 세트를 별도 파일로 관리 (.rules.json)
- 브랜드 간 규칙 공유/복제

## UX 개선

### 캔버스 드래그 연결
- 노드 가장자리에서 드래그 시작 → 다른 노드에 드롭 → Predicate 입력 팝오버
- 폼 기반 트리플 생성의 보완. 직관적 엣지 생성 UX.

### 검색/필터
- 노드 이름, Predicate 키워드 검색
- 노드 타입별 필터링 (토글로 표시/숨김)
- 특정 노드 중심 서브그래프 탐색

### Undo/Redo
- 편집 이력 스택 관리
- Cmd+Z / Cmd+Shift+Z 단축키

## 데이터 기능

### PDF AI 추출
- 브랜드 가이드라인 PDF 업로드
- AI가 개념과 관계를 파싱하여 SPO 트리플로 변환
- 사용자가 그래프 위에서 수동 보정
- AI SDK + AI Gateway 활용

### Export 기능
- **Protege (OWL/RDF)**: Node → URI, Predicate → URI, type → rdf:type 변환
- **JSON-LD**: @context 추가하여 표준 호환
- **CSV**: 트리플을 S,P,O 테이블로 내보내기

### DB 전환
- 파일 기반에서 DB로 전환 (Neon Postgres 또는 그래프 DB)
- 대규모 그래프, 다중 사용자 시 필요

## 모노레포 확장

```
@KnowledgeView/                     # Turborepo 루트
├── apps/
│   ├── editor/                     # 현재 MVP (그대로 이동)
│   ├── evaluator/                  # 에셋 평가 앱
│   └── generator/                  # 이미지/텍스트 생성 앱
│
├── packages/
│   └── kg-core/                    # 공유: 타입, CRUD, 직렬화
│       └── (lib/kg-core에서 추출)
│
└── data/                           # 공유 .kg.json 데이터
```

### 평가 앱 (evaluator) — GraphRAG 기반
- 브랜드 에셋(이미지, 텍스트)을 온톨로지 기준으로 평가
- **GraphRAG 파이프라인:**
  1. 평가 요청에서 키워드 추출
  2. SPO 트리플에서 관련 서브그래프 검색 (N홉 탐색)
  3. 서브그래프 → 자연어 컨텍스트 변환
  4. VLM(Vision Language Model)에 이미지 + 컨텍스트 전달
  5. FOL 규칙 자동 검증 (kg-core의 validator.ts 재사용)
- **GraphRAG 인덱스 구성:**
  - .kg.json 파일이 인덱스 소스
  - 노드 label → 벡터 임베딩 (의미 검색)
  - 트리플 → 그래프 경로 탐색 (관계 기반 검색)
  - Rules → 자동 규칙 검증
- 일반 RAG(텍스트 청크 검색) 대비 장점: 관계 추론이 강하고, "이 색상이 이 브랜드에 맞는가?"를 그래프 경로로 정확히 판단

### 생성 앱 (generator)
- 온톨로지 기반으로 브랜드 에셋 생성 (이미지 + 텍스트)
- GraphRAG로 관련 트리플 검색 → 자연어 컨텍스트 변환 → AI에 전달
- 생성 → 평가(GraphRAG) → 재생성 피드백 루프

## 협업 기능

### 인증
- 사용자 로그인 (Clerk 또는 Sign in with Vercel)

### 실시간 동시편집
- 여러 사람이 같은 그래프를 동시에 편집
- CRDT 또는 OT 기반 충돌 해결

### 권한 관리
- 그래프별 읽기/쓰기 권한
- 팀 단위 접근 제어
