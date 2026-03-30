# graph-rag

지식 그래프에서 질문 관련 서브그래프를 추출하고 LLM 컨텍스트를 생성하는 RAG 파이프라인

## 명령어

```bash
pnpm test --filter @knowledgeview/graph-rag
```

## 파이프라인 구조

```
runPipeline(graph, question, options)
  1. extractEntities()  ← 질문에서 그래프 노드 매칭 (exact/partial)
  2. traverse()         ← 매칭된 노드에서 depth만큼 BFS 탐색
  3. buildContext()     ← 서브그래프 + 규칙을 텍스트로 직렬화
```

## 규칙

- `kg-core` 타입에 의존 — 자체 Node/Triple 타입 정의 금지
- `extractEntities`는 현재 keyword 모드만 구현 (llm 모드는 미구현)
- `maxNodes` 옵션으로 서브그래프 크기 제한 (기본값 50)
