import { StoreProvider } from './store';
import { href, useRoute } from './router';
import { useRouteEffects } from './useRouteEffects';
import { Shell } from '../review/Shell/Shell';
import { QueueScreen } from '../review/QueueScreen/QueueScreen';
import { DelegationScreen } from '../review/DelegationScreen/DelegationScreen';
import { ChangeScreen } from '../review/ChangeScreen/ChangeScreen';
import { CycleScreen } from '../review/CycleScreen/CycleScreen';
import { SceneScreen } from '../review/SceneScreen/SceneScreen';
import { TourProvider, useTour } from '../review/Tour/Tour';
import { About, Compare, Decision, Start } from '../review/QuickScreen/QuickScreen';
import { EmptyState } from '../components';

/* The store has to be above anything that reads it, and the route effects
   read it for the screen's title, so the screens sit one level down. */
function Screens() {
  const { route, arrival } = useRoute();
  useRouteEffects(route, arrival);
  /* The tour puts the cycle somewhere by its actions and asks for a fresh screen there (review/Tour). */
  const { epoch } = useTour();
  if (route.name === 'scene') return <SceneScreen id={route.id} />;
  return (
    <Shell route={route}>
      {route.name === 'start' ? <Start /> : null}
      {route.name === 'compare' ? <Compare fix={route.fix ?? 'undo'} /> : null}
      {route.name === 'decision' ? <Decision batch={route.batch ?? 'active'} /> : null}
      {route.name === 'about' ? <About /> : null}
      {route.name === 'delegation' ? <DelegationScreen run={route.run ?? 'billing'} /> : null}
      {route.name === 'cycle' ? <CycleScreen key={epoch} stage={route.stage} /> : null}
      {route.name === 'queue' ? <QueueScreen /> : null}
      {route.name === 'change' ? <ChangeScreen id={route.id} findingId={route.findingId} /> : null}
      {route.name === 'not-found' ? (
        <>
          <h1 className="visually-hidden" tabIndex={-1}>
            Page not found
          </h1>
          <EmptyState icon="search" title="There is nothing at this address" description={<code>{route.path}</code>} action={{ label: 'Back to the delegated work', onClick: () => (location.hash = href({ name: 'delegation' })) }} />
        </>
      ) : null}
    </Shell>
  );
}

export function App() {
  return (
    <StoreProvider>
      <TourProvider>
        <Screens />
      </TourProvider>
    </StoreProvider>
  );
}
