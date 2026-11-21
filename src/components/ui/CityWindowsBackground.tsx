/**
 * 「まどあかりの街」テーマ専用の背景（プログラムで描く。動画なし）。
 * 面積の単元にあわせた世界：夕やみの大都会。ビルのまどが、1つ1つ「1めもりの四角（面積の単位）」のように
 * ならんで、やさしく あかりを ともしている。
 *   - 空：紺 → すみれ → ももいろ → 夕やけの 4段のグラデーション、またたく星、ゆっくり流れる雲
 *   - ビル：奥・中・手前の3そうの街並み（奥ほどうすく・ゆっくり）。下絵は大きさが変わったときだけ別 canvas に描き、ずらして貼る
 *   - まど：手前の2そうのまどが、ゆっくり明るく／暗くなる（点滅でなく、ふわっと）。大きな看板のネオンも ゆっくり色が変わる
 *   - サーチライト：地上から空へのびる、ゆっくり ふれる 光の筋
 *   - ヒーロー：十数秒に1回、赤と青の光の尾を引いて空を かけぬける流れ星（超翔神にちなむ）
 * theme === 'sakura'（内部ID。バッジ50%で解放。表示名は「まどあかりの街」）のときだけ描画する。
 * 軽さ：約30fps。まどは手前2そうだけ動かす（約420こ）。「視差効果を減らす」設定では止めた1枚だけ。
 * 光過敏への配慮（WCAG 2.3.1）：点滅させない。まど・ネオン・流れ星とも、明るさの変化はゆっくりで小さい。
 */
import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { BgMode, detectBgMode } from './ThemeVideo';
import { CanvasEnv, CanvasScene, makeCanvas, makeGlow, useCanvasLayer } from './canvasLoop';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

const WINDOW_COLORS = ['255,226,150', '255,240,200', '170,225,255', '255,190,140'] as const;
const NEON = ['255,90,140', '90,200,255', '255,215,80', '150,255,190', '190,140,255'] as const;

interface Win { x: number; y: number; w: number; h: number; ph: number; speed: number; c: string; base: number }
interface Layer {
  img: HTMLCanvasElement;      // 街並みの下絵（まど以外）
  width: number;               // 下絵の幅（これで つなぐ）
  speed: number;               // px/秒
  windows: Win[];              // 動かすまど（手前2そうだけ）
  billboards: Array<{ x: number; y: number; w: number; h: number; ph: number }>;
  baseY: number;
}

/** ビルの並び（下絵）と、動かすまどの一覧をつくる。右はしが左はしに つながる（つなぎ目なし） */
function makeLayer(env: CanvasEnv, opt: { width: number; minH: number; maxH: number; color: string; edge: string; winProb: number; animateWindows: boolean; winSize: number; billboardCount: number }): Layer {
  const { W, H } = env;
  const width = Math.ceil(opt.width);
  const [img, x] = makeCanvas(width, H);
  const windows: Win[] = [];
  const billboards: Layer['billboards'] = [];
  if (!x) return { img, width, speed: 0, windows, billboards, baseY: H };
  let bx = 0;
  const ws = opt.winSize;
  while (bx < width) {
    // いちばん右のビルは、ちょうど下絵のはしで終える（右はしと左はしがつながって、つなぎ目が見えない）
    let bw = Math.round(rand(46, 120));
    if (width - bx - bw < 46) bw = width - bx;
    const bh = Math.round(rand(opt.minH, opt.maxH) * H);
    const top = H - bh;
    // ビルの本体（上が少しあかるい）
    const g = x.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, opt.edge);
    g.addColorStop(0.18, opt.color);
    g.addColorStop(1, opt.color);
    x.fillStyle = g;
    x.fillRect(bx, top, bw, bh);
    // 屋上のアンテナ・水タンク
    if (Math.random() < 0.4) { x.fillRect(bx + bw * 0.45, top - rand(10, 26), 3, rand(10, 26)); }
    if (Math.random() < 0.25) { x.fillRect(bx + 6, top - 12, rand(14, 24), 12); }
    // まど（1めもりの四角がならぶ）
    const gap = ws * 0.9;
    const cols = Math.max(1, Math.floor((bw - 10) / (ws + gap)));
    const rows = Math.max(1, Math.floor((bh - 16) / (ws + gap)));
    const ox = bx + (bw - (cols * (ws + gap) - gap)) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = ox + c * (ws + gap), wy = top + 10 + r * (ws + gap);
        if (Math.random() > opt.winProb) continue;
        if (opt.animateWindows) {
          windows.push({ x: wx, y: wy, w: ws, h: ws * 1.25, ph: rand(0, 6.28), speed: rand(0.0003, 0.0009), c: pick(WINDOW_COLORS), base: rand(0.45, 0.95) });
        } else {
          x.fillStyle = `rgba(${pick(WINDOW_COLORS)},${rand(0.25, 0.55)})`;
          x.fillRect(wx, wy, ws, ws * 1.25);
        }
      }
    }
    // 大きな看板（手前のそうだけ）
    if (opt.billboardCount > 0 && billboards.length < opt.billboardCount && bw > 70 && bh > H * 0.3 && Math.random() < 0.5) {
      billboards.push({ x: bx + 8, y: top + bh * 0.12, w: bw - 16, h: Math.min(60, bh * 0.14), ph: rand(0, 6.28) });
    }
    bx += bw;
  }
  return { img, width, speed: 0, windows, billboards, baseY: H };
}

