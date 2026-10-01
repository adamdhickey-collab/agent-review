import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import './Table.css';

/* Table primitives. A real <table>, with a caption (visually hidden when
   the heading above it already says what it is), sortable headers that
   announce their sort, numeric cells that align right in tabular figures,
   and two densities. Rows can be selected (aria-selected) and the row's
   ground says so; the checkbox says so too.

   Nothing here fetches, sorts or pages. Those belong to the screen using
   the table, and a table that did them would be a different component for
   every screen. */

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  caption: string;
  hideCaption?: boolean;
  density?: 'default' | 'compact';
  /** Rows have a hover ground and a pointer: the screen handles the press. */
  interactive?: boolean;
  children: ReactNode;
}

export function Table({ caption, hideCaption = true, density = 'default', interactive, className, children, ...rest }: TableProps) {
  /* The scroll region is focusable and named, so a keyboard can scroll a
     table wider than its frame (axe: scrollable-region-focusable; found
     by the Narrow story the day the system was built). */
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label={caption}>
      <table
        className={['table', `table--${density}`, interactive ? 'table--interactive' : '', className].filter(Boolean).join(' ')}
        {...rest}
      >
        <caption className={hideCaption ? 'visually-hidden' : 'table__caption'}>{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export type SortDirection = 'ascending' | 'descending' | 'none';

export interface HeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Right-aligned, for a column of figures. */
  numeric?: boolean;
  /** The column sorts; the cell becomes a button that says its direction. */
  sort?: SortDirection;
  onSort?: () => void;
  /** A control column (a checkbox): no label text, no padding to spare. */
  control?: boolean;
  children?: ReactNode;
}

export function HeaderCell({ numeric, sort, onSort, control, className, children, ...rest }: HeaderCellProps) {
  const cls = ['table__th', numeric ? 'table__cell--numeric' : '', control ? 'table__cell--control' : '', className].filter(Boolean).join(' ');
  if (sort !== undefined) {
    return (
      <th scope="col" aria-sort={sort === 'none' ? undefined : sort} className={cls} {...rest}>
        <button type="button" className="table__sort" onClick={onSort} data-sort={sort}>
          <span>{children}</span>
          <Icon name={sort === 'descending' ? 'chevron-down' : 'chevron-right'} size={12} className="table__sort-icon" />
          <span className="visually-hidden">
            {sort === 'none' ? ', not sorted' : sort === 'ascending' ? ', sorted ascending' : ', sorted descending'}
          </span>
        </button>
      </th>
    );
  }
  return (
    <th scope="col" className={cls} {...rest}>
      {children}
    </th>
  );
}

export interface CellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
  control?: boolean;
  /** Quieter ink, for a secondary value beside a primary one. */
  muted?: boolean;
  /** The row's name: a <th scope="row"> so a screen reader can name the row. */
  rowHeader?: boolean;
  children?: ReactNode;
}

export function Cell({ numeric, control, muted, rowHeader, className, children, ...rest }: CellProps) {
  const cls = ['table__td', numeric ? 'table__cell--numeric' : '', control ? 'table__cell--control' : '', muted ? 'table__cell--muted' : '', className]
    .filter(Boolean)
    .join(' ');
  if (rowHeader) {
    return (
      <th scope="row" className={cls} {...rest}>
        {children}
      </th>
    );
  }
  return (
    <td className={cls} {...rest}>
      {children}
    </td>
  );
}

export interface RowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  children: ReactNode;
}

export function Row({ selected, className, children, ...rest }: RowProps) {
  return (
    <tr aria-selected={selected} className={['table__tr', selected ? 'is-selected' : '', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </tr>
  );
}
