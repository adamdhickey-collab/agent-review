import { STAGES, type StageId } from '../../data/cycle';

/* The scenes are the stages, one picture each, so a scene's id is a
   stage's. Only the ones drawn so far are addresses. */
export type SceneId = StageId;

export const SCENES: readonly SceneId[] = ['evaluate'];

export function isScene(id: string): id is SceneId {
  return (SCENES as readonly string[]).includes(id) && STAGES.some((s) => s.id === id);
}
