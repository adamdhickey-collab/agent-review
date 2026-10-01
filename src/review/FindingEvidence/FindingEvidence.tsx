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
              <pre className="evidence__code">
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
              <span className="evidence__ms">{t.ms} ms</span>
            </li>
          ))}
        </ul>
      );
  }
}
