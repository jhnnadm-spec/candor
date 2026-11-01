/** A sentence with its figures and key finance terms in bold (see lib/emphasis.ts). */
import { Fragment } from "react";
import { emphasise } from "@/lib/emphasis";

export function Emph({ text }: { text: string }) {
  return (
    <>
      {emphasise(text).map((p, i) =>
        p.strong ? (
          <strong key={i} className="font-semibold text-ink">
            {p.text}
          </strong>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </>
  );
}
