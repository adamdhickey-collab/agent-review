import { useCallback, useMemo, useState } from 'react';
import { Badge, Button, EmptyState, Icon, Tabs } from '../../components';
import { useStore } from '../../app/store';
import { navigate, titleTransitionName } from '../../app/router';
import type { Finding, Screen, ValidationSummary as Summary } from '../../data/types';
import { relativeTime } from '../format';
import { ValidationSummary, kindsForLane, laneLabel } from '../ValidationSummary/ValidationSummary';
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

/* What the evidence column is showing for a finding, as one sentence: the
   line above the diff says it, and so does the status line. */
function showing(f: Finding): string {
  const r = f.reproduce;
  return `Showing ${f.title}${r ? `: ${r.side}, at ${r.viewport}px${r.target ? ', the element outlined' : ''}` : ''}`;
}

type LeftTab = 'findings' | 'files' | 'stories' | 'rationale';

export function ChangeScreen({ id, findingId }: { id: string; findingId?: string }) {
  const store = useStore();
  const change = store.find(id);
  const [lane, setLane] = useState<keyof Summary | undefined>();
  const [tab, setTab] = useState<LeftTab>('findings');
  const [included, setIncluded] = useState<Set<string>>(() => new Set(change?.findings.filter((f) => f.severity !== 'note' && f.correction).map((f) => f.id)));
  const [returning, setReturning] = useState(false);
  /* The one status line for the screen. Filtering by a lane and opening a
     finding both change what a reader is looking at without moving focus,
     so each says what it did here (WCAG 4.1.3). It is always in the page,
     because a live region added along with its text is not reliably read;
     its text is set by the action, so a first load says nothing. */
  const [said, setSaid] = useState('');

  const selected = useMemo(() => change?.findings.find((f) => f.id === findingId), [change, findingId]);
  const select = useCallback(
    (fid: string | undefined) => {
      navigate({ name: 'change', id, findingId: fid }, true);
      const f = fid ? change?.findings.find((x) => x.id === fid) : undefined;
      setSaid(f ? showing(f) : '');
    },
    [id, change],
  );
  const openStory = useCallback((storyId: string) => window.open(`${STORYBOOK}?path=/story/${storyId}`, '_blank', 'noopener'), []);

  if (!change) {
    return (
      <>
        <h1 className="visually-hidden" tabIndex={-1}>
          No change with that id
        </h1>
        <EmptyState icon="search" title="No change with that id" description={<code>{id}</code>} action={{ label: 'Back to the queue', onClick: () => navigate({ name: 'queue' }) }} />
      </>
    );
  }

  const visible: Finding[] = lane ? change.findings.filter((f) => kindsForLane(lane).includes(f.kind)) : change.findings;
  const screens: Screen[] = Array.from(new Set(change.findings.map((f) => f.reproduce?.screen).filter(Boolean))) as Screen[];
  const previewScreens = screens.length ? screens : ['customers' as Screen];
  const afterMissing = !hasVersions(change.id);
  const pickLane = (next: keyof Summary | undefined) => {
    setLane(next);
    const shown = next ? change.findings.filter((f) => kindsForLane(next).includes(f.kind)).length : change.findings.length;
    setSaid(next ? `Showing ${shown} of ${change.findings.length} findings: ${laneLabel(next)}` : `Showing all ${change.findings.length} findings`);
  };

  return (
    <div className="change">
      <header className="change__header">
        <div className="change__heading">
          <a href="#/queue" className="change__back">
            <Icon name="arrow-left" size={14} />
            Reviews
          </a>
          <h1 className="change__title" tabIndex={-1} style={{ viewTransitionName: titleTransitionName(change.id) }}>
            {change.title}
          </h1>
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
            {change.sample ? (
              <>
                <span className="change__sep" aria-hidden="true">
                  ·
                </span>
                <Badge variant="quiet">Sample, not a real run</Badge>
              </>
            ) : null}
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
        <ValidationSummary summary={change.validation} active={lane} onSelect={pickLane} />
        <div className="change__touched">
          <span className="change__touched-label">Components touched</span>
          {change.componentsTouched.map((c) => {
            const shared = change.files.some((f) => f.shared && f.path.includes(`/${c}/`));
            return (
              <span key={c} className={shared ? 'change__component change__component--shared' : 'change__component'}>
                {shared ? <Icon name="alert" size={12} /> : null}
                {c}
                {shared ? <span className="visually-hidden"> (a shared component)</span> : null}
              </span>
            );
          })}
        </div>
      </div>

      <div className="change__body">
        <aside className="change__spine" aria-labelledby="spine-title">
          {/* The screen's own sections are headings as well as landmarks, so
              moving by heading reaches them, and not only the product's
              headings inside the preview. Visually the tabs and the frame
              already say what each is. */}
          <h2 id="spine-title" className="visually-hidden">
            Findings and details
          </h2>
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
                    <Button size="compact" variant="ghost" onClick={() => pickLane(undefined)}>
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
          <h2 className="visually-hidden">Preview</h2>
          <ComponentPreview
            changeId={change.id}
            reproduce={selected?.reproduce}
            screens={previewScreens}
            skipTo="diff"
            note={afterMissing ? 'The agent’s branch has not been loaded into this build; the After side shows the baseline.' : undefined}
          />
          {selected ? (
            <p className="change__reproducing">
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
            <h2 id="diff" className="change__section-title" tabIndex={-1}>
              Diff
            </h2>
            <DiffViewer
              hunks={change.diff}
              selectedFindingId={findingId}
              onSelectFinding={(fid) => select(fid)}
              findingTitle={(fid) => change.findings.find((f) => f.id === fid)?.title}
            />
          </div>
        </section>
      </div>

      <p className="visually-hidden" role="status">
        {said}
      </p>

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
