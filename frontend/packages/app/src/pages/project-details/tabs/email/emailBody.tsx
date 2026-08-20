/**
 * External dependencies.
 */
import { useEffect, useRef } from "react";

const MIN_HEIGHT = 38;
const MAX_HEIGHT = 300;

// Wraps raw email HTML in an isolated document. Loads Inter so the email
// font matches the app; sandbox blocks scripts but allows same-origin DOM
// access so the ResizeObserver can auto-size the iframe.
function buildSrcdoc(html: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
    <style>
      body { margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; font-weight: 420; line-height: 1.5; color: #383838; overflow-wrap: break-word; }
      a { color: #171717; text-decoration: underline; font-weight: 500; }
      img { max-width: 100%; }
    </style>
  </head>
  <body>${html}</body>
</html>`;
}

type EmailBodyProps = {
  html: string;
};

export function EmailBody({ html }: EmailBodyProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: ResizeObserver | null = null;

    const onLoad = () => {
      observer?.disconnect();

      const body = iframe.contentDocument?.body;
      if (!body) return;

      const doc = iframe.contentDocument!;
      const syncHeight = () => {
        // Clear any overflow and collapse to 0 so the html element can't
        // stretch to fill the previous iframe height - otherwise
        // documentElement.scrollHeight picks up the viewport size, not the
        // intrinsic content height, and can be off by 1+ px.
        body.style.overflowY = "";
        iframe.style.height = "0px";
        const raw = doc.documentElement.scrollHeight;
        const capped = raw > MAX_HEIGHT;
        iframe.style.height = `${Math.min(Math.max(raw, MIN_HEIGHT), MAX_HEIGHT)}px`;
        body.style.overflowY = capped ? "auto" : "";
      };

      syncHeight();

      // Re-sync if the body resizes (e.g. images finish loading).
      observer = new ResizeObserver(syncHeight);
      observer.observe(body);
    };

    iframe.addEventListener("load", onLoad);

    return () => {
      iframe.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={buildSrcdoc(html)}
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      className="w-full border-none"
      title="Email content"
    />
  );
}
