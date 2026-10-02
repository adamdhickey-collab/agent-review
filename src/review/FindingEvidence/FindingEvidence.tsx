import { Badge, Button, TestStatus } from '../../components';
import type { Finding, StoryRef } from '../../data/types';
import './FindingEvidence.css';

/* The evidence for a finding, by kind. One component with six shapes,
   because what a reviewer needs to see differs by what was found: a
   component finding shows what was written against what exists, a token
   finding shows the literal against the scale, a contrast finding shows
   the measurement against the floor, a visual finding names the story
   and the pixels, a state finding names the state and whether it has a
   story, an interaction finding lists the tests. */

function StoryLink({ story, onOpen, label = 'Open in Storybook' }: { story: StoryRef; onOpen?: (id: string) => void; label?: string }) {
  return (
    <Button size="compact" variant="secondary" trailingIcon="arrow-up-right" onClick={() => onOpen?.(story.id)}>
      {label}
      <span className="visually-hidden">: {story.title} / {story.name}</span>
    </Button>
  );
}

export function FindingEvidence({ finding, onOpenStory }: { finding: Finding; onOpenStory?: (id: string) => void }) {
  const e = finding.evidence;
  switch (e.kind) {
    case 'component':
      return (
        <div className="evidence evidence--component">
          <div className="evidence__pair">
            <div className="evidence__side">
              <span className="evidence__label">Agent wrote</span>
              {/* The excerpt scrolls sideways when a line is long, so it is
                  focusable and named (axe: scrollable-region-focusable). */}
              <pre className="evidence__code" tabIndex={0} role="region" aria-label="What the agent wrote">
                <code>{e.wrote.excerpt}</code>
              </pre>
              <span className="evidence__file">
                <code>{e.wrote.file}</code>
              </span>
            </div>
            <div className="evidence__side">
              <span className="evidence__label">System has</span>
              <p className="evidence__component">
                <strong>{e.existing.component}</strong>
                <span aria-hidden="true"> / </span>
                <span>{e.existing.variant}</span>
                <span aria-hidden="true"> / </span>
                <code>{e.existing.props}</code>
              </p>
              <p className="evidence__recommendation">{e.recommendation}</p>
              <StoryLink story={e.existing.story} onOpen={onOpenStory} label="Open the story" />
            </div>
          </div>
        </div>
      );
    case 'token':
      return (
        <div className="evidence evidence--token">
          <dl className="evidence__facts">
            <div>
              <dt>Agent implementation</dt>
              <dd>
                <code>
                  {e.property}: {e.literal}
                </code>
                <span className="evidence__file">
                  <code>
                    {e.file}:{e.line}
                  </code>
                </span>
              </dd>
            </div>
            <div>
              <dt>Design system</dt>
              <dd>
                {e.tokens.map((t) => (
                  <span key={t.name} className="evidence__token">
                    <code>{t.name}</code>
                    <span className="evidence__token-value">{t.value}</span>
                  </span>
                ))}
                {e.nearest ? (
                  <span className="evidence__note">
                    No token produces {e.literal}; the scale steps from {e.nearest.below && <code>{e.nearest.below}</code>} to {e.nearest.above && <code>{e.nearest.above}</code>}.
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
        </div>
      );
    case 'accessibility':
      return (
        <div className="evidence evidence--a11y">
          <dl className="evidence__facts">
            <div>
              <dt>Measured</dt>
              <dd>
                <strong className="evidence__fail">{e.measured}</strong> against a floor of {e.required}
              </dd>
            </div>
            <div>
              <dt>Rule</dt>
              <dd>
                <code>{e.rule}</code>
                <Badge tone={e.impact === 'critical' || e.impact === 'serious' ? 'danger' : 'warning'}>{e.impact}</Badge>
              </dd>
            </div>
            <div>
              <dt>Element</dt>
              <dd>
                <code>{e.element}</code>
              </dd>
            </div>
          </dl>
          <p className="evidence__message">
            <span className="evidence__label">axe said</span>
            {e.message}
          </p>
        </div>
      );
    case 'visual':
      return (
        <div className="evidence evidence--visual">
          <dl className="evidence__facts">
            <div>
              <dt>Story</dt>
              <dd>
                {e.story.title} / {e.story.name}
                {e.story.isNew ? <Badge tone="accent">New</Badge> : null}
              </dd>
            </div>
            <div>
              <dt>Difference</dt>
              <dd>
                {e.diffPixels.toLocaleString('en-US')} px, {e.diffPercent}% of the frame
                <Badge tone={e.expected ? 'success' : 'warning'}>{e.expected ? 'Expected' : 'Not asked for'}</Badge>
              </dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>{e.where}</dd>
            </div>
          </dl>
          {e.frames ? (
            <ul className="evidence__frames">
              {e.frames.map((f) => (
                <li key={f.name} className="evidence__test">
                  <TestStatus state="changed" iconOnly />
                  <span>{f.name}</span>
                  <span className="evidence__ms">
                    {f.diffPixels.toLocaleString('en-US')} px, {f.diffPercent}%{f.sizeChanged ? `, ${f.sizeChanged}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <StoryLink story={e.story} onOpen={onOpenStory} />
        </div>
      );
    case 'state':
      return (
        <div className="evidence evidence--state">
          <dl className="evidence__facts">
            <div>
              <dt>Component</dt>
              <dd>{e.component}</dd>
            </div>
            <div>
              <dt>New state</dt>
              <dd>{e.state}</dd>
            </div>
            <div>
              <dt>Reached by</dt>
              <dd>{e.reachedBy}</dd>
            </div>
            <div>
              <dt>Story</dt>
              <dd>
                <TestStatus state={e.hasStory ? 'passed' : 'failed'} label={e.hasStory ? 'Has a story' : 'No story'} />
              </dd>
            </div>
          </dl>
        </div>
      );
    case 'interaction':
      return (
        <ul className="evidence evidence--interaction">
          {e.tests.map((t) => (
            <li key={t.name} className="evidence__test">
              <TestStatus state={t.state} iconOnly />
              <span>{t.name}</span>
              {t.ms !== undefined ? <span className="evidence__ms">{t.ms} ms</span> : null}
            </li>
          ))}
        </ul>
      );
    case 'shared':
      return (
        <div className="evidence evidence--shared">
          <dl className="evidence__facts">
            <div>
              <dt>File</dt>
              <dd>
                <code>{e.file}</code>
                <Badge tone="warning">Shared</Badge>
                <span className="evidence__note">{e.lines} lines; every screen that renders the component sees it.</span>
              </dd>
            </div>
            <div>
              <dt>Measured</dt>
              <dd>{e.measured}</dd>
            </div>
            <div>
              <dt>Rendered by</dt>
              <dd>
                {e.consumers.map((c) => (
                  <Button key={c.id} size="compact" variant="ghost" trailingIcon="arrow-up-right" onClick={() => onOpenStory?.(c.id)}>
                    {c.title} / {c.name}
                  </Button>
                ))}
              </dd>
            </div>
          </dl>
          <p className="evidence__message">
            <span className="evidence__label">The agent’s reason</span>
            {e.reason}
          </p>
        </div>
      );
    case 'pattern':
      return (
        <div className="evidence evidence--pattern">
          <dl className="evidence__facts">
            <div>
              <dt>The pattern</dt>
              <dd>{e.description}</dd>
            </div>
            <div>
              <dt>Built from</dt>
              <dd>
                {e.builtFrom.map((b) => (
                  <Badge key={b}>{b}</Badge>
                ))}
              </dd>
            </div>
            <div>
              <dt>Alternative</dt>
              <dd>{e.alternative}</dd>
            </div>
          </dl>
          <StoryLink story={e.story} onOpen={onOpenStory} label="Open the story" />
        </div>
      );
  }
}
