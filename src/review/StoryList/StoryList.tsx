import { Badge, Button, EmptyState } from '../../components';
import type { StoryRef } from '../../data/types';
import './StoryList.css';

/* The stories this change touches or adds: the ones the visual run
   compared, and the ones that are new and so have no baseline yet. Each
   opens in the Storybook. */

export function StoryList({ stories, onOpen }: { stories: StoryRef[]; onOpen: (id: string) => void }) {
  if (stories.length === 0) {
    return <EmptyState compact icon="book" title="No stories touched" description="This change renders in no story, which means no state of it was compared or tested." />;
  }
  return (
    <ul className="stories">
      {stories.map((s) => (
        <li key={s.id} className="stories__item">
          <span className="stories__name">
            <span className="stories__title">{s.title}</span>
            <span className="stories__story">{s.name}</span>
          </span>
          {s.isNew ? <Badge tone="accent">New</Badge> : null}
          <Button size="compact" variant="ghost" trailingIcon="arrow-up-right" onClick={() => onOpen(s.id)}>
            Open
            <span className="visually-hidden">
              {' '}
              {s.title} / {s.name} in Storybook
            </span>
          </Button>
        </li>
      ))}
    </ul>
  );
}
