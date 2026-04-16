"use client";

import { useRef, useCallback } from "react";
import { Bold, Italic, List, ListOrdered, Heading2, Minus, Undo, Redo } from "lucide-react";

interface Props {
  content: string;
  onChange: (content: string) => void;
  onBlur: () => void;
  placeholder?: string;
}

export default function RichEditor({ content, onChange, onBlur, placeholder }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const toolbarButtons = [
    { icon: Bold, command: "bold", label: "Bold" },
    { icon: Italic, command: "italic", label: "Italic" },
    { icon: Heading2, command: "formatBlock", value: "h3", label: "Heading" },
    { icon: List, command: "insertUnorderedList", label: "Bullet List" },
    { icon: ListOrdered, command: "insertOrderedList", label: "Numbered List" },
    { icon: Minus, command: "insertHorizontalRule", label: "Divider" },
    { icon: Undo, command: "undo", label: "Undo" },
    { icon: Redo, command: "redo", label: "Redo" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-rose-border bg-rose-light/50 rounded-t-lg">
        {toolbarButtons.map((btn, i) => (
          <button
            key={i}
            onClick={() => execCommand(btn.command, btn.value)}
            title={btn.label}
            className="p-1.5 rounded hover:bg-rose-light text-rose-muted hover:text-rose-deep transition"
          >
            <btn.icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={() => {
          if (editorRef.current) onChange(editorRef.current.innerHTML);
        }}
        onBlur={onBlur}
        data-placeholder={placeholder || "Start writing..."}
        className="flex-1 p-4 text-sm text-rose-dark leading-relaxed focus:outline-none overflow-y-auto prose-sm [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-rose-dark [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:text-sm [&_hr]:border-rose-border [&_hr]:my-3 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-rose-muted"
      />
    </div>
  );
}
