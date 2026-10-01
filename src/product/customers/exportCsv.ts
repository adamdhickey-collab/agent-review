import { STATUS_LABEL, type Customer } from './customers';

/* Export, for the bulk action. A CSV of the selected rows, with the same
   columns the table shows, and a download through a Blob URL so nothing
   leaves the browser. The figures are raw (3840, not "$3,840") because a
   spreadsheet wants a number. */

const COLUMNS = ['Company', 'Owner', 'Plan', 'Status', 'Seats', 'MRR', 'Last active'] as const;

function field(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function customersToCsv(rows: Customer[]): string {
  const lines = [COLUMNS.join(',')];
  for (const c of rows) {
    lines.push([c.company, c.owner, c.plan, STATUS_LABEL[c.status], c.seats, c.mrr, c.lastActive].map(field).join(','));
  }
  return lines.join('\n') + '\n';
}

export const EXPORT_FILENAME = 'customers.csv';

export function downloadCsv(text: string, filename = EXPORT_FILENAME) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
