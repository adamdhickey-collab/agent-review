import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import './TextArea.css';

/* A few lines of a person's own words, with a visible label and a hint
   under it. Added 2026-10-09 for the reason a person gives when they decide
   a trade-off (DecisionRequest), which the decision record keeps.

   Why a new component (rule 10): the system had no text field at all. The
   review's only inputs were a Checkbox and the SegmentedControl, and
   neither takes words; a raw <textarea> in a screen would be the first
   element of its kind drawn outside the system, with its own border and
   focus ring. So it is built here, from the tokens: the control's border
   and radius, the surface ground, the body type, the base focus ring. The
   label is required and always visible (a placeholder is not a label), and
   the hint is tied to the field by aria-describedby, so a screen reader
   reads both. */

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  label: string;
  /** A line under the field, read with it. */
  hint?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ label, hint, className, id, rows = 3, ...rest }, ref) {
  const own = useId();
  const field = id ?? `${own}-field`;
  const note = hint ? `${own}-hint` : undefined;
  return (
    <div className={['textarea', className].filter(Boolean).join(' ')}>
      <label className="textarea__label" htmlFor={field}>
        {label}
      </label>
      <textarea ref={ref} id={field} className="textarea__field" rows={rows} aria-describedby={note} {...rest} />
      {hint ? (
        <p className="textarea__hint" id={note}>
          {hint}
        </p>
      ) : null}
    </div>
  );
});
