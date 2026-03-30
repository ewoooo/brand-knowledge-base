# Image Generator 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nanobanana(Gemini 2.5 Flash Image) 모델을 사용하여 텍스트로 이미지를 생성하는 독립 Next.js 앱을 `apps/generator/`에 구축한다.

**Architecture:** 단일 페이지 좌우 분할 레이아웃. 왼쪽에서 프롬프트 + 스타일 입력, Server Action으로 `@google/genai` SDK를 호출, 오른쪽에서 base64 이미지를 미리보기 및 다운로드.

**Tech Stack:** Next.js 16, shadcn/ui (radix-nova, neutral), Tailwind CSS 4, `@google/genai` SDK, Geist 폰트, vitest

---

## 파일 구조

```
apps/generator/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃 (Geist 폰트, 다크 모드)
│   │   ├── page.tsx                # 메인 페이지 — 좌우 분할
│   │   ├── globals.css             # Tailwind + shadcn 테마
│   │   └── actions/
│   │       └── generate.ts         # Server Action — 이미지 생성
│   ├── components/
│   │   ├── generate/
│   │   │   ├── prompt-form.tsx     # 프롬프트 입력 + 생성 버튼
│   │   │   └── style-selector.tsx  # 스타일 토글 그룹
│   │   ├── preview/
│   │   │   └── image-preview.tsx   # 이미지 미리보기 + 다운로드
│   │   └── ui/                     # shadcn 컴포넌트 (자동 생성)
│   └── lib/
│       ├── gemini.ts               # @google/genai 래퍼
│       └── utils.ts                # cn() 유틸리티
├── __tests__/
│   ├── lib/
│   │   └── gemini.test.ts          # gemini 래퍼 테스트
│   └── actions/
│       └── generate.test.ts        # Server Action 테스트
├── .env.local                      # GOOGLE_API_KEY=...
├── next.config.ts
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── components.json                 # shadcn 설정
└── vitest.config.ts
```

---

### Task 1: Next.js 앱 스캐폴딩

`apps/generator/`에 최소한의 Next.js 16 앱을 생성하고, 의존성을 설치하고, dev 서버가 뜨는지 확인한다.

