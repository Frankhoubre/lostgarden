"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/** Where a dragged panel lands: before or after `id`; `axis` says whether the panels around it are stacked (y) or side by side (x, the list in a grid). */
export type DropTarget = { id: string; after: boolean; axis?: "x" | "y" };

type Options = {
  /** Called on release over a panel other than the one dragged. */
  onDrop: (dragId: string, target: DropTarget) => void;
  /** How long the button must stay down before the panel lifts (ms). */
  holdMs: number;
  /** A move of this many px before the hold ends lifts the panel at once (the list); unset, such a move cancels (the strip, where a press may be a scroll or a handle). */
  moveStartPx?: number;
  disabled?: boolean;
};

type Pending = { id: string; x: number; y: number; timer: number | null; source: HTMLElement };

const EDGE = 70;

/** The nearest ancestor that scrolls vertically, or the page. */
function scrollParent(node: HTMLElement | null): HTMLElement {
  for (let el = node?.parentElement ?? null; el; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 4) return el;
  }
  return (document.scrollingElement as HTMLElement) ?? document.documentElement;
}

/**
 * Press, hold, drag, drop: a panel of the list or of the strip lifts when the
 * button stays down (or, in the list, as soon as it moves), follows the
 * pointer, shows where it will land (a line before or after the panel under
 * the pointer), scrolls its column near the edges, and moves on release.
 * Escape cancels. The click that ends a drag is swallowed, so the drop does
 * not also select or check a panel. Each item spreads `bind(id)` on its root.
 */
export function usePanelDrag({ onDrop, holdMs, moveStartPx, disabled }: Options) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const pending = useRef<Pending | null>(null);
  const active = useRef<{ id: string; scroller: HTMLElement; group: string | null } | null>(null);
  const last = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRef = useRef<DropTarget | null>(null);
  const frame = useRef<number | null>(null);
  const onDropRef = useRef(onDrop);
  // The latest drop handler, read on release (it closes over the current panels).
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const locate = useCallback((x: number, y: number) => {
    const group = active.current?.group ?? null;
    const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop-id]");
    if (!hit || (group !== null && hit.dataset.dropGroup !== group)) return;
    const id = hit.dataset.dropId ?? "";
    const rect = hit.getBoundingClientRect();
    // Side by side when a neighbour sits on the same row (the list on a narrow screen is a grid).
    const neighbour = (hit.nextElementSibling ?? hit.previousElementSibling) as HTMLElement | null;
    const row = neighbour?.dataset.dropId !== undefined && Math.abs(neighbour.getBoundingClientRect().top - rect.top) < 4;
    const next: DropTarget = row ? { id, after: x > rect.left + rect.width / 2, axis: "x" } : { id, after: y > rect.top + rect.height / 2, axis: "y" };
    if (targetRef.current?.id !== next.id || targetRef.current.after !== next.after) {
      targetRef.current = next;
      setTarget(next);
    }
  }, []);

  const stop = useCallback((drop: boolean) => {
    if (pending.current?.timer) window.clearTimeout(pending.current.timer);
    pending.current = null;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = null;
    const was = active.current;
    const where = targetRef.current;
    active.current = null;
    targetRef.current = null;
    document.body.classList.remove("studio-dragging");
    setDragId(null);
    setTarget(null);
    setPointer(null);
    if (was) {
      // The click that follows the release must not select or check anything.
      const swallow = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
      };
      window.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 250);
      if (drop && where && where.id !== was.id) onDropRef.current(was.id, where);
    }
  }, []);

  const lift = useCallback(() => {
    const p = pending.current;
    if (!p) return;
    if (p.timer) window.clearTimeout(p.timer);
    p.timer = null;
    active.current = { id: p.id, scroller: scrollParent(p.source), group: p.source.dataset.dropGroup ?? null };
    document.body.classList.add("studio-dragging");
    window.getSelection()?.removeAllRanges();
    setDragId(p.id);
    setPointer({ ...last.current });
    locate(last.current.x, last.current.y);
    // Scroll the column while the pointer rests near its top or bottom edge.
    const tick = () => {
      const a = active.current;
      if (!a) return;
      const box = a.scroller === document.scrollingElement ? { top: 0, bottom: window.innerHeight } : a.scroller.getBoundingClientRect();
      const { y } = last.current;
      const speed = y < box.top + EDGE ? -Math.ceil((box.top + EDGE - y) / 4) : y > box.bottom - EDGE ? Math.ceil((y - (box.bottom - EDGE)) / 4) : 0;
      if (speed) {
        a.scroller.scrollBy(0, speed);
        locate(last.current.x, last.current.y);
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [locate]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      last.current = { x: event.clientX, y: event.clientY };
      const p = pending.current;
      if (active.current) {
        event.preventDefault();
        setPointer({ x: event.clientX, y: event.clientY });
        locate(event.clientX, event.clientY);
        return;
      }
      if (!p) return;
      const moved = Math.hypot(event.clientX - p.x, event.clientY - p.y);
      if (moveStartPx !== undefined && moved > moveStartPx) lift();
      else if (moveStartPx === undefined && moved > 8) stop(false);
    };
    const up = () => {
      if (active.current) stop(true);
      else if (pending.current) stop(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && (active.current || pending.current)) stop(false);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("keydown", key);
    };
  }, [lift, locate, moveStartPx, stop]);

  useEffect(() => () => stop(false), [stop]);

  const bind = useCallback(
    (id: string, group = "strip") => ({
      "data-drop-id": id,
      "data-drop-group": group,
      // The browser's own drag of the image inside a panel cancels the pointer events: never let it start.
      onDragStart: (event: { preventDefault: () => void }) => event.preventDefault(),
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        if (disabled || event.button !== 0 || active.current) return;
        // Form controls and the insert buttons keep their own behaviour.
        if ((event.target as HTMLElement).closest("input, select, textarea, .studio-thumb-insert, .studio-strip-insert, .studio-resize, .studio-handle")) return;
        last.current = { x: event.clientX, y: event.clientY };
        pending.current = { id, x: event.clientX, y: event.clientY, timer: window.setTimeout(lift, holdMs), source: event.currentTarget };
      },
    }),
    [disabled, holdMs, lift],
  );

  return { dragId, target, pointer, bind };
}
