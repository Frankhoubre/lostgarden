"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string; note?: string };

type StudioDirectorProps = {
  /** Sends the conversation, runs the actions the director returns, and gives back its reply and what was done. */
  ask: (messages: { role: "user" | "assistant"; content: string }[]) => Promise<{ reply: string; done: string[] }>;
  busy: boolean;
};

/**
 * The AI director: a small floating conversation that can act anywhere in
 * the studio. The editor runs its actions; this component only holds the
 * thread and the input.
 */
export function StudioDirector({ ask, busy }: StudioDirectorProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const content = text.trim();
    if (!content || thinking) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setText("");
    setThinking(true);
    try {
      const { reply, done } = await ask(next.map(({ role, content: c }) => ({ role, content: c })));
      setMessages((current) => [...current, { role: "assistant", content: reply || "C'est fait.", note: done.length ? done.join(" · ") : undefined }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: `Je n'ai pas pu : ${error instanceof Error ? error.message : "erreur"}` }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className={`studio-director ${open ? "is-open" : ""}`}>
      {open ? (
        <div className="studio-director-panel" role="dialog" aria-label="Directeur IA">
          <header className="studio-director-head">
            <span className="anime-label text-xs text-cyan-pale">Directeur IA</span>
            <button type="button" className="webtoon-mini" onClick={() => setOpen(false)}>Fermer</button>
          </header>
          <div ref={list} className="studio-director-thread">
            {messages.length === 0 ? (
              <p className="studio-director-hint">
                Dites-moi ce que vous voulez, je m&apos;en occupe : « ajoute un son BAM sur cette case », « rends cette case plus sombre et regénère-la », « insère une case de détail après celle-ci sur le casque au sol », « ajoute le lapin fantôme à la bibliothèque », « écris les 10 cases suivantes en rythme action ».
              </p>
            ) : null}
            {messages.map((m, i) => (
              <div key={i} className={`studio-director-msg is-${m.role}`}>
                <p>{m.content}</p>
                {m.note ? <small>{m.note}</small> : null}
              </div>
            ))}
            {thinking ? (
              <div className="studio-director-msg is-assistant">
                <p><span className="studio-spinner" aria-hidden /> Je regarde…</p>
              </div>
            ) : null}
          </div>
          <form
            className="studio-director-input"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              rows={2}
              value={text}
              placeholder={busy ? "Une génération est en cours, je répondrai mais j'attendrai pour agir." : "Que voulez-vous changer ?"}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              disabled={thinking}
            />
            <button type="submit" className="webtoon-mini studio-primary" disabled={thinking || !text.trim()}>Envoyer</button>
          </form>
        </div>
      ) : null}
      <button type="button" className={`studio-director-fab ${thinking ? "is-busy" : ""}`} onClick={() => setOpen((o) => !o)} title="Directeur IA : demandez un changement, il le fait">
        {thinking ? <span className="studio-spinner" aria-hidden /> : "✦"} Directeur IA
      </button>
    </div>
  );
}
