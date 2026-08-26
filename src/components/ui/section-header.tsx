import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Reveal } from "./reveal";

export function SectionHeader({
  index,
  title,
  aside,
  id,
}: {
  index: string;
  title: string;
  aside?: ReactNode;
  /** Heading anchor id for aria-labelledby on the section. */
  id?: string;
}) {
  return (
    <Reveal>
      <div className="mb-12 flex items-end justify-between gap-6 border-b border-border pb-5">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-xs text-accent tabular" aria-hidden>
            [{index}]
          </span>
          <h2
            id={id}
            className="font-mono text-sm font-medium tracking-[0.22em] text-text uppercase"
          >
            {title}
          </h2>
        </div>
        {aside && (
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            {aside}
          </div>
        )}
      </div>
    </Reveal>
  );
}

/** Shared page container — one width for the whole document. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}
