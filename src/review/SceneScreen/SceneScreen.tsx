import type { ReactNode } from 'react';
import { Badge, Checkbox, Icon } from '../../components';
import { DIRECTIONS, directionOf, FINDING_SOURCE, FINDINGS, REQUIREMENT, STAGES, stageIndex, stageOf, type StageId } from '../../data/cycle';
import { Choice } from '../CycleScreen/stages';
import type { SceneId } from './scenes';
import '../Shell/Shell.css';
import '../CycleScreen/CycleScreen.css';
import './SceneScreen.css';

/* THE SCENES (2026-10-26). Each stage of the design cycle drawn as one
   picture, 16:9, for the case study and the homepage card to capture. They
   used to be drawn on the site in its own type and colors, so the prototype
   a reader met after the case study did not look like the one it described.
   A scene is this app, drawn by its own components and stylesheets: the
   bar, the stage rail, and the stage's one point, at a size that still
   reads when the picture is printed 700px wide.

   A scene is the stage after the story's call, not a live stage: nothing
   presses, and the words are the scenario's own (data/cycle.ts). It is
   captured at its own size, 800 by 450, which is below the first zoom
   step, so the root is never scaled. */

function Rail({ at }: { at: StageId }) {
  const i = stageIndex(at);
  return (
    <nav className="cycle__rail scene__rail" aria-label="Stages">
      <ol role="list">
        {STAGES.map((st, n) => {
          const inner = (
            <>
              <span className="cycle__rail-num" aria-hidden="true">
                {n < i ? <Icon name="check" size={12} /> : n + 1}
              </span>
              <span className="cycle__rail-name">{st.name}</span>
            </>
          );
          return (
            <li key={st.id}>
              {n > i ? (
                <span className="cycle__rail-locked">{inner}</span>
              ) : (
                <a aria-current={n === i ? 'step' : undefined} data-done={n < i || undefined}>
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Frame({ at, children }: { at: StageId; children: ReactNode }) {
  return (
    <div className="scene" data-surface="review">
      <header className="shell__bar scene__bar">
        <span className="shell__brand">
          <span className="shell__mark" aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
          <span>Agent Review</span>
        </span>
        <span className="scene__scenario">
          <Badge variant="quiet" icon="play">
            Simulated
          </Badge>
          Archiving customers without losing control
        </span>
      </header>
      <div className="scene__body">
        <Rail at={at} />
        <h1 className="visually-hidden">{stageOf(at).name}</h1>
        {children}
      </div>
    </div>
  );
}

/** The move, as the stage draws it, without the way on. */
function Move({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="cycle__move scene__move">
      <div className="cycle__move-head">
        <p className="cycle__move-kicker">
          <Icon name="user" size={14} />
          Your move
        </p>
        <h2 className="cycle__move-title">{title}</h2>
      </div>
      <div className="cycle__move-body">{children}</div>
    </aside>
  );
}

/* Evaluate: what came back on the left, the two sessions that decided it,
   and the call on the right, made against the agent's recommendation. What
   the call did sits under the findings, where the picture has room for it. */
function Evaluate() {
  const shown = FINDINGS.filter((f) => f.id === 'f-active' || f.id === 'f-bulk');
  const pick = ['undo', 'review'] as const;
  return (
    <div className="scene__work">
      <section className="scene__main">
        <h2 className="cycle__h2">What came back</h2>
        <ul className="cycle__findings" role="list">
          {shown.map((f) => (
            <li key={f.id} className="cycle__finding">
              <p className="cycle__finding-head">
                <Badge tone="warning" variant="outline">
                  {FINDING_SOURCE[f.source]}
                </Badge>
                {f.about ? <span className="cycle__finding-about">About {directionOf(f.about[0]).name.toLowerCase()}</span> : null}
              </p>
              <p className="cycle__finding-says">{f.says}</p>
              {f.becomes ? <Checkbox label={`Require: ${REQUIREMENT[f.becomes]}`} checked readOnly /> : null}
            </li>
          ))}
        </ul>
        <p className="cycle__consequence">
          <Icon name="arrow-right" size={14} />
          <span>
            You chose against the agent’s recommendation, and your reason says why.
          </span>
        </p>
      </section>
      <Move title="Which direction, and why?">
        <ul className="cycle__choices" role="list">
          {pick.map((id) => {
            const d = DIRECTIONS.find((x) => x.id === id)!;
            return <Choice key={id} name={d.name} says={id === 'undo' ? d.costs : null} chosen={id === 'undo'} recommended={id === 'review'} onChoose={() => {}} />;
          })}
        </ul>
      </Move>
    </div>
  );
}

const DRAWN: Partial<Record<SceneId, () => ReactNode>> = { evaluate: Evaluate };

export function SceneScreen({ id }: { id: SceneId }) {
  const Body = DRAWN[id]!;
  return (
    <Frame at={id}>
      <Body />
    </Frame>
  );
}
