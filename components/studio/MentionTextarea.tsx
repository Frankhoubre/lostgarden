"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type TextareaHTMLAttributes } from "react";
import { Avatar } from "@/components/studio/Avatar";
import type { ReferenceAsset } from "@/lib/webtoon/types";

export type MentionKind = "character" | "location" | "object" | "panel";

export type MentionItem = {
  kind: MentionKind;
  /** The id the panel uses (a character's subject, a place or object id, a panel id). */
  id: string;
  name: string;
  image?: string;
  avatar?: ReferenceAsset["avatar"];
  /** A second line: the project a sheet comes from, the text of a panel. */
  hint?: string;
};

export const MENTION_GROUPS: { kind: MentionKind; label: string }[] = [
  { kind: "character", label: "Personnages" },
  { kind: "location", label: "Lieux" },
  { kind: "object", label: "Objets" },
  { kind: "panel", label: "Cases" },
];

type MentionTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  items: MentionItem[];
  /** Called when a reference is picked: the caller attaches it (a sheet, a place, a panel image). */
  onMention?: (item: MentionItem) => void;
};

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** The "@word" being typed just before the caret, if any. */
function tokenAt(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  // Names have spaces ("Ghost rabbit", "Case 12"): the query may run over three words, never over a line.
  const match = /(^|[\s(\[,;:.!?«"'])@([^@\n]{0,32})$/u.exec(before);
  if (!match || match[2].split(/\s+/).length > 3 || /\s{2}/.test(match[2])) return null;
  return { start: caret - match[2].length - 1, query: match[2] };
}

/**
 * A textarea where "@" calls a reference: a list grouped by characters,
 * places, objects and panels, with their images, filtered as the author
 * types, driven by the arrows, Enter or Tab, and Escape. The chosen name is
 * written in the text and `onMention` attaches the reference itself.
 */
export function MentionTextarea({ value, onChange, items, onMention, onKeyDown, className = "", ...rest }: MentionTextareaProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const [token, setToken] = useState<{ start: number; query: string } | null>(null);
  const [active, setActive] = useState(0);

  const found = useMemo(() => {
    if (!token) return [];
    const q = fold(token.query.replace(/[-_]/g, " "));
    const scored = items
      .map((item) => {
        const name = fold(item.name);
        const score = !q ? 1 : name.startsWith(q) ? 3 : name.split(/\s+/).some((w) => w.startsWith(q)) ? 2 : name.includes(q) || fold(item.id).includes(q.replace(/\s+/g, "-")) ? 1 : 0;
        return { item, score };
      })
      .filter((m) => m.score > 0);
    // Grouped in the order of the groups, the best first inside each, a few per group.
    return MENTION_GROUPS.flatMap((group) =>
      scored
        .filter((m) => m.item.kind === group.kind)
        .sort((a, b) => b.score - a.score)
        .slice(0, q ? 8 : 5)
        .map((m) => m.item),
    );
  }, [items, token]);
  // A space in the query that matches nothing is the text going on after a name: the list closes quietly.
  const open = Boolean(token) && !(found.length === 0 && /\s/.test(token?.query ?? ""));
  const matches = open ? found : [];

  const refresh = (text: string, caret: number) => {
    const next = tokenAt(text, caret);
    setToken(next);
    setActive(0);
  };

  const pick = (item: MentionItem) => {
    if (!token) return;
    const label = `@${item.name}`;
    const next = `${value.slice(0, token.start)}${label} ${value.slice(token.start + 1 + token.query.length).replace(/^\s/, "")}`;
    onChange(next);
    onMention?.(item);
    setToken(null);
    const caret = token.start + label.length + 1;
    window.requestAnimationFrame(() => {
      area.current?.focus();
      area.current?.setSelectionRange(caret, caret);
    });
  };

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && matches.length) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setActive((i) => (i + (event.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        pick(matches[Math.min(active, matches.length - 1)]);
        return;
      }
    }
    if (open && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setToken(null);
      return;
    }
    onKeyDown?.(event);
  };

  let lastGroup: MentionKind | null = null;
  return (
    <div className="studio-mention">
      <textarea
        {...rest}
        ref={area}
        className={className}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          refresh(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={keyDown}
        onClick={(e) => refresh(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
        onBlur={() => window.setTimeout(() => setToken(null), 150)}
      />
      {open && token ? (
        <div className="studio-mention-list" role="listbox" aria-label="Références">
          {matches.length ? (
            matches.map((item, index) => {
              const head = item.kind !== lastGroup ? MENTION_GROUPS.find((g) => g.kind === item.kind)?.label : null;
              lastGroup = item.kind;
              return (
                <div key={`${item.kind}:${item.id}`}>
                  {head ? <p className="studio-mention-group">{head}</p> : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    className={`studio-mention-item ${index === active ? "is-active" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(item);
                    }}
                    onMouseEnter={() => setActive(index)}
                  >
                    {item.kind === "panel" ? (
                      item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" className="studio-mention-thumb" loading="lazy" />
                      ) : (
                        <span className="studio-mention-thumb" />
                      )
                    ) : (
                      <Avatar image={item.image} name={item.name} crop={item.kind === "character" ? item.avatar : undefined} mode={item.kind === "character" ? "face" : "cover"} size={28} />
                    )}
                    <span className="studio-mention-text">
                      <b>{item.name}</b>
                      {item.hint ? <small>{item.hint}</small> : null}
                    </span>
                  </button>
                </div>
              );
            })
          ) : (
            <p className="studio-mention-empty">Aucune référence pour « {token.query} »</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
