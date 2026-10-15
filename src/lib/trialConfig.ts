/**
 * 実力の階段の段。
 *
 * 本番テスト（紙のテストと同じ大問順）の設問から組む（設問の順＝やさしい順、同じモジュールはまとめる）。
 * 紙のテストに出ない項目（EXTRA_SKILLS）は、無限でだけ出す。
 */
import { floorsFromTestSteps, withExtraSkills } from 'learning-app-kit/trial';
import { TEST_STEPS, type TestProblem } from './testConfig';

export const TRIAL = floorsFromTestSteps(TEST_STEPS);
export const FLOOR_COUNT = TRIAL.floors.length;

/** その項目の本番テストの設問を1つ選んで作る（同じ項目の設問が複数あれば、ばらばらに出す） */
export function trialProblem(skillId: string): TestProblem {
  const pool = TEST_STEPS.filter((s) => s.skillId === skillId);
  const step = pool[Math.floor(Math.random() * pool.length)] ?? TEST_STEPS[0]!;
  return step.gen();
}

/**
 * 本番テストに出ない項目。極限には出さず（テスト予想を正直に保つ）、無限でだけ出す。
 * 頂点に届いた子は、無限で単元のすべての項目に挑める。
 */
export const EXTRA_SKILLS: readonly string[] = [
  'grid-compare',
  'grid-make',
  'formula-rect',
  'formula-unit',
  'unit-convert',
  'unit-relation',
  'side-square',
  'comp-split',
  'comp-sub',
  'comp-cshape',
  'comp-road',
  'change-max',
  'eh-perim',
  'eh-unit',
  'eh-conv',
  'eh-half',
  'eh-comp',
  'eh-aha',
];

/** 無限で出す段（テスト外の項目を、同じモジュールの段に混ぜたもの） */
export const ENDLESS_FLOORS = withExtraSkills(TRIAL.floors, EXTRA_SKILLS);
