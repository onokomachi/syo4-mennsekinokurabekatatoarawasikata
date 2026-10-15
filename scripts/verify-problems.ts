/**
 * 問題ジェネレーターの機械検査（npm run verify）。型チェックやブラウザ確認では見つからない
 * 「まれな乱数で壊れる」「正答を入れても誤答診断が反応する」「図と答えが食いちがう」を止める。
 *
 *  1. 全項目 × 3000回（本番テストの設問も 1000回ずつ）作って、1回も例外にならない
 *  2. 全ステップ: 正答で誤答診断が null / 数の答えが有限 / 7文字以内 / ヒント3段 / 1段めが答えを言わない
 *  3. 選択式: 正解の位置が範囲内 / 選択肢に重複なし / wrong の並びが選択肢と同じ / 正解の位置だけ null
 *  4. □に入れる欄: □の数と正解の組の長さが同じ / 正解の組で diagnose が null
 *  5. 作図: 正しい形の例が check を通る（マスが方眼の中）/ グラフの点が目もりの中
 *  6. 図: 図（方眼のマス・多角形）から面積を計算し直して、figArea と一致する。
 *     「答え」の段が figArea と同じ単位なら、答えとも一致する
 *  7. 長さの文字（寸法）が、辺の長さと一致する（数字と単位から読む）
 *  7b. カードで組み立てる欄: 正解の書き方（同じ意味の別の書き方もすべて）が通る / カードで作れる全部の置き方のうち、
 *      正解でないものは通らず、ひとことの声かけが返る / 当てずっぽうの当たる率が 1/8 以下 / ダミーが2まい以上 /
 *      足場（選ぶ形）がある
 *  8. 出題のバリエーションが 20通り以上 / 選択式の正解の位置が 1か所に半分以上かたよらない
 */
import { GENERATORS, generate } from '../src/lib/problems';
import { same, fmt, figureArea, buildOk, type Question, type Step, type FillToken, type BuildStep } from '../src/lib/question';
import { MODULES } from '../src/constants';
import { TEST_STEPS, OMOTE_MAX, URA_MAX } from '../src/lib/testConfig';
import { EXTRA_SKILLS } from '../src/lib/trialConfig';

let failures = 0;
const fail = (id: string, msg: string) => {
  failures++;
  if (failures <= 400) console.error(`✗ ${id}: ${msg}`);
};

const TRIALS = 3000;
const MIN_VARIETY = 20;
const MAX_CHARS = 7;

function signature(q: Question): string {
  const f = q.figure ? JSON.stringify(q.figure) : '';
  const st = q.steps.map((s) => (s.kind === 'num' ? `N${s.answer}` : s.kind === 'choice' ? `C${s.choices.join('|')}` : s.kind === 'fill' ? `F${s.accept[0]!.join(',')}` : s.kind === 'plot' ? `P${JSON.stringify(s.points)}` : s.kind === 'build' ? `B${s.accept[0]!.join(',')}${s.cards.join('')}` : `S${s.prompt}`)).join(';');
  return `${q.text}#${f}#${st}`;
}

function slotCount(tokens: FillToken[]): number {
  return tokens.filter((t) => typeof t === 'object').length;
}

/** カードで作れる全部の置き方（同じカードは1まいずつ。文字が同じ置き方は1つに数える） */
function allPlacements(s: BuildStep): string[][] {
  const slots = s.accept[0]!.length;
  const out = new Map<string, string[]>();
  const rec = (used: number[], cur: string[]) => {
    if (cur.length === slots) { out.set(cur.join('\u0001'), cur); return; }
    s.cards.forEach((c, i) => { if (!used.includes(i)) rec([...used, i], [...cur, c]); });
  };
  rec([], []);
  return [...out.values()];
}

function checkBuild(id: string, tag: string, s: BuildStep) {
  const slots = s.layout.filter((t) => typeof t === 'object').length;
  const place = allPlacements(s);
  let rightN = 0;
  for (const acc of s.accept) {
    if (acc.length !== slots) fail(id, `${tag}: 置き場所 ${slots}こ なのに 正解の組が ${acc.length}こ`);
    if (!place.some((p) => p.join('\u0001') === acc.join('\u0001'))) fail(id, `${tag}: 正解 ${acc.join('・')} が カードで作れない`);
    if (!buildOk(s, acc)) fail(id, `${tag}: 正解 ${acc.join('・')} が 通らない`);
    if (s.diagnose && s.diagnose(acc) !== null) fail(id, `${tag}: 正解 ${acc.join('・')} で 声かけが 出る`);
  }
  for (const p of place) {
    if (buildOk(s, p)) { rightN++; continue; }
    const note = s.diagnose?.(p) ?? null;
    if (note === null) fail(id, `${tag}: まちがいの置き方 ${p.join('・')} に 声かけが ない`);
    // 長さの単位（cm・m・km）を面積のところに置いたら、「長さの 単位」と教える声かけが返る
    else if (p.some((c) => ['cm', 'm', 'km'].includes(c)) && s.cards.includes('km²') && !note.includes('長さ')) fail(id, `${tag}: 長さの単位を置いた ${p.join('・')} の声かけに「長さ」が ない`);
  }
  if (rightN !== new Set(s.accept.map((a) => a.join('\u0001'))).size) fail(id, `${tag}: 通る置き方が ${rightN}通り（accept は ${s.accept.length}通り）`);
  if (rightN / place.length > 1 / 8) fail(id, `${tag}: 当てずっぽうが 当たりやすい（${rightN}/${place.length}）`);
  const needed = Math.max(...s.accept.map((a) => a.length));
  if (s.cards.length - needed < 2) fail(id, `${tag}: ダミーのカードが ${s.cards.length - needed}まい（2まい以上）`);
  if (!s.scaffold) fail(id, `${tag}: 足場（選ぶ形）が ない`);
}

