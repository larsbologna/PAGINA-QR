import { Fragment } from "react";

/** Texto con *resaltado* en color de acento y saltos de línea respetados. */
export function RichText({ text, accent }: { text: string; accent: string }) {
  const parts = text.split(/(\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\*[^*\n]+\*$/.test(part) ? (
          <span key={i} style={{ color: accent }}>
            {part.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
