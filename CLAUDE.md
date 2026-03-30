# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KnowledgeView는 지식 그래프(Knowledge Graph) 편집기 + RAG 파이프라인 프로젝트로, 브랜드 가이드라인 등의 도메인 지식을 노드-트리플-규칙 구조로 시각화하고 AI 대화를 통해 탐색할 수 있다.

## Commands

```bash
pnpm dev          # 전체 워크스페이스 dev (아래 포트 참고)
pnpm build        # 전체 빌드
pnpm test         # 전체 테스트 (vitest)
pnpm lint         # 전체 린트

# 개별 앱/패키지 실행
pnpm --filter @knowledgeview/editor dev
pnpm --filter @knowledgeview/rag-api dev
pnpm --filter @knowledgeview/kg-core test
pnpm --filter @knowledgeview/graph-rag test

# 단일 테스트 파일 실행
pnpm --filter @knowledgeview/kg-core exec vitest run src/__tests__/operations.test.ts

# 변환 스크립트 (raw JSON → .kg.json)
npx tsx scripts/convert-worxphere.ts
```

## Ports

| 앱 | 포트 |
|----|------|
| editor | 3000 |
| rag-api | 3001 |
| generator | 3002 |

- 새 앱 추가 시 다음 번호(3003~)를 순차 할당
- `pnpm dev` 실행 전 포트 충돌 에러(`EADDRINUSE`) 발생 시: `lsof -ti:<포트> | xargs kill`로 점유 프로세스 종료

## Monorepo Architecture

```
@knowledgeview/root (pnpm + turborepo)
├── apps/
│   ├── editor          # Next.js 16 — 그래프 편집 UI (D3 시각화, shadcn/ui, AI 채팅)
│   └── rag-api         # Next.js 16 — RAG 질의 API 서버
├── packages/
│   ├── kg-core         # 순수 함수 라이브러리: 타입, CRUD operations, 검증, 직렬화
│   └── graph-rag       # RAG 파이프라인: 엔티티 추출 → BFS 순회 → 컨텍스트 빌드
├── data/               # 런타임 KG 데이터 (.kg.json). API가 직접 읽기/쓰기함
├── scripts/            # 데이터 변환 스크립트
└── __tests__/          # 루트 레벨 통합 테스트
```

**의존 관계:** `editor → kg-core`, `rag-api → graph-rag → kg-core`

## Data Methodology (SPO + FOL)

이 프로젝트의 지식 그래프는 **SPO 트리플**과 **FOL 규칙** 기반으로 설계되어 있다. 데이터 모델 변경이나 규칙 관련 작업 전에 반드시 아래 문서를 확인할 것:

- 설계 스펙: `docs/superpowers/specs/2026-03-30-knowledgeview-design.md` (데이터 모델 섹션)
- 로드맵: `docs/superpowers/specs/2026-03-30-knowledgeview-roadmap.md`

### SPO (Subject-Predicate-Object)

```
(Subject) ──[Predicate]──→ (Object)
   노드         엣지          노드
```

- 모든 관계는 방향 있는 SPO 트리플로 표현
- Predicate는 자유 텍스트 (미리 정의된 관계 타입 없음)
- 비표준 구조 (SPO + Node 메타데이터 하이브리드). RDF/OWL보다 단순, 브랜드 데이터에 충분

### FOL (First-Order Logic) 규칙

- Rule의 `expression`에 FOL 표현식 저장 (예: `∀x (brand(x) → ∃y 프라이머리컬러(x, y))`)
- GUI 조건 빌더(`condition`)로 생성, FOL은 사람이 읽는 미리보기 용도
- 검증은 `condition`의 3가지 operator로 수행: `must_have`, `must_not_have`, `conflicts_with`
- 검증 엔진: `packages/kg-core/src/validator.ts`

## Key Architectural Decisions

- **`data/` 디렉토리는 프로젝트 루트에 위치** — API route에서 `process.cwd() + "data"`로 런타임 읽기/쓰기를 수행하므로 `src/`로 옮기면 안 됨
- **kg-core는 순수 함수** — 모든 operation은 불변(immutable)하게 새 그래프를 반환하며 metadata.updated를 자동 갱신
- **Rule 시스템** — `type`("constraint" | "inference" | "validation")과 `condition`(nodeType, predicate, operator)을 함께 사용. `inference`는 시스템 자동 추론용이므로 사용자 UI에 노출 불필요
- **RAG 파이프라인** — keyword 기반 엔티티 추출 → BFS 서브그래프 순회 → 한국어 마크다운 컨텍스트 생성

## Core Domain Types (kg-core)

- `Node` — `{ id, label, type? }` 지식 개체
- `Triple` — `{ id, subject, predicate, object }` 관계 (subject/object는 Node.id)
- `Rule` — `{ id, name, expression, type, condition }` 규칙
- `KnowledgeGraph` — `{ metadata, nodes[], triples[], rules[] }` 전체 그래프

## Environment

`.env.local`에 `ANTHROPIC_API_KEY` 설정 필요 (AI 채팅 기능용)

## Tech Stack

- Next.js 16, React 19, TypeScript 5
- D3 v7 (그래프 시각화)
- shadcn/ui + Radix UI + Tailwind CSS 4
- AI SDK v6 + @ai-sdk/anthropic (스트리밍 채팅)
- Vitest (테스트), Turborepo (빌드 오케스트레이션), pnpm 10

@AGENTS.md

## Frontend Rules

- 프론트엔드/UI 작업 시 반드시 context7 MCP와 shadcn MCP를 활용할 것
- 인풋/텍스트 UI 작업 시 overflow 예외처리를 항상 고려할 것 (긴 텍스트, 줄바꿈, 말줄임 등)
- UI 제작 시 반드시 다음 스킬을 실행할 것: `interface-design`, `shadcn`, `react-best-practices`

## Development Rules

- 모든 신규 기능 개발 작업 전에 context7 MCP로 관련 라이브러리/프레임워크의 최신 문서를 확인할 것
- 기능 개발 시 반드시 `test-driven-development` 스킬을 실행할 것 (테스트 먼저 작성)

## Git Rules

@GIT_CONVENTION.md

- 새로운 기능/수정 작업 시작 시 반드시 main에서 feature 브랜치를 생성할 것 (`using-git-worktrees` 스킬 실행)
- PR 생성 시 반드시 다음 스킬을 실행할 것: `verification-before-completion`, `requesting-code-review`, `finishing-a-development-branch`
