import * as React from "react";
import { cn } from "cn";

type ClipButtonProps = {
  className?: string;
  size?: "sm" | "lg";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  href?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
} & React.PropsWithChildren;

const labelSizes = {
  sm: "gap-1.5 sm:gap-2 px-4 py-2 text-[11px] sm:px-5 sm:py-2.5 sm:text-[12px]",
  lg: "gap-2 sm:gap-2.5 px-7 py-3.5 text-[12px] sm:px-9 sm:py-4 sm:text-[13px]",
};

/**
 * Clipped tag/sticker button with dog-eared corners.
 * Renders an anchor when href is provided, otherwise a button.
 */
function ClipButton({
  className,
  size = "sm",
  onClick,
  type = "button",
  href,
  target,
  rel,
  ariaLabel,
  children,
}: ClipButtonProps) {
  const classes = cn(
    "group relative inline-flex select-none items-center font-semibold uppercase tracking-[0.14em] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-px text-foreground w-full justify-center sm:w-auto",
    className
  );

  const label = (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-0 clip-tag transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] bg-foreground/80 group-hover:bg-primary"
      />
      <span
        aria-hidden="true"
        className="absolute inset-[1.5px] clip-tag transition-colors duration-300 bg-background group-hover:bg-background/90"
      />
      <span
          className={cn(
            "relative z-10 inline-flex items-center justify-center transition-transform duration-300 group-hover:scale-105 [&_svg]:shrink-0",
            labelSizes[size]
          )}
        >
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        className={classes}
        onClick={onClick}
      >
        {label}
      </a>
    );
  }

  return (
    <button type={type} aria-label={ariaLabel} className={classes} onClick={onClick}>
      {label}
    </button>
  );
}

export { ClipButton };