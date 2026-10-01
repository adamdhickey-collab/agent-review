import { forwardRef, useEffect, useImperativeHandle, useRef, type InputHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import './Checkbox.css';

/* A native checkbox with a drawn box. The input stays in the tree (it is
   what the keyboard and the screen reader use); the box is what the eye
   uses. Indeterminate is a real property on the input, set here, so a
   select-all box that is half-checked says so to assistive technology.

   The label is required. `hideLabel` keeps it for a screen reader when
   the row beside the box is the visible label, as in a table. */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: string;
  hideLabel?: boolean;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hideLabel, indeterminate = false, className, id, ...rest },
  ref,
) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inner.current as HTMLInputElement);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={['checkbox', className].filter(Boolean).join(' ')}>
      <input ref={inner} type="checkbox" className="checkbox__input" id={id} {...rest} />
      <span className="checkbox__box" aria-hidden="true">
        <Icon name={indeterminate ? 'minus' : 'check'} size={12} className="checkbox__mark" />
      </span>
      <span className={hideLabel ? 'visually-hidden' : 'checkbox__label'}>{label}</span>
    </label>
  );
});
