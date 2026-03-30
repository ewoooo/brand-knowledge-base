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
import type { Node } from "@knowledgeview/kg-core";

interface TripleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (triple: {
    subject: string;
    predicate: string;
    object: string;
  }) => void;
  nodes: Node[];
  initial?: { subject: string; predicate: string; object: string };
}

export function TripleForm({
  open,
  onClose,
  onSubmit,
  nodes,
  initial,
}: TripleFormProps) {
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [predicate, setPredicate] = useState(initial?.predicate ?? "");
  const [object, setObject] = useState(initial?.object ?? "");

  useEffect(() => {
    if (open) {
      setSubject(initial?.subject ?? "");
      setPredicate(initial?.predicate ?? "");
      setObject(initial?.object ?? "");
    }
  }, [open, initial]);

  const isEditing = !!initial;
  const canSubmit = subject.trim() && predicate.trim() && object.trim();

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      subject: subject.trim(),
      predicate: predicate.trim(),
      object: object.trim(),
    });
    setSubject("");
    setPredicate("");
    setObject("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "관계 편집" : "새 관계 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">주어 (Subject)</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="노드 선택" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">서술어 (Predicate)</label>
            <Input
              placeholder="관계 입력 (예: hasColor, isPartOf)"
              value={predicate}
              onChange={(e) => setPredicate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">목적어 (Object)</label>
            <Select value={object} onValueChange={setObject}>
              <SelectTrigger>
                <SelectValue placeholder="노드 선택" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.label}
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
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isEditing ? "저장" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