function checkStep(id: string, s: Step, stepNo: number) {
  const tag = `step${stepNo + 1}(${s.label})`;
  if (s.hints.length !== 3) fail(id, `${tag}: ヒントが3段ではない (${s.hints.length})`);
  if (s.kind === 'num') {
    if (!Number.isFinite(s.answer)) fail(id, `${tag}: 答えが数ではない`);
    if (fmt(s.answer).length > MAX_CHARS) fail(id, `${tag}: 答え ${fmt(s.answer)} が入力欄(${MAX_CHARS}文字)に入らない`);
    if (!s.decimal && !Number.isInteger(s.answer)) fail(id, `${tag}: 整数入力なのに答えが小数 ${s.answer}`);
    if (s.diagnose && s.diagnose(s.answer) !== null) fail(id, `${tag}: 正答 ${s.answer} で誤答診断が反応する`);
    const a = fmt(s.answer);
    if (a.length >= 3 && s.hints[0]?.includes(a)) fail(id, `${tag}: 1段めのヒントが答え ${a} を言っている`);
    if (s.scaffold) checkStep(id, s.scaffold, stepNo);
  } else if (s.kind === 'choice') {
    if (s.correct < 0 || s.correct >= s.choices.length) fail(id, `${tag}: 正解の位置が範囲外`);
    if (new Set(s.choices).size !== s.choices.length) fail(id, `${tag}: 選択肢に重複 ${s.choices.join(' / ')}`);
    if (s.choices.length < 2) fail(id, `${tag}: 選択肢が ${s.choices.length}こ`);
    if (s.wrong) {
      if (s.wrong.length !== s.choices.length) fail(id, `${tag}: wrong と choices の並びがちがう`);
      s.wrong.forEach((w, i) => {
        if (i === s.correct && w !== null) fail(id, `${tag}: 正解の位置に助言がある`);
        if (i !== s.correct && w === null) fail(id, `${tag}: まちがいの選択肢 ${i} に助言がない`);
      });
    }
  } else if (s.kind === 'build') {
    checkBuild(id, tag, s);
    if (s.scaffold) checkStep(id, s.scaffold, stepNo);
  } else if (s.kind === 'fill') {
    const n = s.layout.type === 'expr' ? slotCount(s.layout.parts) : s.layout.rows.reduce((a, r) => a + slotCount(r), 0);
    if (s.accept.length === 0) fail(id, `${tag}: 正解の組が無い`);
    for (const acc of s.accept) {
      if (acc.length !== n) fail(id, `${tag}: □が ${n}こ なのに 正解の組が ${acc.length}こ`);
      if (acc.some((v) => !Number.isInteger(v) || fmt(v).length > MAX_CHARS)) fail(id, `${tag}: □の答え ${acc.join(',')} が入らない`);
      if (s.diagnose && s.diagnose(acc) !== null) fail(id, `${tag}: 正解の組 ${acc.join(',')} で diagnose が反応する`);
    }
  } else if (s.kind === 'cells') {
    if (s.example.some((c) => c.x < 0 || c.y < 0 || c.x >= s.cols || c.y >= s.rows)) fail(id, `${tag}: 正しい形の例が方眼の外`);
    if (s.check(s.example) !== null) fail(id, `${tag}: 正しい形の例が check を通らない（${s.check(s.example)}）`);
    if (s.check([]) === null) fail(id, `${tag}: 何もぬらないで 正解になる`);
  } else if (s.kind === 'plot') {
    for (const p of s.points) if (p.x < 1 || p.x > s.xMax || p.y < 0 || p.y > s.yMax || !Number.isInteger(p.y)) fail(id, `${tag}: 点 (${p.x},${p.y}) が目もりの外か整数でない`);
    if (s.yMax % s.yStep !== 0) fail(id, `${tag}: 目もりの最大 ${s.yMax} が ${s.yStep} きざみに ならない`);
    if (new Set(s.points.map((p) => p.x)).size !== s.points.length) fail(id, `${tag}: 同じ横の位置に点が2つ`);
  }
}

