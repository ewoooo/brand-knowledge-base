# 이미지 생성 앱 설계

> Nanobanana API(Gemini 2.5 Flash Image)를 사용하여 텍스트로부터 이미지를 생성하는 독립 Next.js 앱. 모노레포의 `apps/generator/`에 위치한다.

## 배경

브랜드 디자이너/마케터가 캠페인 에셋(배너, SNS 이미지 등)을 빠르게 생성할 수 있는 도구가 필요하다. 향후 KnowledgeView의 브랜드 온톨로지와 연동하여 브랜드 가이드라인 기반 이미지 생성을 지원할 예정이나, 1차 스코프에서는 독립적인 이미지 생성 앱으로 구축한다.

## 스코프

이번 작업의 범위:

1. `apps/generator/` Next.js 앱 생성
2. Nanobanana API 연동 (Server Action)
3. 프롬프트 입력 → 스타일 선택 → 생성 → 미리보기 → 다운로드 흐름 구현

스코프 밖:

- 브랜드 온톨로지 연동 (향후)
- 생성 히스토리/갤러리 (향후)
- 이미지 편집/수정 기능
- 다중 이미지 동시 생성

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS + Geist 폰트 |
| 이미지 생성 API | Nanobanana (`ImageGenerator` 클래스) |
| API 호출 방식 | Server Action (`'use server'`) |
| 인증 | `NANOBANANA_API_KEY` 환경변수 (`.env.local`) |
| 패키지명 | `@knowledgeview/generator` |

## 앱 구조

```
apps/generator/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃 (Geist 폰트, 다크 모드)
│   │   ├── page.tsx                # 메인 페이지 — 좌우 분할 레이아웃
│   │   ├── globals.css             # Tailwind + shadcn 테마 변수
│   │   └── actions/
│   │       └── generate.ts         # 'use server' — Nanobanana 호출 + 응답 처리
│   ├── components/
│   │   ├── generate/               # 이미지 생성 입력 관련
│   │   │   ├── prompt-form.tsx     # 프롬프트 텍스트 영역 + 생성 버튼
│   │   │   └── style-selector.tsx  # 스타일 토글 버튼 그룹
│   │   └── preview/                # 결과 미리보기 관련
│   │       └── image-preview.tsx   # 이미지 표시 + 다운로드 버튼
│   └── lib/
│       └── nanobanana.ts           # ImageGenerator 래퍼 (인증, 호출, 에러 핸들링)
├── .env.local                      # NANOBANANA_API_KEY=...
├── next.config.ts
├── package.json
└── tsconfig.json
```

## UI 레이아웃

좌우 분할 레이아웃:

- **왼쪽 패널**: 프롬프트 입력 영역 + 스타일 선택 + 생성 버튼
- **오른쪽 패널**: 생성된 이미지 미리보기 + 다운로드 버튼
- 입력과 결과를 동시에 볼 수 있어 반복 생성 시 효율적

### 왼쪽 패널 상세

1. **프롬프트 입력**: `<Textarea>` — 여러 줄 자연어 프롬프트
2. **스타일 선택**: 토글 버튼 그룹 — 단일 선택
   - 스타일 목록: `photorealistic`, `watercolor`, `oil-painting`, `sketch`, `pixel-art`, `anime`, `vintage`, `modern`, `abstract`, `minimalist`
3. **생성 버튼**: 로딩 중에는 스피너 표시, 중복 클릭 방지

### 오른쪽 패널 상세

1. **빈 상태**: 안내 텍스트 ("프롬프트를 입력하고 생성 버튼을 눌러주세요")
2. **로딩 상태**: 스켈레톤 또는 스피너
3. **결과 상태**: 생성된 이미지 + 다운로드 버튼
4. **에러 상태**: 에러 메시지 + 다시 시도 버튼

## 데이터 흐름

```
[prompt-form.tsx] (Client Component)
  │ 사용자가 프롬프트 입력 + 스타일 선택 + "생성" 클릭
  ↓
[actions/generate.ts] ('use server')
  │ 1. 입력 검증 (프롬프트 빈값 체크)
  │ 2. lib/nanobanana.ts로 ImageGenerator 호출
  │ 3. 결과 이미지를 base64로 변환
  │ 4. { success: true, image: "data:image/png;base64,..." } 반환
  ↓
[image-preview.tsx] (Client Component)
  │ base64 이미지를 <img>로 표시
  │ 다운로드 버튼 클릭 시 <a download> 트리거
```

### Server Action 인터페이스

```typescript
// actions/generate.ts
'use server';

interface GenerateRequest {
  prompt: string;
  style: string;
}

interface GenerateResult {
  success: boolean;
  image?: string;   // base64 data URL
  error?: string;
}

export async function generateImage(request: GenerateRequest): Promise<GenerateResult>
```

### Nanobanana 래퍼 인터페이스

```typescript
// lib/nanobanana.ts
// Nanobanana의 ImageGenerator 클래스를 직접 사용
// 패키지 설치: pnpm add nanobanana (없으면 Gemini API를 직접 호출)

export async function generate(prompt: string, style: string): Promise<Buffer>
```

- `NANOBANANA_API_KEY` 환경변수에서 인증 정보를 읽음 (fallback: `GEMINI_API_KEY`)
- Nanobanana 패키지가 npm에 존재하지 않을 경우, Google Generative AI SDK(`@google/generative-ai`)로 Gemini 2.5 Flash Image 모델을 직접 호출
- 생성된 이미지를 Buffer로 반환

## 에러 처리

| 상황 | 처리 |
|------|------|
| API 키 누락 | Server Action에서 "API 키가 설정되지 않았습니다" 에러 반환 |
| 빈 프롬프트 | 클라이언트에서 버튼 비활성화 + Server Action에서 이중 검증 |
| API 호출 실패 | "이미지 생성에 실패했습니다. 다시 시도해주세요" 에러 반환 |
| 타임아웃 | 30초 타임아웃 설정, 초과 시 에러 반환 |

## 모노레포 연동

- `apps/generator/package.json`의 이름: `@knowledgeview/generator`
- `pnpm-workspace.yaml`에 `apps/*` 패턴이 아직 없으므로 추가 필요
- 현재 모노레포 전환이 진행 중(`graphrag-monorepo` worktree)이므로, 이 앱은 독립적으로 `apps/generator/`에 생성하고 모노레포 전환 완료 후 통합
- 초기에는 루트의 shadcn/ui 컴포넌트를 공유하지 않고, generator 앱 내에서 독립적으로 shadcn을 설정

## 환경변수

```
# apps/generator/.env.local
NANOBANANA_API_KEY=<your-api-key>
```

`.env.local`은 `.gitignore`에 포함되어 서버에만 존재한다.
