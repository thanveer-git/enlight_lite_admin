"use client";

import { useEffect, useReducer, useState } from "react";

import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pencil,
  Plus,
  Quote,
  Redo2,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: number;
  /**
   * Upper bound for the editing area. Once content exceeds this height
   * the editor becomes internally scrollable instead of growing the
   * layout. Defaults to 360 px.
   */
  maxHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  minHeight = 120,
  maxHeight = 360,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "rt-table" },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(
          // `min-w-0` + `max-w-full` keep the editor inside its parent
          // width, and `break-words [overflow-wrap:anywhere]` forces long
          // unbroken strings (e.g. URLs, identifiers) to wrap inside
          // the editing area instead of stretching it horizontally.
          // `max-h-[var(--rte-max-height)] overflow-y-auto` caps the
          // vertical growth and turns the editor into a scrollable
          // surface once content exceeds the configured threshold.
          "tiptap min-h-[var(--rte-min-height)] max-h-[var(--rte-max-height)] min-w-0 max-w-full overflow-x-hidden overflow-y-auto break-words rounded-b-md border border-t-0 border-input bg-background px-3 py-2 text-sm [overflow-wrap:anywhere] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        ),
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  // View HTML Source mode — swaps the editor area for a plain textarea so
  // users can inspect / hand-edit the markup. Toggling back re-syncs the
  // editor from the textarea contents.
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(value);

  useEffect(() => {
    if (!editor) return;
    if (sourceMode) {
      setSourceValue(editor.getHTML());
    }
  }, [sourceMode, editor]);

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-50",
        className,
      )}
      style={
        {
          ["--rte-min-height" as string]: `${minHeight}px`,
          ["--rte-max-height" as string]: `${maxHeight}px`,
        } as React.CSSProperties
      }
    >
      <EditorToolbar
        editor={editor}
        disabled={disabled}
        sourceMode={sourceMode}
        onToggleSource={() => {
          if (sourceMode && editor) {
            // Commit any in-flight textarea changes back into the editor
            // before leaving source mode.
            editor.commands.setContent(sourceValue, { emitUpdate: true });
            onChange(sourceValue);
          }
          setSourceMode((m) => !m);
        }}
      />
      {sourceMode ? (
        <textarea
          aria-label="HTML source"
          value={sourceValue}
          onChange={(e) => setSourceValue(e.target.value)}
          spellCheck={false}
          disabled={disabled}
          className="min-h-[var(--rte-min-height)] w-full resize-y rounded-b-md border border-t-0 border-input bg-muted/30 px-3 py-2 font-mono text-xs leading-relaxed text-foreground shadow-inner focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

interface EditorToolbarProps {
  editor: Editor | null;
  disabled: boolean;
  sourceMode: boolean;
  onToggleSource: () => void;
}

function EditorToolbar({
  editor,
  disabled,
  sourceMode,
  onToggleSource,
}: EditorToolbarProps) {
  // Force a re-render of the toolbar whenever the editor fires a
  // selection or transaction update, so `isActive(...)` checks stay in
  // sync with the caret position.
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => forceUpdate();
    editor.on("selectionUpdate", onUpdate);
    editor.on("transaction", onUpdate);
    return () => {
      editor.off("selectionUpdate", onUpdate);
      editor.off("transaction", onUpdate);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div
        className="flex h-9 items-center gap-1 rounded-t-md border-b border-input bg-muted/40 px-2"
        aria-hidden
      />
    );
  }

  const promptLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  // Reactive flag — re-evaluated on every selection change so the table
  // action buttons enable/disable in sync with the caret position.
  const isInTable = editor.isActive("table");

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 rounded-t-md border-b border-input bg-muted/40 px-2 py-1"
    >
      <ToolbarButton
        label="Bold"
        isActive={editor.isActive("bold")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        isActive={editor.isActive("italic")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        isActive={editor.isActive("underline")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label="Heading 2"
        isActive={editor.isActive("heading", { level: 2 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        isActive={editor.isActive("heading", { level: 3 })}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        isActive={editor.isActive("blockquote")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label="Bulleted list"
        isActive={editor.isActive("bulletList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        isActive={editor.isActive("orderedList")}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label="Link"
        isActive={editor.isActive("link")}
        disabled={disabled}
        onClick={promptLink}
      >
        <LinkIcon />
      </ToolbarButton>
      <ToolbarDivider />
      {/* Table controls — grouped into a single dropdown trigger so the
          toolbar stays compact even with six distinct actions. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-1 px-2 text-xs font-medium normal-case",
              isInTable && "bg-accent text-accent-foreground",
            )}
            aria-label="Table actions"
            title="Table actions"
            disabled={disabled}
          >
            <TableIcon className="size-3.5" />
            <span>Table</span>
            <span aria-hidden className="ml-0.5 text-[10px] opacity-60">▾</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px] rounded-xl p-1">
          <DropdownMenuItem
            onSelect={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            className="rounded-md"
          >
            <Plus className="size-4 text-muted-foreground" />
            Insert table (3×3)
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Row
          </DropdownMenuLabel>
          <DropdownMenuItem
            disabled={!isInTable}
            onSelect={() => editor.chain().focus().addRowBefore().run()}
            className="rounded-md"
          >
            <Plus className="size-4 text-muted-foreground" />
            Insert row above
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!isInTable}
            onSelect={() => editor.chain().focus().addRowAfter().run()}
            className="rounded-md"
          >
            <Plus className="size-4 text-muted-foreground" />
            Insert row below
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!isInTable}
            onSelect={() => editor.chain().focus().deleteRow().run()}
            className="rounded-md text-destructive focus:text-destructive"
          >
            <Minus className="size-4" />
            Delete row
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Column
          </DropdownMenuLabel>
          <DropdownMenuItem
            disabled={!isInTable}
            onSelect={() => editor.chain().focus().addColumnBefore().run()}
            className="rounded-md"
          >
            <Plus className="size-4 text-muted-foreground" />
            Insert column before
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!isInTable}
            onSelect={() => editor.chain().focus().addColumnAfter().run()}
            className="rounded-md"
          >
            <Plus className="size-4 text-muted-foreground" />
            Insert column after
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!isInTable}
            onSelect={() => editor.chain().focus().deleteColumn().run()}
            className="rounded-md text-destructive focus:text-destructive"
          >
            <Minus className="size-4" />
            Delete column
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            disabled={!isInTable}
            onSelect={() => editor.chain().focus().deleteTable().run()}
            className="rounded-md text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ToolbarDivider />
      <ToolbarButton
        label="Undo"
        disabled={disabled || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={disabled || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label={sourceMode ? "Back to editor" : "View HTML source"}
        isActive={sourceMode}
        disabled={disabled}
        onClick={onToggleSource}
      >
        {sourceMode ? <Pencil /> : <Code2 />}
      </ToolbarButton>
    </div>
  );
}

interface ToolbarButtonProps {
  label: string;
  isActive?: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({
  label,
  isActive,
  disabled,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", isActive && "bg-accent text-accent-foreground")}
      aria-label={label}
      title={label}
      aria-pressed={isActive}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}