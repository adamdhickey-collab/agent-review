import { useCallback, useMemo, useState } from 'react';
import { Badge, Button, EmptyState, Icon, Tabs } from '../../components';
import { useStore } from '../../app/store';
import { navigate } from '../../app/router';
import type { Finding, Screen, ValidationSummary as Summary } from '../../data/types';
import { relativeTime } from '../format';
import { ValidationSummary, kindsForLane } from '../ValidationSummary/ValidationSummary';
import { FindingList } from '../FindingList/FindingList';
import { ComponentPreview } from '../ComponentPreview/ComponentPreview';
import { hasVersions } from '../preview/screens';
import { DiffViewer } from '../DiffViewer/DiffViewer';
import { AgentRationale } from '../AgentRationale/AgentRationale';
import { DecisionBar } from '../DecisionBar/DecisionBar';
import { ReturnPanel } from '../ReturnPanel/ReturnPanel';
import { StoryList } from '../StoryList/StoryList';
import { FileList } from '../FileList/FileList';
import './ChangeScreen.css';

/* The review. Header with the change and the decision; the validation
   summary as one line; then two columns: the findings as the spine on
   the left, and the evidence on the right: the preview, which follows the
   selected finding, and the diff, which marks the finding's lines.

   The reviewer is Dana Whitfield, who requested the change; in a real
   deployment that is whoever is signed in. */

const STORYBOOK = 'storybook/';

type LeftTab = 'findings' | 'files' | 'stories' | 'rationale';

