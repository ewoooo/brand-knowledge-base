"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface NodeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (node: { label: string; type?: string }) => void;
  initial?: { label: string; type?: string };
}

const NODE_TYPES = ["brand", "color", "typography", "concept"] as const;

export function NodeForm({ open, onClose, onSubmit, initial }: NodeFormProps) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [type, setType] = useState<string>(initial?.type ?? "");

  useEffect(() => {
    if (open) {
      setLabel(initial?.label ?? "");
      setType(initial?.type ?? "");
    }
  }, [open, initial]);

  const isEditing = !!initial;

  function handleSubmit() {
    if (!label.trim()) return;
    onSubmit({ label: label.trim(), type: type || undefined });
    setLabel("");
    setType("");
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "노드 편집" : "새 노드 추가"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">레이블</label>
            <Input
              placeholder="노드 이름 입력"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">타입</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="타입 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                {NODE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!label.trim()}>
            {isEditing ? "저장" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
