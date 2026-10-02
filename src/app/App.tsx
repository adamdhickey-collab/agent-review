import { StoreProvider } from './store';
import { useRoute } from './router';
import { useRouteEffects } from './useRouteEffects';
import { Shell } from '../review/Shell/Shell';
import { QueueScreen } from '../review/QueueScreen/QueueScreen';
import { ChangeScreen } from '../review/ChangeScreen/ChangeScreen';
import { EmptyState } from '../components';

/* The store has to be above anything that reads it, and the route effects
   read it for the screen's title, so the screens sit one level down. */
function Screens() {
  const route = useRoute();
  useRouteEffects(route);
  return (
    <Shell route={route}>
      {route.name === 'queue' ? <QueueScreen /> : null}
      {route.name === 'change' ? <ChangeScreen id={route.id} findingId={route.findingId} /> : null}
      {route.name === 'not-found' ? (
        <>
          <h1 className="visually-hidden" tabIndex={-1}>
            Page not found
          </h1>
          <EmptyState icon="search" title="There is nothing at this address" description={<code>{route.path}</code>} action={{ label: 'Back to the queue', onClick: () => (location.hash = '#/') }} />
        </>
      ) : null}
    </Shell>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Screens />
    </StoreProvider>
  );
}