**Files:**
- Create: `apps/generator/package.json`
- Create: `apps/generator/tsconfig.json`
- Create: `apps/generator/next.config.ts`
- Create: `apps/generator/postcss.config.mjs`
- Create: `apps/generator/src/app/layout.tsx`
- Create: `apps/generator/src/app/page.tsx`
- Create: `apps/generator/src/app/globals.css`
- Create: `apps/generator/src/lib/utils.ts`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: pnpm-workspace.yaml에 apps/* 추가**

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
```

- [ ] **Step 2: package.json 생성**

```json
{
  "name": "@knowledgeview/generator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@google/genai": "^1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "geist": "^1.7.0",
    "lucide-react": "^1.7.0",
    "next": "16.2.1",
    "radix-ui": "^1.4.3",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "shadcn": "^4.1.1",
    "tailwind-merge": "^3.5.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^4.1.2"
  }
}
```

- [ ] **Step 3: tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: next.config.ts 생성**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 5: postcss.config.mjs 생성**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 6: vitest.config.ts 생성**

```typescript
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 7: src/lib/utils.ts 생성**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 8: src/app/globals.css 생성**

기존 에디터(`src/app/globals.css`)의 패턴을 따르되, generator 전용으로 독립 복사한다.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans, ui-sans-serif), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono, ui-monospace), monospace;
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --radius: 0.625rem;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

body {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
}
code, pre, kbd, samp {
  font-family: var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace;
}
```

- [ ] **Step 9: src/app/layout.tsx 생성**

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Image Generator",
  description: "AI-powered image generation tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 10: src/app/page.tsx 플레이스홀더 생성**

```tsx
export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">Image Generator</h1>
    </div>
  );
}
```

- [ ] **Step 11: 의존성 설치 및 dev 서버 확인**

```bash
cd apps/generator && pnpm install
pnpm dev
# http://localhost:3001 에서 "Image Generator" 텍스트 확인
```

- [ ] **Step 12: shadcn 초기화 및 필요 컴포넌트 설치**

```bash
cd apps/generator
npx shadcn@latest init --defaults
npx shadcn@latest add button textarea toggle-group
```

`components.json`이 생성되고, `src/components/ui/` 아래에 button, textarea, toggle-group이 설치된다.

- [ ] **Step 13: 커밋**

```bash
git add apps/generator/ pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat: apps/generator Next.js 앱 스캐폴딩"
```

---

### Task 2: Gemini API 래퍼 (TDD)

`@google/genai` SDK를 감싸는 래퍼를 작성한다. 이미지 생성 호출과 에러 처리를 담당한다.

**Files:**
- Create: `apps/generator/src/lib/gemini.ts`
- Create: `apps/generator/__tests__/lib/gemini.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// apps/generator/__tests__/lib/gemini.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// @google/genai 모듈 모킹
vi.mock("@google/genai", () => {
  const mockGenerateContent = vi.fn();
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
    __mockGenerateContent: mockGenerateContent,
  };
});

import { generateImage } from "@/lib/gemini";

// 모킹된 함수 가져오기
const { __mockGenerateContent: mockGenerateContent } = await import(
  "@google/genai"
);

describe("generateImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_API_KEY", "test-key");
  });

  it("프롬프트와 스타일로 이미지를 생성하고 base64를 반환한다", async () => {
    (mockGenerateContent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: "iVBORw0KGgo=",
                },
              },
            ],
          },
        },
      ],
    });

    const result = await generateImage({
      prompt: "a fox in a forest",
      style: "watercolor",
    });

    expect(result.success).toBe(true);
    expect(result.image).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-2.5-flash-preview-image-generation",
        contents: expect.stringContaining("a fox in a forest"),
      }),
    );
  });

  it("API 키가 없으면 에러를 반환한다", async () => {
    vi.stubEnv("GOOGLE_API_KEY", "");

    const result = await generateImage({
      prompt: "test",
      style: "watercolor",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("API 키가 설정되지 않았습니다");
  });

  it("API 호출 실패 시 에러를 반환한다", async () => {
    (mockGenerateContent as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("API error"),
    );

    const result = await generateImage({
      prompt: "test",
      style: "watercolor",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("이미지 생성에 실패했습니다. 다시 시도해주세요");
  });

  it("응답에 이미지가 없으면 에러를 반환한다", async () => {
    (mockGenerateContent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [{ text: "I cannot generate that image." }],
          },
        },
      ],
    });

    const result = await generateImage({
      prompt: "test",
      style: "watercolor",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("이미지를 생성할 수 없습니다");
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```bash
cd apps/generator && pnpm test -- __tests__/lib/gemini.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/gemini'`

- [ ] **Step 3: 최소 구현**

```typescript
// apps/generator/src/lib/gemini.ts
import { GoogleGenAI } from "@google/genai";

export interface GenerateImageRequest {
  prompt: string;
  style: string;
}

export interface GenerateImageResult {
  success: boolean;
  image?: string;
  error?: string;
}

const STYLE_PROMPTS: Record<string, string> = {
  photorealistic: "photorealistic style, high detail, sharp focus",
  watercolor: "watercolor painting style, soft edges, flowing colors",
  "oil-painting": "oil painting style, rich textures, bold brushstrokes",
  sketch: "pencil sketch style, line drawing, monochrome",
  "pixel-art": "pixel art style, retro game aesthetic, 8-bit",
  anime: "anime style, cel-shaded, vibrant colors",
  vintage: "vintage style, retro, film grain, faded colors",
  modern: "modern design style, clean, minimal, contemporary",
  abstract: "abstract art style, non-representational, expressive",
  minimalist: "minimalist style, simple shapes, limited palette",
};

export async function generateImage(
  request: GenerateImageRequest,
): Promise<GenerateImageResult> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return { success: false, error: "API 키가 설정되지 않았습니다" };
  }

  const ai = new GoogleGenAI({ apiKey });

  const styleHint = STYLE_PROMPTS[request.style] ?? request.style;
  const fullPrompt = `${request.prompt}. Style: ${styleHint}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-image-generation",
      contents: fullPrompt,
      config: {
        responseModalities: ["image", "text"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return { success: false, error: "이미지를 생성할 수 없습니다" };
    }

    for (const part of parts) {
      if (part.inlineData) {
        const { mimeType, data } = part.inlineData;
        return {
          success: true,
          image: `data:${mimeType};base64,${data}`,
        };
      }
    }

    return { success: false, error: "이미지를 생성할 수 없습니다" };
  } catch {
    return {
      success: false,
      error: "이미지 생성에 실패했습니다. 다시 시도해주세요",
    };
  }
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

```bash
cd apps/generator && pnpm test -- __tests__/lib/gemini.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/generator/src/lib/gemini.ts apps/generator/__tests__/lib/gemini.test.ts
git commit -m "feat: Gemini API 이미지 생성 래퍼 구현"
```

---

### Task 3: Server Action

Server Action으로 클라이언트의 폼 데이터를 받아 Gemini 래퍼를 호출한다.

**Files:**
- Create: `apps/generator/src/app/actions/generate.ts`
- Create: `apps/generator/__tests__/actions/generate.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// apps/generator/__tests__/actions/generate.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/gemini", () => ({
  generateImage: vi.fn(),
}));

import { generateImageAction } from "@/app/actions/generate";
import { generateImage } from "@/lib/gemini";

const mockGenerateImage = generateImage as ReturnType<typeof vi.fn>;

describe("generateImageAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("유효한 입력으로 이미지를 생성한다", async () => {
    mockGenerateImage.mockResolvedValueOnce({
      success: true,
      image: "data:image/png;base64,abc123",
    });

    const result = await generateImageAction({
      prompt: "a cat",
      style: "watercolor",
    });

    expect(result.success).toBe(true);
    expect(result.image).toBe("data:image/png;base64,abc123");
    expect(mockGenerateImage).toHaveBeenCalledWith({
      prompt: "a cat",
      style: "watercolor",
    });
  });

  it("빈 프롬프트는 에러를 반환한다", async () => {
    const result = await generateImageAction({
      prompt: "   ",
      style: "watercolor",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("프롬프트를 입력해주세요");
    expect(mockGenerateImage).not.toHaveBeenCalled();
  });

  it("빈 스타일은 에러를 반환한다", async () => {
    const result = await generateImageAction({
      prompt: "a cat",
      style: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("스타일을 선택해주세요");
    expect(mockGenerateImage).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```bash
cd apps/generator && pnpm test -- __tests__/actions/generate.test.ts
```

Expected: FAIL — `Cannot find module '@/app/actions/generate'`

- [ ] **Step 3: 최소 구현**

```typescript
// apps/generator/src/app/actions/generate.ts
"use server";

import {
  generateImage,
  type GenerateImageResult,
} from "@/lib/gemini";

interface GenerateImageActionInput {
  prompt: string;
  style: string;
}

export async function generateImageAction(
  input: GenerateImageActionInput,
): Promise<GenerateImageResult> {
  const prompt = input.prompt.trim();
  const style = input.style.trim();

  if (!prompt) {
    return { success: false, error: "프롬프트를 입력해주세요" };
  }

  if (!style) {
    return { success: false, error: "스타일을 선택해주세요" };
  }

  return generateImage({ prompt, style });
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

```bash
cd apps/generator && pnpm test -- __tests__/actions/generate.test.ts
```

Expected: 3 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/generator/src/app/actions/generate.ts apps/generator/__tests__/actions/generate.test.ts
git commit -m "feat: 이미지 생성 Server Action 구현"
```

---

### Task 4: StyleSelector 컴포넌트

스타일 목록을 토글 그룹으로 표시하는 Client Component.

**Files:**
- Create: `apps/generator/src/components/generate/style-selector.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
// apps/generator/src/components/generate/style-selector.tsx
"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "watercolor", label: "Watercolor" },
  { value: "oil-painting", label: "Oil Painting" },
  { value: "sketch", label: "Sketch" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "anime", label: "Anime" },
  { value: "vintage", label: "Vintage" },
  { value: "modern", label: "Modern" },
  { value: "abstract", label: "Abstract" },
  { value: "minimalist", label: "Minimalist" },
] as const;

interface StyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function StyleSelector({
  value,
  onChange,
  disabled,
}: StyleSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-muted-foreground text-xs font-medium uppercase">
        스타일
      </label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v)}
        className="flex flex-wrap justify-start gap-1.5"
        disabled={disabled}
      >
        {STYLES.map((style) => (
          <ToggleGroupItem
            key={style.value}
            value={style.value}
            className="rounded-full px-3 py-1 text-xs"
          >
            {style.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/generator/src/components/generate/style-selector.tsx
git commit -m "feat: 스타일 선택 컴포넌트 구현"
```

---

### Task 5: ImagePreview 컴포넌트

생성된 이미지를 표시하고, 다운로드 버튼을 제공하는 Client Component. 빈 상태/로딩/에러/결과 4가지 상태를 처리한다.

**Files:**
- Create: `apps/generator/src/components/preview/image-preview.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
// apps/generator/src/components/preview/image-preview.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Download, ImageIcon, Loader2 } from "lucide-react";

interface ImagePreviewProps {
  image: string | null;
  loading: boolean;
  error: string | null;
}

export function ImagePreview({ image, loading, error }: ImagePreviewProps) {
  function handleDownload() {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image;
    link.download = `generated-${Date.now()}.png`;
    link.click();
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">이미지 생성 중...</p>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      </div>
    );
  }

  // 결과 상태
  if (image) {
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="relative flex-1 overflow-hidden rounded-lg">
          <img
            src={image}
            alt="Generated image"
            className="h-full w-full object-contain"
          />
        </div>
        <Button onClick={handleDownload} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          다운로드
        </Button>
      </div>
    );
  }

  // 빈 상태
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <ImageIcon className="text-muted-foreground/30 h-12 w-12" />
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          프롬프트를 입력하고 생성 버튼을 눌러주세요
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/generator/src/components/preview/image-preview.tsx
git commit -m "feat: 이미지 미리보기 컴포넌트 구현"
```

---

### Task 6: PromptForm 컴포넌트

프롬프트 입력, 스타일 선택, 생성 버튼을 통합하는 Client Component. Server Action을 호출하고 결과를 상위로 전달한다.

**Files:**
- Create: `apps/generator/src/components/generate/prompt-form.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
// apps/generator/src/components/generate/prompt-form.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StyleSelector } from "@/components/generate/style-selector";
import { generateImageAction } from "@/app/actions/generate";
import { Loader2, Sparkles } from "lucide-react";

interface PromptFormProps {
  onResult: (image: string | null, error: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
}

export function PromptForm({ onResult, onLoadingChange }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!prompt.trim() || isPending) return;

    onLoadingChange(true);
    onResult(null, null);

    startTransition(async () => {
      const result = await generateImageAction({
        prompt: prompt.trim(),
        style,
      });

      if (result.success && result.image) {
        onResult(result.image, null);
      } else {
        onResult(null, result.error ?? "알 수 없는 오류가 발생했습니다");
      }

      onLoadingChange(false);
    });
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <label className="text-muted-foreground text-xs font-medium uppercase">
          프롬프트
        </label>
        <Textarea
          placeholder="생성할 이미지를 설명해주세요..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px] resize-none"
          disabled={isPending}
        />
      </div>

      <StyleSelector
        value={style}
        onChange={setStyle}
        disabled={isPending}
      />

      <Button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isPending}
        className="w-full"
        size="lg"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            생성 중...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            이미지 생성
          </>
        )}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/generator/src/components/generate/prompt-form.tsx
git commit -m "feat: 프롬프트 입력 폼 컴포넌트 구현"
```

---

### Task 7: 메인 페이지 조립

좌우 분할 레이아웃으로 PromptForm과 ImagePreview를 조합한다.

**Files:**
- Modify: `apps/generator/src/app/page.tsx`

- [ ] **Step 1: page.tsx 구현**

```tsx
// apps/generator/src/app/page.tsx
"use client";

import { useState } from "react";
import { PromptForm } from "@/components/generate/prompt-form";
import { ImagePreview } from "@/components/preview/image-preview";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleResult(newImage: string | null, newError: string | null) {
    setImage(newImage);
    setError(newError);
  }

  return (
    <div className="flex h-screen">
      {/* 왼쪽: 입력 패널 */}
      <div className="flex w-[400px] min-w-[400px] flex-col border-r">
        <div className="border-b px-6 py-4">
          <h1 className="text-lg font-semibold">Image Generator</h1>
          <p className="text-muted-foreground text-xs">
            텍스트로 이미지를 생성합니다
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PromptForm
            onResult={handleResult}
            onLoadingChange={setLoading}
          />
        </div>
      </div>

      {/* 오른쪽: 미리보기 패널 */}
      <div className="bg-card/30 flex-1">
        <ImagePreview image={image} loading={loading} error={error} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: dev 서버에서 시각 확인**

