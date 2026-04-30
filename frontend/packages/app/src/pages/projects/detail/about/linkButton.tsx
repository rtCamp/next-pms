/**
 * External dependencies.
 */
import type { ComponentType, SVGProps } from "react";

interface LinkButtonProps {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export function LinkButton({ label, href, icon: Icon }: LinkButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-gray-2 text-ink-gray-7 transition-colors hover:bg-surface-gray-3"
    >
      <Icon aria-hidden className="size-[18px]" />
    </a>
  );
}
