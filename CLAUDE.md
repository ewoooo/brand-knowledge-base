# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KnowledgeView는 지식 그래프(Knowledge Graph) 편집기 + RAG 파이프라인 프로젝트로, 브랜드 가이드라인 등의 도메인 지식을 노드-트리플-규칙 구조로 시각화하고 AI 대화를 통해 탐색할 수 있다.

상세 아키텍처: `docs/architecture.md` 참조 (에디터 파일 구조, 컴포넌트 트리, CSS 구조, D3 모듈 등)

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
- 포트 충돌 시: `lsof -ti:<포트> | xargs kill`

## Key Rules

- **`data/` 디렉토리는 프로젝트 루트에 위치** — API route에서 `process.cwd() + "data"`로 읽기/쓰기
- **kg-core는 순수 함수** — 불변 operation, side-effect 없음
- **Node type은 반드시 kebab-case** — `normalizeType()`이 자동 정규화
- **그래프 상태 직접 mutate 금지** — 반드시 `useGraph` 훅의 메서드 사용
- **선택은 항상 단일** — 노드 하나 OR 엣지 하나
- **UI 텍스트는 한국어**

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

## gstack

웹 브라우징은 gstack의 /browse 스킬을 사용할 것. mcp__claude-in-chrome__* 도구는 사용하지 않음.

사용 가능한 스킬: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex,
/cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn.

스킬이 동작하지 않으면 `cd .claude/skills/gstack && ./setup` 실행.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
