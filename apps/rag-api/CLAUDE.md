# RAG API

지식 그래프 기반 RAG (Retrieval-Augmented Generation) 파이프라인 서버

## 명령어

```bash
pnpm dev --filter rag-api        # 개발 서버 (포트 3001)
pnpm build --filter rag-api
pnpm test --filter rag-api
```

## 아키텍처

```
POST /api/query    ← 질문 → graph-rag 파이프라인 → 서브그래프 JSON 응답
POST /api/context  ← 질문 → graph-rag 파이프라인 → Anthropic 스트리밍 응답
```

## 데이터 흐름

1. 요청에서 `graphFile` 받아 `data/` 디렉토리에서 `.kg.json` 로드
2. `graph-rag` 패키지의 `runPipeline(graph, question, options)` 실행
3. `/api/query`는 서브그래프 + 추출 결과 JSON 반환
4. `/api/context`는 컨텍스트를 시스템 프롬프트에 주입 → AI 스트리밍 응답

## 규칙

- 그래프 파일 경로에 path traversal 방어 필수 (`graph-loader.ts`에 구현됨)
- 컨텍스트에 없는 정보는 LLM이 추측하지 않도록 시스템 프롬프트에 명시
