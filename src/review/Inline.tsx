import { Fragment } from 'react';

/* Running text that names tokens, files or commits: each name is set as
   code, which is what the review does with anything a machine wrote, and
   never breaks inside itself. "--radius-full" broken after its two hyphens
   is two words to a reader, and neither is the token. The scenario's
   sentences are plain strings, so the names are found in them here rather
   than marked up by hand in every one. */

const NAME = /(--[a-z0-9-]+|\b[A-Za-z]+\.(?:css|ts|tsx)\b|#[0-9a-f]{6}\b)/g;

export function Inline({ text }: { text: string }) {
  const parts = text.split(NAME);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <code key={i} className="inline-name">
            {p}
          </code>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
