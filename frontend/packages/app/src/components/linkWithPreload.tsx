/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef } from "react";
import { Link, type LinkProps } from "react-router-dom";
/**
 * Internal dependencies.
 */
import { preloadRouteComponent } from "@/lib/preload-route";

export type PrefetchBehavior = "none" | "intent" | "render" | "viewport";

type LinkWithPreloadProps = LinkProps & {
  /**
   * When the target view's chunk is preloaded:
   * - `none`: never.
   * - `intent`: on hover or focus (default).
   * - `render`: as soon as the link mounts.
   * - `viewport`: when the link scrolls into view.
   */
  prefetch?: PrefetchBehavior;
};

const LinkWithPreload = ({
  to,
  prefetch = "intent",
  ...rest
}: LinkWithPreloadProps) => {
  const ref = useRef<HTMLAnchorElement>(null);

  const preload = useCallback(() => {
    preloadRouteComponent(typeof to === "string" ? to : (to.pathname ?? ""));
  }, [to]);

  useEffect(() => {
    if (prefetch === "render") {
      preload();
    }
  }, [prefetch, preload]);

  useEffect(() => {
    if (prefetch !== "viewport") {
      return;
    }
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        preload();
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [prefetch, preload]);

  const handleMouseEnter = () => {
    if (prefetch === "intent") {
      preload();
    }
  };

  const handleFocus = () => {
    if (prefetch === "intent") {
      preload();
    }
  };

  return (
    <Link
      ref={ref}
      to={to}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      {...rest}
    />
  );
};

export default LinkWithPreload;
