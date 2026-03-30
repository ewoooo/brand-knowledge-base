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
      const result = await generateImageAction({ prompt: prompt.trim(), style });
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
        <label className="text-muted-foreground text-xs font-medium uppercase">프롬프트</label>
        <Textarea placeholder="생성할 이미지를 설명해주세요..." value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[120px] resize-none" disabled={isPending} />
      </div>
      <StyleSelector value={style} onChange={setStyle} disabled={isPending} />
      <Button onClick={handleSubmit} disabled={!prompt.trim() || isPending} className="w-full" size="lg">
        {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />생성 중...</>) : (<><Sparkles className="mr-2 h-4 w-4" />이미지 생성</>)}
      </Button>
    </div>
  );
}
