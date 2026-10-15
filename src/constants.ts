import type { ModuleId } from './store/progressStore';

/**
 * 「めんせきランド」のモジュール一覧。
 * 単元「面積のくらべ方と表し方」（小4）で身につける知識・技能・考え方を段階的に網羅する。
 *
 * レベルID ＝ 学習の記録の名前（skillId）。学級ポータルのカタログの skill_id と同じ文字列にする。
 * 前にモジュール名を足したり、名前を変えたりしない（変えたらカタログを作り直す）。
 */
export interface LevelMeta {
  id: string;
  label: string;
  desc: string;
}

export interface ModuleMeta {
  id: ModuleId;
  title: string;
  description: string;
  /** lucide-react のアイコン名 */
  icon: string;
  /** Tailwind の色トークン（カードのアクセント） */
  accent: string;
  accentBorder: string;
  status: 'ready' | 'soon';
  levels: LevelMeta[];
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'grid',
    title: '方眼で 面積',
    description: '1cm²の いくつ分？ マスを 数えて 面積を あらわそう',
    icon: 'Grid3x3',
    accent: 'cyan',
    accentBorder: 'hover:border-cyan-400',
    status: 'ready',
    levels: [
      { id: 'grid-count', label: '① マスを 数えよう', desc: '1cm²の 正方形が いくつ分？' },
      { id: 'grid-half', label: '② ななめ半分の マス', desc: '半分の 三角 2つで 1cm²' },
      { id: 'grid-compare', label: '③ どちらが 広い？', desc: '1cm²の いくつ分で くらべよう' },
      { id: 'grid-make', label: '④ 形を つくろう', desc: 'マスを タップして 面積□cm²の 形を かこう' },
    ],
  },
  {
    id: 'formula',
    title: '面積の 公式',
    description: '長方形は たて×横、正方形は 1辺×1辺',
    icon: 'Square',
    accent: 'blue',
    accentBorder: 'hover:border-blue-400',
    status: 'ready',
    levels: [
      { id: 'formula-word', label: '① 公式を おぼえよう', desc: '長方形・正方形の 面積の 公式' },
      { id: 'formula-rect', label: '② 長方形の 面積', desc: '式を 書いて 求めよう' },
      { id: 'formula-square', label: '③ 正方形の 面積', desc: '1辺×1辺' },
      { id: 'formula-unit', label: '④ 面積と まわりの 長さ', desc: 'cm と cm² の ちがい' },
    ],
  },
  {
    id: 'unit',
    title: '大きな 面積の 単位',
    description: 'm²・km²・a・ha。単位の かんけいを つかもう',
    icon: 'Map',
    accent: 'amber',
    accentBorder: 'hover:border-amber-400',
    status: 'ready',
    levels: [
      { id: 'unit-m2', label: '① m²と cm²、km²と m²', desc: '1m²＝10000cm²、1km²＝1000000m²' },
      { id: 'unit-aha', label: '② a（アール）と ha（ヘクタール）', desc: '1辺10mで 1a、1辺100mで 1ha' },
      { id: 'unit-choose', label: '③ 単位を えらぼう', desc: '教室は 60□？ 色紙は 144□？' },
      { id: 'unit-convert', label: '④ 単位を なおそう', desc: '600m²は 何a？' },
      { id: 'unit-relation', label: '⑤ 1辺が 10倍だと？', desc: '面積は 100倍に なる' },
    ],
  },
  {
    id: 'calc',
    title: '面積を 求めよう',
    description: 'km²・a・ha の 単位で、単位を そろえて',
    icon: 'Calculator',
    accent: 'emerald',
    accentBorder: 'hover:border-emerald-400',
    status: 'ready',
    levels: [
      { id: 'calc-km', label: '① km²で 求める', desc: 'たて4km、横10km の 長方形' },
      { id: 'calc-mixunit', label: '② 単位を そろえて', desc: '400cm と 2m … 先に そろえる' },
      { id: 'calc-a', label: '③ aで 求める', desc: 'm²を 出してから a に' },
      { id: 'calc-ha', label: '④ haで 求める', desc: 'm²を 出してから ha に' },
    ],
  },
  {
    id: 'side',
    title: '辺の 長さを 求めよう',
    description: '面積と 横から たてを 求める',
    icon: 'Ruler',
    accent: 'teal',
    accentBorder: 'hover:border-teal-400',
    status: 'ready',
    levels: [
      { id: 'side-find', label: '① たての 長さは？', desc: '□×横＝面積 の □を 求めよう' },
      { id: 'side-square', label: '② 正方形の 1辺は？', desc: '□×□＝面積' },
    ],
  },
  {
    id: 'comp',
    title: 'いろいろな 形の 面積',
    description: '分ける・ひく・うつす。くふうして 求めよう',
    icon: 'Shapes',
    accent: 'violet',
    accentBorder: 'hover:border-violet-400',
    status: 'ready',
    levels: [
      { id: 'comp-split', label: '① 2つに 分けて', desc: '長方形 2つの 面積を たす' },
      { id: 'comp-sub', label: '② 大きい 長方形から ひく', desc: 'ない ところを ひく' },
      { id: 'comp-which', label: '③ 考え方と 式', desc: 'ともだちの 考えを 表す 式は？' },
      { id: 'comp-cshape', label: '④ へこんだ 形', desc: 'コの字の 形の 面積' },
      { id: 'comp-road', label: '⑤ 道を はしに よせて', desc: '花を うえる 広さを くらべよう' },
    ],
  },
  {
    id: 'change',
    title: '面積の 変わり方',
    description: 'まわりの 長さが 同じ 長方形。面積は どう変わる？',
    icon: 'LineChart',
    accent: 'orange',
    accentBorder: 'hover:border-orange-400',
    status: 'ready',
    levels: [
      { id: 'change-table', label: '① 表に まとめよう', desc: '横が 1cm ずつ ふえると たて と 面積は？' },
      { id: 'change-graph', label: '② 折れ線グラフに', desc: '点を うって 変わり方を 見よう' },
      { id: 'change-max', label: '③ いちばん 広いのは？', desc: 'まわりが 同じでも 面積は ちがう' },
    ],
  },
  {
    id: 'error',
    title: 'エラーハンター',
    description: 'Aさんの まちがいを 見つけて なおそう',
    icon: 'Search',
    accent: 'rose',
    accentBorder: 'hover:border-rose-400',
    status: 'ready',
    levels: [
      { id: 'eh-perim', label: '① まわりの 長さを 求めた', desc: '面積は たて×横' },
      { id: 'eh-unit', label: '② 単位を そろえなかった', desc: 'cm と m の まま かけた' },
      { id: 'eh-conv', label: '③ 1m²＝100cm² と 思った', desc: '100cm×100cm を 思い出そう' },
      { id: 'eh-half', label: '④ ななめの 三角を 1と 数えた', desc: '半分 2つで 1cm²' },
      { id: 'eh-comp', label: '⑤ 分けた 長さを 読みまちがえた', desc: '分けた 長方形の たて・横は？' },
      { id: 'eh-aha', label: '⑥ a・ha の かんけいの まちがい', desc: '1a＝100m²、1ha＝10000m²' },
    ],
  },
];

export const ALL_LEVEL_IDS: string[] = MODULES.flatMap((m) => m.levels.map((l) => l.id));

export function levelMeta(id: string): LevelMeta | undefined {
  for (const m of MODULES) {
    const l = m.levels.find((x) => x.id === id);
    if (l) return l;
  }
  return undefined;
}
