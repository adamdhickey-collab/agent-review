/* The customers in Relay, the product under review. Twelve rows, enough
   to need a table and a selection, not enough to need paging. Every
   company is invented. */

export type CustomerStatus = 'active' | 'trial' | 'past-due' | 'churned';

export interface Customer {
  id: string;
  company: string;
  owner: string;
  plan: 'Starter' | 'Growth' | 'Scale';
  status: CustomerStatus;
  seats: number;
  mrr: number;
  lastActive: string;
}

export const STATUS_LABEL: Record<CustomerStatus, string> = {
  active: 'Active',
  trial: 'Trial',
  'past-due': 'Past due',
  churned: 'Churned',
};

export const customers: Customer[] = [
  { id: 'c_01HZK3', company: 'Halvorsen Freight', owner: 'Priya Natarajan', plan: 'Scale', status: 'active', seats: 48, mrr: 3840, lastActive: '2 min ago' },
  { id: 'c_01HZK7', company: 'Brightwater Clinics', owner: 'Tomas Reyes', plan: 'Growth', status: 'active', seats: 22, mrr: 1320, lastActive: '14 min ago' },
  { id: 'c_01HZKB', company: 'Alder & Finch', owner: 'Priya Natarajan', plan: 'Starter', status: 'trial', seats: 5, mrr: 0, lastActive: '1 h ago' },
  { id: 'c_01HZKF', company: 'Monarch Dental Group', owner: 'Dana Whitfield', plan: 'Growth', status: 'past-due', seats: 17, mrr: 1020, lastActive: '3 h ago' },
  { id: 'c_01HZKJ', company: 'Okafor Logistics', owner: 'Tomas Reyes', plan: 'Scale', status: 'active', seats: 63, mrr: 5040, lastActive: '5 h ago' },
  { id: 'c_01HZKN', company: 'Saltmarsh Studio', owner: 'Dana Whitfield', plan: 'Starter', status: 'active', seats: 3, mrr: 87, lastActive: 'Yesterday' },
  { id: 'c_01HZKR', company: 'Pinecrest Credit Union', owner: 'Priya Natarajan', plan: 'Scale', status: 'active', seats: 110, mrr: 8800, lastActive: 'Yesterday' },
  { id: 'c_01HZKV', company: 'Verity Labs', owner: 'Tomas Reyes', plan: 'Growth', status: 'trial', seats: 12, mrr: 0, lastActive: '2 days ago' },
  { id: 'c_01HZKZ', company: 'Northgate Properties', owner: 'Dana Whitfield', plan: 'Growth', status: 'past-due', seats: 9, mrr: 540, lastActive: '4 days ago' },
  { id: 'c_01HZL3', company: 'Juniper Foods', owner: 'Priya Natarajan', plan: 'Starter', status: 'churned', seats: 0, mrr: 0, lastActive: '3 weeks ago' },
  { id: 'c_01HZL7', company: 'Tessaro Architects', owner: 'Tomas Reyes', plan: 'Growth', status: 'active', seats: 14, mrr: 840, lastActive: '3 weeks ago' },
  { id: 'c_01HZLB', company: 'Kestrel Aviation', owner: 'Dana Whitfield', plan: 'Scale', status: 'churned', seats: 0, mrr: 0, lastActive: '2 months ago' },
];

export function formatMrr(n: number): string {
  return n === 0 ? '—' : `$${n.toLocaleString('en-US')}`;
}

/* The columns an export carries, in the order the table shows them, with
   the raw figures rather than the formatted ones so a spreadsheet can add
   them. A field holding a comma, a quote or a line break is quoted, and a
   quote inside it is doubled, which is all the CSV grammar there is. */
const EXPORT_COLUMNS: { header: string; value: (c: Customer) => string | number }[] = [
  { header: 'Company', value: (c) => c.company },
  { header: 'Owner', value: (c) => c.owner },
  { header: 'Plan', value: (c) => c.plan },
  { header: 'Status', value: (c) => STATUS_LABEL[c.status] },
  { header: 'Seats', value: (c) => c.seats },
  { header: 'MRR', value: (c) => c.mrr },
  { header: 'Last active', value: (c) => c.lastActive },
];

function csvField(v: string | number): string {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function customersToCsv(rows: Customer[]): string {
  const head = EXPORT_COLUMNS.map((col) => csvField(col.header)).join(',');
  const body = rows.map((c) => EXPORT_COLUMNS.map((col) => csvField(col.value(c))).join(','));
  return [head, ...body].join('\r\n') + '\r\n';
}
