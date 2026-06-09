"use client";

import { useRef, useState } from "react";

export type MemberSuggestion = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url: string | null;
};

interface MentionInputProps {
  value: string;
  onChange: (text: string) => void;
  members: MemberSuggestion[];
  placeholder?: string;
  rows?: number;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const ROLE_COLOR: Record<string, string> = {
  Élite: "#ffac42", Pro: "#3871c2", Standard: "#766391",
  Admin: "#ff1e58", Modérateur: "#22c55e",
};

/* Extrait les UUIDs des personnes mentionnées depuis le contenu final */
export function extractMentionedIds(content: string, members: MemberSuggestion[]): string[] {
  const ids: string[] = [];
  const regex = /@([\wÀ-ž]+(?:\s[\wÀ-ž]+)?)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1].toLowerCase();
    const m = members.find(
      x =>
        `${x.first_name} ${x.last_name}`.toLowerCase() === name ||
        x.first_name.toLowerCase() === name
    );
    if (m && !ids.includes(m.id)) ids.push(m.id);
  }
  return ids;
}

export function MentionInput({
  value, onChange, members, placeholder, rows = 3, className, onKeyDown,
}: MentionInputProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<MemberSuggestion[]>([]);
  const [atStart, setAtStart]         = useState(0);
  const [activeIdx, setActiveIdx]     = useState(0);

  function detect(text: string, cursor: number) {
    const before = text.slice(0, cursor);
    const match  = before.match(/@([\wÀ-ž\s]*)$/);
    if (match && match[1].trim().length >= 1) {
      const q       = match[1].toLowerCase().trim();
      const start   = before.length - match[0].length;
      setAtStart(start);
      const hits = members
        .filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().startsWith(q))
        .slice(0, 6);
      setSuggestions(hits);
      setActiveIdx(0);
    } else {
      setSuggestions([]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    detect(e.target.value, e.target.selectionStart ?? e.target.value.length);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === "ArrowUp")    { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter")      { e.preventDefault(); selectMember(suggestions[activeIdx]); return; }
      if (e.key === "Escape")     { setSuggestions([]); return; }
    }
    onKeyDown?.(e);
  }

  function selectMember(m: MemberSuggestion) {
    const mention = `@${m.first_name} ${m.last_name}`;
    const cursor  = taRef.current?.selectionStart ?? (atStart + 1);
    const after   = value.slice(cursor);
    const newText = value.slice(0, atStart) + mention + " " + after;
    onChange(newText);
    setSuggestions([]);
    // reposition cursor
    const pos = atStart + mention.length + 1;
    requestAnimationFrame(() => {
      taRef.current?.focus();
      taRef.current?.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="relative">
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={e => {
          const ta = e.target as HTMLTextAreaElement;
          detect(ta.value, ta.selectionStart);
        }}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />

      {suggestions.length > 0 && (
        <div className="absolute z-50 bottom-full left-0 mb-1 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          {suggestions.map((m, i) => {
            const tc = ROLE_COLOR[m.role] ?? "#3871c2";
            const ini = (m.first_name[0] + m.last_name[0]).toUpperCase();
            return (
              <button
                key={m.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); selectMember(m); }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${i === activeIdx ? "bg-brand/5" : "hover:bg-[#f8f9fc]"}`}
              >
                {m.avatar_url
                  ? <img src={m.avatar_url} className="h-7 w-7 shrink-0 rounded-full object-cover" alt=""/>
                  : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: tc }}>{ini}</span>
                }
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink truncate">{m.first_name} {m.last_name}</p>
                  <p className="text-[10px] font-bold" style={{ color: tc }}>{m.role}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
