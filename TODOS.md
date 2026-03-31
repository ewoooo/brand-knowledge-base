# TODOS

## P0

### ~~DESIGN.md 생성 (/design-consultation)~~ ✅ 완료 (2026-03-31)
- Linear 스타일 기반 DESIGN.md 생성 완료
- v1(Industrial) → v2(Porto Rocha) → v3(Linear) 비교 후 v3 선택
- 모션 시스템: Emil Kowalski animations.dev 기반 추가
- **Source:** /design-consultation (2026-03-31)

### Phase 0: 온톨로지 구조 설계
- **What:** Palantir식 타입 레지스트리(NodeType, LinkType) 도입 + Combobox 교체 + RAG 스키마 주입
- **Why:** Phase 1의 PDF→KG 변환, Phase 2의 lint 정확도, Phase 3의 amendment 구조 모두 이 스키마에 의존. 이게 없으면 "어떤 구조로 변환할 것인가"가 정의되지 않은 채 데이터를 만들게 됨
- **구현:** kg-core에 TypeRegistry 인터페이스, .kg.json 스키마 확장, RAG 컨텍스트 주입, Triple Form Combobox
- **Effort:** M (CC: ~1시간)
- **Depends on:** 없음 (최선행)
- **Blocks:** Phase 1, Phase 2 결정적 규칙 엔진
- **Source:** /plan-ceo-review (2026-03-31), memory/project_ontology_upgrade.md

### Storage adapter 인터페이스 설계
- **What:** kg-core의 persistence layer를 추상화하여 파일/DB 교체 가능하게
- **Why:** 현재 .kg.json 파일 기반은 R&D에 충분하지만, 다중 사용자/에이전트 API 트래픽/복잡 쿼리 시 GraphDB 필요. 미리 인터페이스만 설계해두면 전환 비용 최소화
- **Effort:** S (CC: ~30분, 인터페이스 정의만)
- **When:** Phase 3 시작 시
- **Source:** /plan-ceo-review (2026-03-31)

## P1

### Phase 1→2 품질 게이트 스크립트
- **What:** .kg.json이 Phase 2 lint에 적합한지 검증하는 스크립트
- **Why:** Phase 1에서 만든 그래프 구조가 Phase 2의 규칙 탐색을 지원하는지 자동 확인. 이 검증 없이 Phase 2를 시작하면 그래프 구조 문제를 수일 뒤에야 발견
- **검증 항목:** 규칙 노드 존재 여부, 트리플 연결성 (고립 노드 경고), 타입 정규화 확인, 최소 노드/트리플 수
- **Effort:** S (CC: ~15분)
- **When:** Phase 1 완료 시 실행
- **Source:** /plan-ceo-review outside voice (2026-03-31)

### Phase 2 결정적 규칙 엔진
- **What:** 색상 hex 매칭, 폰트명 비교, 여백 수치 검증 등 AI 없이 확정적 판단 가능한 규칙 평가 로직
- **Why:** AI 자연어 평가는 비결정적 (동일 입력에 다른 결과 가능). 결정적 규칙을 병행하면 린터 신뢰도가 올라가고, 재현 가능한 결과를 보장
- **구현:** kg-lint 모듈 내 deterministic evaluator + RAG evaluator를 조합. 결정적 결과에는 confidence: 1.0, AI 결과에는 실제 confidence 점수
- **Effort:** M (CC: ~30분)
- **When:** Phase 2 구현 시
- **Source:** /plan-ceo-review outside voice (2026-03-31)

## P2

### Editor API route 테스트 추가
- **What:** /api/graphs (GET/POST/PUT/DELETE), /api/chat (POST) 통합 테스트 작성
- **Why:** kg-core/graph-rag는 테스트 커버리지 우수(★★★)인데 API route는 0%. Phase 2에서 /api/lint를 추가하기 전에 기존 route 패턴의 테스트 기반이 필요
- **구현:** apps/editor/src/__tests__/api/ 디렉토리에 route 테스트 추가, msw 또는 직접 route handler 호출
- **Effort:** S (CC: ~15분)
- **When:** Phase 2 시작 전
- **Source:** /plan-eng-review (2026-03-31)

### Editor lint proxy route
- **What:** editor/app/api/lint/route.ts — rag-api의 /api/lint를 프록시하는 route
- **Why:** editor(3000)에서 rag-api(3001)를 직접 호출하면 cross-origin 문제. editor에 proxy route를 두면 프론트엔드는 같은 오리진만 사용. kg-lint의 요청/응답 타입을 import하여 두 앱 간 타입 계약 유지
- **구현:** editor/app/api/lint/route.ts에서 rag-api 호출, kg-lint 패키지에서 타입 export
- **Effort:** S (CC: ~10분)
- **When:** Phase 2 구현 시 (lint 시각화와 함께)
- **Source:** /plan-eng-review outside voice (2026-03-31)

## P3

### 벡터 검색 기반 entity extraction 도입 검토
- **What:** graph-rag의 extractor를 keyword → 벡터 유사도 검색으로 교체 또는 병행
- **Why:** keyword 매칭은 질문에 노드 라벨/타입 키워드가 없으면 fallback(전체 그래프 덤프)으로 빠짐. 그래프가 커지면 fallback 토큰 비용이 급증하고, lint API 반복 호출 시 성능 병목. TypeRegistry + props가 도입된 시점이면 임베딩 품질도 높아짐
- **재검토 필요:** Phase 2 완료 시점에 fallback 비율과 토큰 비용을 측정해서 실제로 필요한지 판단. 71 노드 규모에서는 불필요, 300+ 노드 또는 lint API 반복 호출이 현실화되면 도입
- **구현 방향:** graph-rag/src/vector-extractor.ts 추가, mode: "vector" 분기. 노드 임베딩 = 라벨 + 타입 + props + 관계 텍스트. extractor만 교체하고 traverse/context-builder는 유지
- **Effort:** M (CC: ~1시간)
- **Depends on:** Phase 0 (TypeRegistry), Phase 2 완료 (측정 데이터)
- **Source:** 튜토리얼 세션 (2026-03-31)

### Amendment 저장 전략 재검토
- **What:** Phase 3의 개정 이력/상태를 그래프 내부에 저장할지, 별도 오버레이 구조로 분리할지 결정
- **Why:** amendment 노드를 브랜드 규칙과 같은 그래프에 넣으면 도메인 데이터와 운영 메타데이터가 혼재. Node.status 필드는 kg-core의 순수성에 영향. 별도 오버레이라면 두 번째 상태 관리 레이어가 필요
- **결정 시점:** Phase 2 완료 후, Phase 3 설계 시
- **고려 사항:** 도메인/운영 데이터 분리, Node.status 처리 방법, 감사 로그 쿼리 성능
- **Effort:** M (설계 결정 + 구현)
- **Source:** /plan-eng-review outside voice (2026-03-31)
