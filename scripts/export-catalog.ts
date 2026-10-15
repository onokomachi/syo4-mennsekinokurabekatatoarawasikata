/**
 * 学級ポータル用のカタログを書き出す（npm run catalog）。
 * 出力を learning-app-kit の src/catalog/menseki4.ts に置く（kit の CATALOGS への登録も要る）。
 * answer_kind は段の答え方から決める（1種類だけ＝その種類、まざる＝steps）。
 * 誤概念は docs/DESIGN.md の「3. 誤概念」の表と同じもの。
 */
import { buildCatalog, renderCatalogModule } from './gen-catalog.lib';
import { MODULES, ALL_LEVEL_IDS } from '../src/constants';
import { generate } from '../src/lib/problems';

function kindOf(id: string): string {
  const kinds = new Set(generate(id).steps.map((s) => s.kind));
  return kinds.size > 1 ? 'steps' : [...kinds][0]!;
}

const catalog = buildCatalog({
  appId: 'menseki4',
  title: '面積のくらべ方と表し方',
  subject: '算数',
  grade: 4,
  url: 'https://syo4-mennsekinokurabekatatoarawasik.vercel.app',
  moduleLevels: Object.fromEntries(MODULES.map((m) => [m.id, m.levels])),
  moduleTitles: Object.fromEntries(MODULES.map((m) => [m.id, m.title])),
  allSkillIds: ALL_LEVEL_IDS,
  generate: (id) => ({ answer: { kind: kindOf(id) } }),
});

catalog.misconceptions = [
  { code: '誤概念①', label: '面積を求めるのに まわりの長さ（たて＋横）×2 を計算する／cm と cm² を区別しない', skills: ['formula-rect', 'formula-unit', 'grid-count', 'change-max', 'eh-perim'] },
  { code: '誤概念②', label: 'ななめ半分の三角を 1cm² と数える', skills: ['grid-half', 'eh-half'] },
  { code: '誤概念③', label: '1m²＝100cm²、1km²＝1000m² と思う（1辺が10倍なら面積は100倍を使えない）', skills: ['unit-m2', 'unit-relation', 'eh-conv'] },
  { code: '誤概念④', label: 'a・ha と m² の関係をまちがえる（1a＝10m²、1ha＝100m² など）', skills: ['unit-aha', 'unit-convert', 'calc-a', 'calc-ha', 'eh-aha'] },
  { code: '誤概念⑤', label: '長さの単位をそろえずにかける（400cm×2m＝800m²）', skills: ['calc-mixunit', 'eh-unit'] },
  { code: '誤概念⑥', label: '複合図形を分けたとき、書いていない辺の長さを読みまちがえる', skills: ['comp-split', 'comp-which', 'comp-cshape', 'eh-comp'] },
  { code: '誤概念⑦', label: '面積から辺を求めるのに かけ算・ひき算をする（□×横＝面積 が立てられない）', skills: ['side-find', 'side-square'] },
  { code: '誤概念⑧', label: 'まわりの長さが同じなら面積も同じと思う', skills: ['change-table', 'change-graph', 'change-max'] },
];

process.stdout.write(renderCatalogModule(catalog));
