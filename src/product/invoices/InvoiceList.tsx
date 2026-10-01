import { Badge, Button, Cell, HeaderCell, Row, Table, Toolbar } from '../../components';
import './InvoiceList.css';

/* A second screen in Relay, small on purpose. It exists because a change
   to a shared component shows up where nobody was looking, and a review
   that only renders the screen the agent worked on cannot see that. This
   one uses Button three times and nothing else the agent touched. */

const invoices = [
  { id: 'INV-20418', company: 'Halvorsen Freight', amount: '$3,840.00', due: 'Oct 15', status: 'Open' },
  { id: 'INV-20417', company: 'Pinecrest Credit Union', amount: '$8,800.00', due: 'Oct 12', status: 'Open' },
  { id: 'INV-20409', company: 'Monarch Dental Group', amount: '$1,020.00', due: 'Sep 30', status: 'Overdue' },
  { id: 'INV-20402', company: 'Okafor Logistics', amount: '$5,040.00', due: 'Sep 28', status: 'Paid' },
  { id: 'INV-20395', company: 'Northgate Properties', amount: '$540.00', due: 'Sep 24', status: 'Overdue' },
];

export function InvoiceList() {
  return (
    <section className="invoices" aria-labelledby="invoices-title">
      <Toolbar
        label="Invoices"
        data-finding="invoice-actions"
        start={
          <h2 id="invoices-title" className="invoices__title">
            Invoices
          </h2>
        }
      >
        <Button size="compact" variant="secondary" leadingIcon="filter">
          Filter
        </Button>
        <Button size="compact" variant="secondary" leadingIcon="external">
          Export
        </Button>
        <Button size="compact" variant="primary" leadingIcon="plus">
          New invoice
        </Button>
      </Toolbar>
      <Table caption="Invoices, with amount, due date and status">
        <thead>
          <tr>
            <HeaderCell>Invoice</HeaderCell>
            <HeaderCell>Customer</HeaderCell>
            <HeaderCell numeric>Amount</HeaderCell>
            <HeaderCell>Due</HeaderCell>
            <HeaderCell>Status</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <Row key={i.id}>
              <Cell rowHeader>
                <code>{i.id}</code>
              </Cell>
              <Cell>{i.company}</Cell>
              <Cell numeric>{i.amount}</Cell>
              <Cell muted>{i.due}</Cell>
              <Cell>
                <Badge tone={i.status === 'Paid' ? 'success' : i.status === 'Overdue' ? 'danger' : 'neutral'}>{i.status}</Badge>
              </Cell>
            </Row>
          ))}
        </tbody>
      </Table>
    </section>
  );
}
