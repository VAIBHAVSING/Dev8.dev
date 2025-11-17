"use client";

import dynamic from "next/dynamic";
import * as React from "react";

// Load Monaco editor only on client
const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export type CodeEditorProps = {
  value: string;
  language: "javascript" | "typescript" | "json" | "css" | "html";
  onChange: (code: string) => void;
  className?: string;
  height?: number | string;
};

export function CodeEditor({ value, language, onChange, className, height = 420 }: CodeEditorProps) {
  return (
    <div className={className}>
      <Monaco
        height={typeof height === "number" ? `${height}px` : height}
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 8 },
          renderWhitespace: "selection",
        }}
      />
    </div>
  );
}
