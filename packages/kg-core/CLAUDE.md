# kg-core

지식 그래프의 타입 정의, 불변 CRUD, 검증, 직렬화를 담당하는 순수 TypeScript 패키지

## 명령어

```bash
pnpm test --filter @knowledgeview/kg-core
pnpm test --filter @knowledgeview/kg-core -- src/__tests__/operations.test.ts  # 단일 테스트
```

## 도메인 모델

```
KnowledgeGraph
├── metadata: { name, created, updated }
├── nodes: Node[]          ← { id, label, type? }
├── triples: Triple[]      ← { id, subject, predicate, object }
└── rules: Rule[]          ← { id, name, expression, type, condition }
```

- **Node**: 개체. `type`은 kebab-case 문자열 (brand, color, typography, core-value 등). `normalizeType()`이 자동 정규화
- **Triple**: 관계. subject/object는 nodeId 참조
- **Rule**: 검증 규칙. condition.operator: `must_have | must_not_have | conflicts_with`

## 핵심 규칙

- **모든 operation은 불변** — 새 KnowledgeGraph 객체 반환, 원본 변경 금지
- **side-effect 없음** — React 의존성 없는 순수 함수
- `removeNode`는 연관된 Triple도 함께 제거
- `metadata.updated`는 모든 변경 시 자동 갱신
- `addNode`/`updateNode`/`addRule`은 type을 자동 정규화 (`normalizeType()`: PascalCase → kebab-case)
