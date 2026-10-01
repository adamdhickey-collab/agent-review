import { StoreProvider } from './store';
import { useRoute } from './router';
import { Shell } from '../review/Shell/Shell';
import { QueueScreen } from '../review/QueueScreen/QueueScreen';
import { ChangeScreen } from '../review/ChangeScreen/ChangeScreen';
import { EmptyState } from '../components';

export function App() {
  const route = useRoute();
  return (
    <StoreProvider>
      <Shell route={route}>
        {route.name === 'queue' ? <QueueScreen /> : null}
        {route.name === 'change' ? <ChangeScreen id={route.id} findingId={route.findingId} /> : null}
        {route.name === 'not-found' ? (
          <EmptyState icon="search" title="There is nothing at this address" description={<code>{route.path}</code>} action={{ label: 'Back to the queue', onClick: () => (location.hash = '#/') }} />
        ) : null}
      </Shell>
    </StoreProvider>
  );
}
