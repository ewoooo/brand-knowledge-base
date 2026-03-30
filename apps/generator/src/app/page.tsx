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