export function ChangeScreen({ id, findingId }: { id: string; findingId?: string }) {
  const store = useStore();
  const change = store.find(id);
  const [lane, setLane] = useState<keyof Summary | undefined>();
  const [tab, setTab] = useState<LeftTab>('findings');
  const [included, setIncluded] = useState<Set<string>>(() => new Set(change?.findings.filter((f) => f.severity !== 'note' && f.correction).map((f) => f.id)));
  const [returning, setReturning] = useState(false);

  const selected = useMemo(() => change?.findings.find((f) => f.id === findingId), [change, findingId]);
  const select = useCallback((fid: string | undefined) => navigate({ name: 'change', id, findingId: fid }, true), [id]);
  const openStory = useCallback((storyId: string) => window.open(`${STORYBOOK}?path=/story/${storyId}`, '_blank', 'noopener'), []);

  if (!change) {
    return <EmptyState icon="search" title="No change with that id" description={<code>{id}</code>} action={{ label: 'Back to the queue', onClick: () => navigate({ name: 'queue' }) }} />;
  }

  const visible: Finding[] = lane ? change.findings.filter((f) => kindsForLane(lane).includes(f.kind)) : change.findings;
  const screens: Screen[] = Array.from(new Set(change.findings.map((f) => f.reproduce?.screen).filter(Boolean))) as Screen[];
  const previewScreens = screens.length ? screens : ['customers' as Screen];
  const afterMissing = !hasVersions(change.id);

  return (
    <div className="change">
      <header className="change__header">
        <div className="change__heading">
          <a href="#/" className="change__back">
            <Icon name="arrow-left" size={14} />
            Queue
          </a>
          <h1 className="change__title">{change.title}</h1>
          <p className="change__meta">
            <code>{change.repo}</code>
            <span className="change__sep" aria-hidden="true">
              ·
            </span>
            <Icon name="git-branch" size={12} />
            <code>{change.branch}</code>
            <span className="change__sep" aria-hidden="true">
              ·
            </span>
            <code>{change.commit}</code>
            <span className="change__sep" aria-hidden="true">
              ·
            </span>
            <Icon name="bot" size={12} />
            {change.agent.name} <code className="change__run">{change.agent.run}</code>
            <span className="change__sep" aria-hidden="true">
              ·
            </span>
            requested by {change.requester.name}
            <span className="change__sep" aria-hidden="true">
              ·
            </span>
            <Icon name="clock" size={12} />
            {relativeTime(change.openedAt)}
          </p>
        </div>
        <DecisionBar
          change={change}
          onAccept={() => store.decide(change.id, { action: 'accept', by: { name: 'Dana Whitfield', role: 'Product design' }, at: new Date().toISOString() })}
          onReject={(reason) => store.decide(change.id, { action: 'reject', by: { name: 'Dana Whitfield', role: 'Product design' }, at: new Date().toISOString(), message: reason })}
          onReturn={() => setReturning(true)}
          onUndo={() => store.undo(change.id)}
          canUndo={store.last?.id === change.id}
        />
      </header>

      <div className="change__summary">
        <ValidationSummary summary={change.validation} active={lane} onSelect={setLane} />
        <div className="change__touched">
          <span className="change__touched-label">Components touched</span>
          {change.componentsTouched.map((c) => (
            <Badge key={c} tone={change.files.some((f) => f.shared && f.path.includes(`/${c}/`)) ? 'warning' : 'neutral'}>
              {c}
            </Badge>
          ))}
        </div>
      </div>

      <div className="change__body">
        <aside className="change__spine" aria-label="Findings and details">
          <Tabs
            label="Review details"
            tabs={[
              { value: 'findings', label: 'Findings', count: visible.length },
              { value: 'files', label: 'Files', count: change.files.length },
              { value: 'stories', label: 'Stories', count: change.stories.length },
              { value: 'rationale', label: 'Rationale' },
            ]}
            value={tab}
            onChange={setTab}
          >
            {tab === 'findings' ? (
              <>
                {lane ? (
                  <div className="change__filter">
                    Showing {visible.length} of {change.findings.length}
                    <Button size="compact" variant="ghost" onClick={() => setLane(undefined)}>
                      Show all
                    </Button>
                  </div>
                ) : null}
                <FindingList
                  findings={visible}
                  selectedId={findingId}
                  onSelect={select}
                  included={included}
                  onInclude={(fid, on) => {
                    const next = new Set(included);
                    if (on) next.add(fid);
                    else next.delete(fid);
                    setIncluded(next);
                  }}
                  onOpenStory={openStory}
                />
              </>
            ) : null}
            {tab === 'files' ? <FileList files={change.files} /> : null}
            {tab === 'stories' ? <StoryList stories={change.stories} onOpen={openStory} /> : null}
            {tab === 'rationale' ? <AgentRationale rationale={change.rationale} agentName={change.agent.name} /> : null}
          </Tabs>
        </aside>

        <section className="change__evidence" aria-label="Preview and diff">
          <ComponentPreview
            changeId={change.id}
            reproduce={selected?.reproduce}
            screens={previewScreens}
            note={afterMissing ? 'The agent’s branch has not been loaded into this build; the After side shows the baseline.' : undefined}
          />
          {selected ? (
            <p className="change__reproducing" role="status">
              <Icon name="eye" size={14} />
              Showing <strong>{selected.title}</strong>
              {selected.reproduce ? (
                <>
                  : {selected.reproduce.side}, at {selected.reproduce.viewport}px
                  {selected.reproduce.target ? ', the element outlined' : ''}
                </>
              ) : null}
            </p>
          ) : null}
          <div className="change__diff">
            <h2 className="change__section-title">Diff</h2>
            <DiffViewer hunks={change.diff} selectedFindingId={findingId} onSelectFinding={(fid) => select(fid)} />
          </div>
        </section>
      </div>

      {returning ? (
        <ReturnPanel
          findings={change.findings}
          initiallyIncluded={included}
          onClose={() => setReturning(false)}
          onSend={(message, ids) => {
            store.decide(change.id, { action: 'return', by: { name: 'Dana Whitfield', role: 'Product design' }, at: new Date().toISOString(), message, findingIds: ids });
            setReturning(false);
          }}
        />
      ) : null}
    </div>
  );
}
