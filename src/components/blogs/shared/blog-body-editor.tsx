"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { transformPastedBlogHtml } from "@/lib/blog-editor/pasteTransform";

type BlogBodyEditorProps = {
  value: string;
  onChange: (html: string) => void;
  editorKey: string;
};

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const HEADING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "p", label: "Paragraph" },
  { value: "1", label: "Heading 1" },
  { value: "2", label: "Heading 2" },
  { value: "3", label: "Heading 3" },
  { value: "4", label: "Heading 4" },
  { value: "5", label: "Heading 5" },
  { value: "6", label: "Heading 6" },
];

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md p-1.5 transition-colors ${
        active ? "bg-[#183650] text-white" : "text-[#102738] hover:bg-[#e8f0f7]"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function getActiveBlockValue(editor: Editor): string {
  for (let level = 1; level <= 6; level++) {
    if (editor.isActive("heading", { level: level as HeadingLevel })) {
      return String(level);
    }
  }
  return "p";
}

function applyBlockType(editor: Editor, value: string) {
  if (value === "p") {
    editor.chain().focus().setParagraph().run();
    return;
  }

  const level = Number(value) as HeadingLevel;
  editor.chain().focus().setHeading({ level }).run();
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const activeBlock = getActiveBlockValue(editor);

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl ?? "https://");

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[#e2ebf5] bg-[#f8fafc] px-2 py-1.5">
      <select
        value={activeBlock}
        onChange={(e) => applyBlockType(editor, e.target.value)}
        className="h-8 min-w-[132px] rounded-md border border-[#d3dce6] bg-white px-2 text-xs font-medium text-[#102738] outline-none focus:border-[#3fb7e3]"
        title="Text style"
      >
        {HEADING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <span className="mx-0.5 h-5 w-px bg-[#d3dce6]" aria-hidden />

      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={16} />
      </ToolbarButton>

      <span className="mx-0.5 h-5 w-px bg-[#d3dce6]" aria-hidden />

      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </ToolbarButton>

      <span className="mx-0.5 h-5 w-px bg-[#d3dce6]" aria-hidden />

      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
        <Link2 size={16} />
      </ToolbarButton>

      <span className="mx-0.5 h-5 w-px bg-[#d3dce6]" aria-hidden />

      <ToolbarButton
        title="Undo"
        disabled={!editor.can().chain().focus().undo().run()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Redo"
        disabled={!editor.can().chain().focus().redo().run()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={16} />
      </ToolbarButton>
    </div>
  );
}

export default function BlogBodyEditor({ value, onChange, editorKey }: BlogBodyEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        listItem: { HTMLAttributes: { class: "blog-list-item" } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    [],
  );

  const editor = useEditor(
    {
      extensions,
      content: value || "<p></p>",
      immediatelyRender: false,
      onUpdate: ({ editor: currentEditor }) => {
        onChange(currentEditor.getHTML());
      },
      editorProps: {
        attributes: {
          class:
            "blog-tiptap-editor min-h-[320px] max-h-[560px] overflow-y-auto px-4 py-3 text-sm leading-relaxed text-[#102738] focus:outline-none",
        },
        transformPastedHTML(html) {
          return transformPastedBlogHtml(html);
        },
      },
    },
    [editorKey],
  );

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    const normalizedCurrent = currentHtml === "<p></p>" ? "" : currentHtml;
    const normalizedValue = value || "";

    if (normalizedValue !== normalizedCurrent) {
      editor.commands.setContent(normalizedValue || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-[320px] rounded-lg border border-[#d3dce6] px-3 py-3 text-sm text-[#5b7185]">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#d3dce6] bg-white">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
