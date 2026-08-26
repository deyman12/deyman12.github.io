import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { SectionId } from "../../data/profile";
import type { RepoCategory } from "../../types/repository";
import { profile } from "../../data/profile";
import { cn } from "../../lib/utils";
import { setScrollLocked } from "../../lib/smooth-scroll";

interface Line {
  id: number;
  text: string;
  tone: "cmd" | "out" | "err" | "dim" | "ok";
}

const toneClass: Record<Line["tone"], string> = {
  cmd: "text-text",
  out: "text-text-secondary",
  err: "text-warn",
  dim: "text-text-muted",
  ok: "text-accent",
};

const HELP_LINES = [
  "available commands:",
  "  repos        open the repository index",
  "  experiments  filter index by experiments",
  "  forks        filter index by forks",
  "  about        what this workspace is",
  "  github       open the github profile",
  "  clear        wipe the terminal",
] as const;

export function CommandPalette({
  open,
  onOpen,
  onClose,
  onNavigate,
  onFilter,
}: {
  open: boolean;
  /** Called when the toggle hotkey fires while closed. */
  onOpen: () => void;
  onClose: () => void;
  onNavigate: (id: SectionId) => void;
  onFilter: (f: RepoCategory | "all") => void;
}) {
  const reduce = useReducedMotion();
  const [lines, setLines] = useState<Line[]>([
    {
      id: 0,
      text: `deyman12/lab shell — type 'help' for commands`,
      tone: "dim",
    },
  ]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // toggle hotkey: ctrl or cmd + slash
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        if (open) onClose();
        else onOpen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpen, onClose]);

  /* focus management + page scroll lock while open */
  useEffect(() => {
    setScrollLocked(open);
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => {
      previous?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const push = useCallback((text: string, tone: Line["tone"] = "out") => {
    setLines((prev) => [...prev, { id: nextId.current++, text, tone }]);
  }, []);

  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim().toLowerCase();
      if (!cmd) return;
      push(`$ ${cmd}`, "cmd");
      setHistory((h) => [...h, cmd]);
      setHistoryIndex(-1);

      switch (cmd.split(/\s+/)[0]) {
        case "help":
          for (const l of HELP_LINES)
            push(l, l.startsWith("  ") ? "out" : "dim");
          break;
        case "repos":
          push("opening repository index…", "ok");
          onFilter("all");
          onNavigate("repositories");
          break;
        case "experiments":
          push("filtering: experiment", "ok");
          onFilter("experiment");
          onNavigate("repositories");
          break;
        case "forks":
          push("filtering: fork", "ok");
          onFilter("fork");
          onNavigate("repositories");
          break;
        case "about":
          push("navigating to manifest…", "ok");
          onNavigate("manifest");
          break;
        case "github":
          push(`opening ${profile.githubUrl} …`, "ok");
          window.open(profile.githubUrl, "_blank", "noopener,noreferrer");
          break;
        case "clear":
          setLines([]);
          break;
        default:
          push(`command not found: ${cmd} — try 'help'`, "err");
      }
    },
    [push, onFilter, onNavigate],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Enter") {
      run(value);
      setValue("");
      return;
    }
    if (e.key === "ArrowUp" && history.length > 0) {
      e.preventDefault();
      const i =
        historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(i);
      setValue(history[i] ?? "");
    }
    if (e.key === "ArrowDown" && historyIndex >= 0) {
      e.preventDefault();
      const i = historyIndex + 1;
      if (i >= history.length) {
        setHistoryIndex(-1);
        setValue("");
      } else {
        setHistoryIndex(i);
        setValue(history[i] ?? "");
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[16vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Lab terminal"
            className="w-full max-w-xl overflow-hidden rounded-md border border-border-strong bg-background/95 shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)]"
            initial={
              reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.985 }
            }
            animate={{ opacity: 1, ...(reduce ? {} : { y: 0, scale: 1 }) }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
                lab shell
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close terminal"
                className="font-mono text-[11px] tracking-wider text-text-muted transition-colors hover:text-text"
              >
                esc ✕
              </button>
            </div>

            <div
              ref={scrollRef}
              className="h-64 space-y-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed"
              aria-live="polite"
            >
              {lines.map((l) => (
                <p
                  key={l.id}
                  className={cn("whitespace-pre-wrap", toneClass[l.tone])}
                >
                  {l.text}
                </p>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-border p-4 font-mono text-[13px]">
              <span aria-hidden className="text-accent">
                $
              </span>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="type a command…"
                aria-label="Terminal command input"
                className="flex-1 bg-transparent text-text outline-none placeholder:text-text-muted"
              />
              <kbd className="hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:block">
                ⌃/
              </kbd>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
