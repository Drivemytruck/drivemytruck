import { Fragment } from "react";

/**
 * Pure CSS 1–5 star picker. Stars are rendered 5→1 in the DOM and visually reversed,
 * so "checked star + every following sibling" = the selected star and all stars to its left.
 */
export function StarInput({ name = "rating" }: { name?: string }) {
  return (
    <fieldset className="flex flex-row-reverse justify-end gap-1">
      <legend className="sr-only">Rating (1 to 5 stars)</legend>
      {[5, 4, 3, 2, 1].map((n) => (
        <Fragment key={n}>
          <input type="radio" id={`${name}-${n}`} name={name} value={n} className="peer sr-only" required />
          <label
            htmlFor={`${name}-${n}`}
            className="cursor-pointer text-4xl leading-none text-slate-300 transition peer-checked:text-amber-400 peer-focus-visible:outline-2 peer-focus-visible:outline-navy-700"
          >
            <span aria-hidden>★</span>
            <span className="sr-only">{n} stars</span>
          </label>
        </Fragment>
      ))}
    </fieldset>
  );
}
