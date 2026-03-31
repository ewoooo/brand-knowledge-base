# KnowledgeView

지식 그래프 편집기 + RAG 파이프라인. 브랜드 가이드라인 등의 도메인 지식을 **노드-트리플-규칙** 구조로 시각화하고, AI 대화를 통해 탐색합니다.

## Architecture

```
apps/
├── editor        Next.js 16 — D3 기반 그래프 편집 UI (3패널 레이아웃)
├── rag-api       Next.js 16 — RAG 질의 API 서버
└── generator     Next.js 16 — 그래프 생성기

packages/
├── kg-core       순수 함수: 타입, CRUD, 검증, 직렬화
├── graph-rag     RAG 파이프라인: 엔티티 추출 → BFS → 컨텍스트
└── chat-core     채팅 코어 로직
```

**의존 관계:** `editor → kg-core`, `rag-api → graph-rag → kg-core`

## Getting Started

```bash
pnpm install
cp .env.example .env.local   # ANTHROPIC_API_KEY 설정
pnpm dev                     # 전체 워크스페이스 실행
```

| 앱 | 포트 |
|----|------|
| editor | `localhost:3000` |
| rag-api | `localhost:3001` |
| generator | `localhost:3002` |

## Scripts

```bash
pnpm dev          # 전체 dev 서버
pnpm build        # 전체 빌드
pnpm test         # 전체 테스트 (Vitest)
pnpm lint         # 전체 린트
```

## Tech Stack

Next.js 16 · React 19 · TypeScript 5 · D3 v7 · shadcn/ui · Tailwind CSS 4 · AI SDK v6 · Vitest · Turborepo · pnpm 10