function drawStar4(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
}

function createScene(): CanvasScene {
  let layers: Layer[] = [];
  let stars: Array<{ x: number; y: number; r: number; ph: number }> = [];
  let clouds: Array<{ x: number; y: number; w: number; h: number; v: number; a: number }> = [];
  let beams: Array<{ x: number; ph: number; sp: number; len: number }> = [];
  const glow = makeGlow(64, '255,230,170');
  const glowRed = makeGlow(64, '255,90,90');
  const glowBlue = makeGlow(64, '90,160,255');
  // ヒーローの流れ星
  const hero = { t0: -1, nextAt: 6000, x0: 0, y0: 0, x1: 0, y1: 0, dur: 2200 };

  return {
    setup(env) {
      const { W, H } = env;
      const far = makeLayer(env, { width: W * 1.4, minH: 0.22, maxH: 0.42, color: 'rgba(40,40,100,0.92)', edge: 'rgba(110,100,170,0.95)', winProb: 0.35, animateWindows: false, winSize: 3, billboardCount: 0 });
      const mid = makeLayer(env, { width: W * 1.6, minH: 0.28, maxH: 0.56, color: 'rgba(20,22,66,0.96)', edge: 'rgba(70,70,140,0.98)', winProb: 0.45, animateWindows: true, winSize: 5, billboardCount: 0 });
      const near = makeLayer(env, { width: W * 1.9, minH: 0.34, maxH: 0.7, color: 'rgba(8,10,34,0.98)', edge: 'rgba(40,40,90,1)', winProb: 0.5, animateWindows: true, winSize: 7, billboardCount: 4 });
      far.speed = 4; mid.speed = 9; near.speed = 18;
      layers = [far, mid, near];
      stars = Array.from({ length: Math.min(100, Math.floor((W * H) / 12000)) }, () => ({ x: rand(0, W), y: rand(0, H * 0.5), r: rand(0.6, 1.7), ph: rand(0, 6.28) }));
      clouds = Array.from({ length: 6 }, () => ({ x: rand(0, W), y: rand(H * 0.12, H * 0.5), w: rand(W * 0.25, W * 0.5), h: rand(30, 70), v: rand(3, 9), a: rand(0.1, 0.22) }));
      beams = Array.from({ length: 2 }, (_, i) => ({ x: W * (0.28 + i * 0.44), ph: rand(0, 6.28), sp: rand(0.00018, 0.0003), len: H * 0.8 }));
      hero.nextAt = 5000; hero.t0 = -1;
    },
    draw(ctx, env, t, dt) {
      const { W, H } = env;
      const s = dt / 1000;
      // 空（夕やみ）
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#080c2a');
      sky.addColorStop(0.35, '#1d2468');
      sky.addColorStop(0.62, '#6a3f8c');
      sky.addColorStop(0.82, '#d9807a');
      sky.addColorStop(1, '#f2a36e');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'lighter';
      // 星
      for (const st of stars) {
        const tw = 0.55 + 0.45 * Math.sin(t * 0.0009 + st.ph);
        ctx.globalAlpha = 0.65 * tw;
        const sz = st.r * 5;
        ctx.drawImage(glow, st.x - sz / 2, st.y - sz / 2, sz, sz);
      }
      // サーチライト（地上から空へ。ゆっくり ふれる）
      for (const b of beams) {
        const ang = -Math.PI / 2 + Math.sin(t * b.sp + b.ph) * 0.5;
        const bx = b.x, by = H * 0.92;
        const ex = bx + Math.cos(ang) * b.len, ey = by + Math.sin(ang) * b.len;
        const nx = -Math.sin(ang), ny = Math.cos(ang);
        const g = ctx.createLinearGradient(bx, by, ex, ey);
        g.addColorStop(0, 'rgba(255,240,200,0.20)');
        g.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(bx - nx * 6, by - ny * 6);
        ctx.lineTo(ex - nx * 70, ey - ny * 70);
        ctx.lineTo(ex + nx * 70, ey + ny * 70);
        ctx.lineTo(bx + nx * 6, by + ny * 6);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // 雲（ゆっくり流れる、うすい帯）
      for (const c of clouds) {
        c.x += c.v * s;
        if (c.x - c.w > W) c.x = -c.w;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.w * 0.5);
        g.addColorStop(0, `rgba(255,200,200,${c.a})`);
        g.addColorStop(1, 'rgba(255,200,200,0)');
        ctx.fillStyle = g;
        ctx.save();
        ctx.translate(c.x, c.y); ctx.scale(1, c.h / (c.w * 0.5)); ctx.translate(-c.x, -c.y);
        ctx.fillRect(c.x - c.w * 0.5, c.y - c.w * 0.5, c.w, c.w);
        ctx.restore();
      }

      // ヒーローの流れ星：赤と青の光の尾を引いて、左下から右上へ
      if (hero.t0 < 0 && t > hero.nextAt) {
        hero.t0 = t;
        const left = Math.random() < 0.5;
        hero.x0 = left ? -W * 0.1 : W * 1.1; hero.x1 = left ? W * 1.1 : -W * 0.1;
        hero.y0 = H * rand(0.55, 0.7); hero.y1 = H * rand(0.1, 0.3);
      }
      let heroDraw: null | { x: number; y: number; a: number; dx: number; dy: number } = null;
      if (hero.t0 >= 0) {
        const p = (t - hero.t0) / hero.dur;
        if (p >= 1) { hero.t0 = -1; hero.nextAt = t + rand(9000, 15000); }
        else {
          const e = p * p * (3 - 2 * p);
          const x = hero.x0 + (hero.x1 - hero.x0) * e, y = hero.y0 + (hero.y1 - hero.y0) * e - Math.sin(p * Math.PI) * H * 0.08;
          const a = Math.sin(p * Math.PI);
          heroDraw = { x, y, a, dx: hero.x1 - hero.x0, dy: hero.y1 - hero.y0 };
        }
      }

      // 街並み（奥 → 手前）
      layers.forEach((L, i) => {
        const off = ((t / 1000) * L.speed) % L.width;
        for (let x = -off; x < W; x += L.width) ctx.drawImage(L.img, x, 0);
        if (i === 0 && heroDraw) { /* ヒーローは中と手前のあいだを飛ぶ */ }
        if (L.windows.length) {
          ctx.globalCompositeOperation = 'lighter';
          for (let x = -off; x < W; x += L.width) {
            for (const w of L.windows) {
              const wx = x + w.x;
              if (wx < -10 || wx > W + 10) continue;
              const on = 0.5 + 0.5 * Math.sin(t * w.speed + w.ph);
              ctx.globalAlpha = w.base * (0.25 + 0.75 * on);
              ctx.fillStyle = `rgb(${w.c})`;
              ctx.fillRect(wx, w.y, w.w, w.h);
            }
            // 看板（ゆっくり色がかわる）
            for (const b of L.billboards) {
              const wx = x + b.x;
              if (wx < -b.w || wx > W) continue;
              const k = (t * 0.00018 + b.ph) % NEON.length;
              const c = NEON[Math.floor(k)];
              const al = 0.28 + 0.12 * Math.sin(t * 0.0006 + b.ph);
              ctx.globalAlpha = al;
              ctx.fillStyle = `rgb(${c})`;
              ctx.fillRect(wx, b.y, b.w, b.h);
              ctx.globalAlpha = al * 0.9;
              const gs = Math.max(b.w, b.h) * 2.2;
              ctx.drawImage(glow, wx + b.w / 2 - gs / 2, b.y + b.h / 2 - gs / 2, gs, gs);
            }
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        if (i === 1 && heroDraw) {
          // 中と手前のあいだ：ヒーロー
          ctx.globalCompositeOperation = 'lighter';
          const len = Math.hypot(heroDraw.dx, heroDraw.dy) || 1;
          const ux = heroDraw.dx / len, uy = heroDraw.dy / len;
          for (let k = 0; k < 26; k++) {
            const f = k / 26;
            const tx = heroDraw.x - ux * f * W * 0.34, ty = heroDraw.y - uy * f * W * 0.34;
            const sz = (1 - f) * 54 + 10;
            ctx.globalAlpha = heroDraw.a * (1 - f) * 0.55;
            ctx.drawImage(k % 2 ? glowRed : glowBlue, tx - sz / 2, ty - sz / 2, sz, sz);
          }
          ctx.globalAlpha = heroDraw.a * 0.95;
          ctx.drawImage(glow, heroDraw.x - 34, heroDraw.y - 34, 68, 68);
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          drawStar4(ctx, heroDraw.x, heroDraw.y, 12 + 4 * heroDraw.a);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
      });

      // 地上のもや（街のあかりがにじむ）
      const haze = ctx.createLinearGradient(0, H * 0.78, 0, H);
      haze.addColorStop(0, 'rgba(255,170,110,0)');
      haze.addColorStop(1, 'rgba(255,170,110,0.2)');
      ctx.fillStyle = haze; ctx.fillRect(0, H * 0.78, W, H * 0.22);
    },
  };
}

export const CityWindowsBackground: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const active = theme === 'sakura';
  const [mode] = useState<BgMode>(detectBgMode);
  const canvasRef = useCanvasLayer(active, mode, createScene);
  if (!active) return null;
  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0b1226]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* 文字を読みやすくする暗幕（中央はうすく、四隅と下をこく） */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 42%, rgba(8,10,34,0.10) 20%, rgba(6,8,28,0.55) 100%)' }} />
    </div>
  );
};
