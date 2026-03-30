# AI 채팅 — 그래프 대화형 탐색

> 현재 로드된 지식 그래프를 맥락으로 활용하여 AI와 자유롭게 대화하며 그래프를 탐색하는 기능

## 결정사항 요약

| 항목          | 결정                                                                |
| ------------- | ------------------------------------------------------------------- |
| 배치          | 디테일 패널 내 탭 ("속성" / "AI 채팅")                              |
| 그래프 범위   | 현재 로드된 그래프 파일 전체 (노드, 트리플, 룰, 검증결과)           |
| AI 모델       | Claude (Anthropic SDK 직접 호출)                                    |
| 인증          | `.env.local`의 `ANTHROPIC_API_KEY`                                  |
| UI 프레임워크 | shadcn 컴포넌트 최대 활용, 기존 테마(다크 모드, neutral OKLCH) 존중 |
| 스트리밍      | AI SDK `streamText` + `useChat`                                     |

## 아키텍처

```
[디테일 패널]
  ├─ "속성" 탭 → 기존 detail-panel 내용 (노드/엣지 속성, 관계 목록)
  └─ "AI 채팅" 탭 → ChatPanel 컴포넌트
       │
       useChat (@ai-sdk/react)
       │
       POST /api/chat
       │
       ├─ 그래프 데이터를 system prompt로 변환
       └─ streamText (@ai-sdk/anthropic) → Claude API
```

## 컴포넌트 설계

### 1. detail-panel.tsx (수정)

기존 디테일 패널을 shadcn `Tabs`로 감싼다:

```
<Tabs defaultValue="properties">
  <TabsList>
    <TabsTrigger value="properties">속성</TabsTrigger>
    <TabsTrigger value="chat">AI 채팅</TabsTrigger>
  </TabsList>
  <TabsContent value="properties">
    {/* 기존 디테일 패널 내용 그대로 */}
  </TabsContent>
  <TabsContent value="chat">
    <ChatPanel graph={graph} />
  </TabsContent>
</Tabs>
```

- 그래프 미로드 시: 기존 empty state 유지, 탭 비활성화
- 탭 전환 시 채팅 히스토리 유지 (ChatPanel이 언마운트되지 않도록 처리)

### 2. chat-panel.tsx (신규)

디테일 패널 안에 들어가는 채팅 UI:

```
구조:
┌─────────────────────┐
│ 메시지 목록 (scroll) │  ← 사용자/AI 메시지, 스트리밍 표시
│                     │
│                     │
├─────────────────────┤
│ [입력창] [전송 버튼]  │  ← shadcn Input + Button
└─────────────────────┘
```

**메시지 렌더링:**

- 사용자 메시지: 오른쪽 정렬, muted 배경
- AI 메시지: 왼쪽 정렬, card 배경
- 스트리밍 중: 깜빡이는 커서 표시
- AI 응답의 마크다운은 간단한 prose 스타일링 (볼드, 리스트 정도)

**shadcn 컴포넌트 사용:**

- `ScrollArea` — 메시지 목록 스크롤
- `Input` 또는 `Textarea` — 메시지 입력
- `Button` — 전송 버튼 (Lucide `Send` 아이콘)
- `Avatar` — 사용자/AI 아바타 (선택적)
- `Badge` — 그래프 로드 상태 표시

**상태 관리:**

- `useChat` 훅이 메시지 배열, 입력값, 로딩 상태 관리
- 그래프 변경 시 대화 리셋하지 않음 (맥락은 매 요청마다 최신 그래프 전송)

### 3. /api/chat/route.ts (신규)

Route Handler:

```
POST /api/chat
Body: { messages: Message[], graph: KnowledgeGraph }

1. 그래프 데이터를 system prompt 텍스트로 변환
2. streamText 호출 (Anthropic provider, claude-sonnet-4-5)
3. 스트리밍 응답 반환
```

**System Prompt 구성:**

```
당신은 브랜드 디자인 시스템 지식 그래프 분석 전문가입니다.
사용자가 현재 보고 있는 그래프 데이터를 기반으로 질문에 답변합니다.

## 현재 그래프: {metadata.name}

### 노드 ({nodes.length}개)
- {label} (타입: {type})
...

### 관계 ({triples.length}개)
- {subject.label} --[{predicate}]--> {object.label}
...

### 규칙 ({rules.length}개)
- {name}: {expression} (타입: {type})
  - 검증 결과: {pass/fail, 위반 노드 목록}
...
```

**그래프 → 텍스트 변환 함수:**

- `serializeGraphForPrompt(graph: KnowledgeGraph): string`
- 노드 라벨과 타입, 트리플의 주어/술어/목적어를 사람이 읽을 수 있는 형태로 변환
- 룰 검증 결과도 포함하여 AI가 위반 사항에 대해 논의 가능

## 데이터 플로우

1. 사용자가 채팅 탭에서 메시지 입력 → Enter 또는 전송 버튼
2. `useChat`이 `/api/chat`로 POST
    - 메시지 히스토리 + 현재 그래프 JSON을 body에 포함
3. Route Handler가:
    - 그래프를 system prompt 텍스트로 변환
    - `convertToModelMessages(messages)` 로 메시지 변환
    - `streamText`로 Claude 호출
    - `toUIMessageStreamResponse()`로 스트리밍 반환
4. 클라이언트에서 실시간 렌더링

## 기술 스택

### 새로 설치할 패키지

- `ai` — AI SDK core
- `@ai-sdk/react` — useChat 훅
- `@ai-sdk/anthropic` — Claude provider

### 새로 추가할 shadcn 컴포넌트

- `tabs` — 디테일 패널 탭 전환
- `scroll-area` — 채팅 메시지 스크롤
- 기존 `button`, `input`, `badge` 재사용

### 기존 테마 존중 사항

- 다크 모드 고정 (`className="dark"`)
- neutral OKLCH 컬러 팔레트 — 채팅 버블에 `bg-card`, `bg-muted` 등 시맨틱 토큰 사용
- Geist Sans/Mono 폰트 유지
- `border-radius: 0.625rem` 등 기존 radii 준수
- 유일한 accent blue (`oklch(0.488 0.243 264.376)`) — AI 채팅 탭 강조에 활용 가능

## 스코프

### 포함

- 디테일 패널 탭 전환 (속성 ↔ AI 채팅)
- 채팅 메시지 목록 + 입력 UI
- 그래프 컨텍스트 기반 Claude API 호출
- 스트리밍 응답 렌더링
- 기본 마크다운 렌더링 (볼드, 리스트)

### 미포함

- 채팅으로 그래프 수정 (읽기 전용 탐색만)
- 대화 히스토리 영구 저장 (세션 내 메모리만)
- API 키 UI 입력 (환경변수 전용)
- 다국어 지원 (한국어 UI 유지)

## 파일 변경 목록

| 파일                                     | 변경 유형                                        |
| ---------------------------------------- | ------------------------------------------------ |
| `src/components/panels/detail-panel.tsx` | 수정 — Tabs 래핑                                 |
| `src/components/panels/chat-panel.tsx`   | 신규 — 채팅 UI                                   |
| `src/app/api/chat/route.ts`              | 신규 — Claude API Route Handler                  |
| `src/lib/kg-core/serializer.ts`          | 수정 — `serializeGraphForPrompt()` 추가          |
| `.env.local`                             | 수정 — `ANTHROPIC_API_KEY` 추가                  |
| `package.json`                           | 수정 — ai, @ai-sdk/react, @ai-sdk/anthropic 추가 |