/** 寸法の文字が辺の長さと合うか（「12cm」「4m」の数を読む。□や「たて」だけの寸法は見ない） */
function checkDims(id: string, q: Question) {
  const f = q.figure;
  if (!f || f.type !== 'shape' || f.notToScale) return;
  const toCm: Record<string, number> = { cm: 1, m: 100, km: 100000 };
  let ratio: number | null = null;
  for (const d of f.dims) {
    const m = d.text.match(/^(\d+)(cm|m|km)$/);
    if (!m) continue;
    const len = Math.abs(d.b[0] - d.a[0]) + Math.abs(d.b[1] - d.a[1]);
    const r = (Number(m[1]) * toCm[m[2]!]!) / len;
    if (ratio === null) ratio = r;
    else if (!same(r, ratio)) fail(id, `寸法「${d.text}」が 図の 辺の 長さと 合わない`);
  }
}

const levelIds = MODULES.flatMap((m) => m.levels.map((l) => l.id));
for (const id of levelIds) if (!GENERATORS[id]) fail(id, 'constants のレベルに ジェネレーターがない');
for (const id of Object.keys(GENERATORS)) if (!levelIds.includes(id)) fail(id, 'ジェネレーターに constants のレベルがない');

const inTest = new Set(TEST_STEPS.filter((t) => t.points > 0).map((t) => t.skillId));
for (const id of levelIds) {
  const t = inTest.has(id), e = EXTRA_SKILLS.includes(id);
  if (!t && !e) fail(id, '本番テストにも EXTRA_SKILLS にも無い（実力の階段に出ない）');
  if (t && e) fail(id, '本番テストと EXTRA_SKILLS の両方にある');
}
for (const id of EXTRA_SKILLS) if (!levelIds.includes(id)) fail(id, 'EXTRA_SKILLS にあるがレベルに無い');
if (OMOTE_MAX !== 100 || URA_MAX !== 50) fail('test', `配点が 表${OMOTE_MAX}/裏${URA_MAX}（100/50のはず）`);
for (const t of TEST_STEPS) if (!GENERATORS[t.skillId]) fail(t.skillId, '本番テストの設問にジェネレーターが無い');

/** 1問の検査（共通） */
function checkQuestion(id: string, q: Question) {
  if (q.skillId !== id) fail(id, `skillId が ${q.skillId}`);
  if (!q.text || !q.summary || !q.q || !q.a || !q.title) fail(id, '文字が空');
  if (q.steps.length < 1) fail(id, 'ステップが無い');
  q.steps.forEach((s, k) => checkStep(id, s, k));
  checkDims(id, q);
  if (q.figArea !== undefined) {
    if (!q.figure) fail(id, 'figArea があるのに 図が無い');
    else {
      const fa = figureArea(q.figure);
      if (fa === null || !same(fa, q.figArea)) fail(id, `図から出し直した面積 ${fa} が figArea ${q.figArea} と合わない`);
    }
    // 最後の数の段（答え）が m²/cm²/km² で figArea と同じ単位なら、答えとも合うはず
    const last = [...q.steps].reverse().find((s) => s.kind === 'num');
    const lastIsArea = last && last.kind === 'num' && /²$/.test(last.unit ?? '');
    const unitOfFig = q.figure?.type === 'grid' ? 'cm²' : null;
    if (last && last.kind === 'num' && lastIsArea && (unitOfFig === null || last.unit === unitOfFig) && !/[a]$|ha$/.test(last.unit ?? '')) {
      // a・ha で答える問題は、ひとつ前の m² の段が図と合う
      if (!same(last.answer, q.figArea)) fail(id, `答え ${last.answer}${last.unit} が 図の面積 ${q.figArea} と合わない`);
    }
  }
}

const table: string[] = [];
for (const id of Object.keys(GENERATORS)) {
  const seen = new Set<string>();
  const pos = new Map<number, number>();
  let choiceN = 0;
  for (let i = 0; i < TRIALS; i++) {
    let q: Question;
    try { q = generate(id); } catch (e) { fail(id, `例外: ${(e as Error).message}`); break; }
    checkQuestion(id, q);
    seen.add(signature(q));
    const first = q.steps.find((s) => s.kind === 'choice');
    if (first && first.kind === 'choice') { choiceN++; pos.set(first.correct, (pos.get(first.correct) ?? 0) + 1); }
  }
  if (seen.size < MIN_VARIETY) fail(id, `バリエーションが ${seen.size} 通り（${MIN_VARIETY}通り未満）`);
  if (choiceN > 300) {
    const worst = Math.max(...pos.values());
    if (worst / choiceN > 0.5) fail(id, `正解の位置が かたよっている (${Math.round((100 * worst) / choiceN)}%)`);
  }
  table.push(`${id.padEnd(15)} ${String(seen.size).padStart(5)} 通り`);
}

// 本番テストの設問（専用の作り方で作るものも ふくめて）
TEST_STEPS.forEach((t, i) => {
  for (let k = 0; k < 1000; k++) {
    let q: Question;
    try { q = t.gen(); } catch (e) { fail(`test${i + 1}`, `例外: ${(e as Error).message}`); break; }
    checkQuestion(t.skillId, q);
  }
});

console.log(table.join('\n'));
if (failures > 0) {
  console.error(`\n${failures} 件の問題があります`);
  process.exit(1);
}
console.log(`\n✓ ${Object.keys(GENERATORS).length} 項目 × ${TRIALS} 回 ＋ 本番テスト ${TEST_STEPS.length} 問 × 1000 回: 問題なし`);
