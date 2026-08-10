"use client";

import { useRef } from "react";

import { FileText, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AssignedFile } from "@/features/assignments/wizard/types";

export interface FileListProps {
  files: AssignedFile[];
  onChange: (files: AssignedFile[]) => void;
}

export function FileList({ files, onChange }: FileListProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    const additions: AssignedFile[] = picked.map((f, idx) => ({
      id: `f_${Date.now()}_${idx}_${Math.floor(Math.random() * 1e6)}`,
      name: f.name,
      sizeKb: Math.max(1, Math.round(f.size / 1024)),
    }));
    onChange([...files, ...additions]);
    // Reset so re-picking the same file fires onChange again.
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) => onChange(files.filter((f) => f.id !== id));

  return (
    <div className="space-y-2">
      {files.length === 0 ? (
        <label
          htmlFor="asg-file-input"
          className="flex w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <Paperclip className="size-5 opacity-60" aria-hidden />
          <span>Drag files here or click to browse</span>
          <span className="text-xs">Attachments are kept in-memory for this prototype.</span>
        </label>
      ) : (
        <div className="space-y-2">
          <ul className="grid gap-1">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex min-w-0 items-center justify-between gap-2 rounded-md border bg-card px-3 py-2"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                  <FileText className="size-4 shrink-0 opacity-60" aria-hidden />
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{f.sizeKb} KB</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(f.id)}
                  aria-label={`Remove ${f.name}`}
                  className="size-7"
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <label
            htmlFor="asg-file-input"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/40"
          >
            <Paperclip className="size-3.5" aria-hidden />
            Add another file
          </label>
        </div>
      )}
      <input
        id="asg-file-input"
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleAdd}
      />
    </div>
  );
}
