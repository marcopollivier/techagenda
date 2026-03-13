import { useState, useRef, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

type FormatAction = {
    label: string;
    icon: string;
    title: string;
    apply: (text: string, selStart: number, selEnd: number) => { text: string; cursorStart: number; cursorEnd: number };
};

const actions: FormatAction[] = [
    {
        label: "bold", icon: "B", title: "Bold (Ctrl+B)",
        apply: (text, s, e) => wrapSelection(text, s, e, "**", "**"),
    },
    {
        label: "italic", icon: "I", title: "Italic (Ctrl+I)",
        apply: (text, s, e) => wrapSelection(text, s, e, "_", "_"),
    },
    {
        label: "heading", icon: "H", title: "Heading",
        apply: (text, s, e) => prependLine(text, s, e, "## "),
    },
    {
        label: "link", icon: "🔗", title: "Link",
        apply: (text, s, e) => {
            const selected = text.slice(s, e);
            const replacement = selected ? `[${selected}](url)` : "[text](url)";
            const newText = text.slice(0, s) + replacement + text.slice(e);
            const urlStart = s + replacement.indexOf("(") + 1;
            return { text: newText, cursorStart: urlStart, cursorEnd: urlStart + 3 };
        },
    },
    {
        label: "ul", icon: "•", title: "Bullet list",
        apply: (text, s, e) => prependLine(text, s, e, "- "),
    },
    {
        label: "ol", icon: "1.", title: "Numbered list",
        apply: (text, s, e) => prependLine(text, s, e, "1. "),
    },
    {
        label: "code", icon: "</>", title: "Code block",
        apply: (text, s, e) => {
            const selected = text.slice(s, e);
            if (selected.includes("\n")) {
                return wrapSelection(text, s, e, "```\n", "\n```");
            }
            return wrapSelection(text, s, e, "`", "`");
        },
    },
    {
        label: "quote", icon: ">", title: "Quote",
        apply: (text, s, e) => prependLine(text, s, e, "> "),
    },
];

function wrapSelection(text: string, s: number, e: number, before: string, after: string) {
    const selected = text.slice(s, e);
    const newText = text.slice(0, s) + before + selected + after + text.slice(e);
    return {
        text: newText,
        cursorStart: s + before.length,
        cursorEnd: s + before.length + selected.length,
    };
}

function prependLine(text: string, s: number, e: number, prefix: string) {
    const lineStart = text.lastIndexOf("\n", s - 1) + 1;
    const selected = text.slice(s, e);
    const lines = text.slice(lineStart, e).split("\n");
    const prefixed = lines.map((l) => prefix + l).join("\n");
    const newText = text.slice(0, lineStart) + prefixed + text.slice(e);
    const diff = prefixed.length - (e - lineStart);
    return {
        text: newText,
        cursorStart: s + prefix.length,
        cursorEnd: e + diff,
    };
}

export default function MarkdownEditor({ value, onChange, placeholder, rows = 8 }: MarkdownEditorProps) {
    const [tab, setTab] = useState<"write" | "preview">("write");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const applyAction = useCallback((action: FormatAction) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const { selectionStart: s, selectionEnd: e } = ta;
        const result = action.apply(value, s, e);
        onChange(result.text);
        requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(result.cursorStart, result.cursorEnd);
        });
    }, [value, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "b") {
            e.preventDefault();
            applyAction(actions[0]); // bold
        } else if ((e.ctrlKey || e.metaKey) && e.key === "i") {
            e.preventDefault();
            applyAction(actions[1]); // italic
        } else if (e.key === "Tab") {
            e.preventDefault();
            const ta = textareaRef.current;
            if (!ta) return;
            const { selectionStart: s, selectionEnd: end } = ta;
            const newText = value.slice(0, s) + "  " + value.slice(end);
            onChange(newText);
            requestAnimationFrame(() => {
                ta.setSelectionRange(s + 2, s + 2);
            });
        }
    }, [value, onChange, applyAction]);

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-2 py-1">
                <div className="flex items-center gap-0.5">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            type="button"
                            title={action.title}
                            onClick={() => { setTab("write"); applyAction(action); }}
                            className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition"
                        >
                            {action.icon}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
                    <button
                        type="button"
                        onClick={() => setTab("write")}
                        className={`rounded-full px-3 py-0.5 text-xs font-medium transition ${
                            tab === "write" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Write
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("preview")}
                        className={`rounded-full px-3 py-0.5 text-xs font-medium transition ${
                            tab === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Preview
                    </button>
                </div>
            </div>

            {/* Content */}
            {tab === "write" ? (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={rows}
                    className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none font-mono"
                    placeholder={placeholder}
                />
            ) : (
                <div
                    className="px-3 py-2 overflow-y-auto bg-white"
                    style={{ minHeight: `${rows * 1.5}rem` }}
                >
                    {value ? (
                        <div className="prose prose-sm prose-gray max-w-none">
                            <Markdown remarkPlugins={[remarkGfm]}>{value}</Markdown>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Nothing to preview</p>
                    )}
                </div>
            )}
        </div>
    );
}
