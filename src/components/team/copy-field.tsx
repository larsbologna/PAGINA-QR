"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/form";

export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const id = `copy-${label.replace(/\W+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="mt-1.5 flex gap-2">
        <Input id={id} readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
        <button
          type="button"
          className={buttonClass("secondary", "md")}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
            } catch {
              (document.getElementById(id) as HTMLInputElement | null)?.select();
              document.execCommand("copy");
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