```bash
cd apps/generator && pnpm dev
# http://localhost:3001 접속
# - 좌측: 프롬프트 입력, 스타일 토글, 생성 버튼 표시
# - 우측: "프롬프트를 입력하고 생성 버튼을 눌러주세요" 표시
```

- [ ] **Step 3: 커밋**

```bash
git add apps/generator/src/app/page.tsx
git commit -m "feat: 좌우 분할 메인 페이지 레이아웃 조립"
```

---

### Task 8: 환경변수 설정 및 E2E 확인

실제 API 키를 넣고 이미지 생성이 동작하는지 확인한다.

**Files:**
- Create: `apps/generator/.env.local`
- Modify: `apps/generator/.gitignore` (필요 시)

- [ ] **Step 1: .env.local 생성**

```bash
# apps/generator/.env.local
GOOGLE_API_KEY=<실제-API-키>
```

- [ ] **Step 2: .gitignore에 .env*.local 추가 확인**

```bash
# 루트 .gitignore에 이미 있는지 확인
grep -q ".env*.local" .gitignore && echo "OK" || echo ".env*.local" >> .gitignore
```

- [ ] **Step 3: E2E 확인**

```bash
cd apps/generator && pnpm dev
# http://localhost:3001 접속
# 1. 프롬프트 입력: "a cute cat sitting on a windowsill"
# 2. 스타일 선택: Watercolor
# 3. "이미지 생성" 클릭
# 4. 로딩 스피너 표시 → 이미지 미리보기 표시 확인
# 5. "다운로드" 클릭 → PNG 파일 다운로드 확인
```

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "feat: 이미지 생성 앱 완성 (환경변수 설정, E2E 확인)"
```
