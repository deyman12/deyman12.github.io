import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { IconArrowUpRight } from "./icons";

type Variant = "primary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-text text-background hover:bg-text-secondary border border-transparent font-medium",
  ghost:
    "border border-border-strong text-text-secondary hover:text-text hover:border-text-muted bg-transparent",
};

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  external?: boolean;
  children: ReactNode;
}

export function LinkButton({
  variant = "ghost",
  external = false,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <a
      {...rest}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      data-variant={variant}
      className={cn(
        "group inline-flex items-center gap-2 rounded-sm px-4 py-2.5 font-mono text-xs tracking-wider uppercase transition-colors duration-200",
        variants[variant],
        className,
      )}
    >
      {children}
      {external && (
        <IconArrowUpRight
          size={12}
          className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </a>
  );
}
