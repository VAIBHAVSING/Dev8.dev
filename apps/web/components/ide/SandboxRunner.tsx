"use client";

import * as React from "react";

export type SandboxRunnerHandle = {
  run: (code: string, language: "javascript" | "typescript") => void;
  clear: () => void;
};

export type SandboxRunnerProps = {
  onLog?: (line: string) => void;
  className?: string;
};

export const SandboxRunner = React.forwardRef<SandboxRunnerHandle, SandboxRunnerProps>(
  function SandboxRunner({ onLog, className }, ref) {
    const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

    React.useImperativeHandle(ref, () => ({
      run(code, language) {
        const iframe = iframeRef.current;
        if (!iframe) return;
        // Very simple sandbox that reroutes console to parent and evaluates JS/TS
        // For TS, we transpile with a naive approach: strip types via a tiny regex as a placeholder.
        // For production, use a real transpiler like sucrase or swc in a web worker.
        const js = language === "typescript" ? code.replace(/:\s*[^=;,)]+/g, "") : code;
        const html = `<!doctype html><html><head><meta charset=\"utf-8\" /><style>body{font:12px monospace;color:#e2e8f0;background:#0f172a;padding:8px}</style></head><body><script>
          const send = (type, args) => parent.postMessage({ type, args }, '*');
          const origLog = console.log, origErr = console.error;
          console.log = (...a) => { send('log', a.map(x=>String(x))); origLog(...a); };
          console.error = (...a) => { send('error', a.map(x=>String(x))); origErr(...a); };
          try { 
            ${js}
          } catch (e) { console.error(e && e.stack ? e.stack : String(e)); }
        <\/script></body></html>`;
        iframe.srcdoc = html;
      },
      clear() {
        const iframe = iframeRef.current;
        if (iframe) iframe.srcdoc = "<html><body></body></html>";
      },
    }));

    React.useEffect(() => {
      const handler = (ev: MessageEvent) => {
        if (ev?.data?.type === "log") {
          onLog?.(ev.data.args.join(" "));
        } else if (ev?.data?.type === "error") {
          onLog?.(ev.data.args.join(" "));
        }
      };
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }, [onLog]);

    return <iframe ref={iframeRef} className={className} sandbox="allow-scripts" />;
  }
);
