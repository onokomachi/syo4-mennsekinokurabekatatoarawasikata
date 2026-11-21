/**
 * 「超翔神（ちょうしょうしん）」テーマ専用の背景：ボス戦にも登場する、赤いぼうしとマントのヒーロー猫（超翔神）そのものを背景にする。
 * 超翔神が 空を とぶ 待機動画（ボス戦の待機動画と同じ）を最背面で無音ループし、
 * その上に、動画の世界をなぞった演出を canvas で重ねる：
 *   - 画面の はしから 中心へ向かう、ゆっくり流れる スピードライン（白と水色の細い線）
 *   - 超翔神の ほうから 広がる「どんっ」という衝撃の輪（6秒ごと。ゆっくり広がって消える）
 *   - コミックのような 星と光の十字の きらめき
 * theme === 'tenkuu'（内部ID。バッジ100%で解放。表示名は「超翔神」）のときだけ描画し、それ以外のテーマでは動画を読み込みもしない。
 * 動画はボス戦の待機動画と同じファイルなので、どちらかで一度読めばもう一方はキャッシュから出る。
 * 「視差効果を減らす」設定では静止画＋止まった演出、データセーバー／低速回線では静止画＋演出にする。
 * 光過敏への配慮（WCAG 2.3.1）：点滅させない。スピードラインも衝撃の輪も、ゆっくり出て ゆっくり消える。
 */
import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { BgMode, ThemeVideo, VideoSources, detectBgMode } from './ThemeVideo';
import { CanvasScene, makeGlow, useCanvasLayer } from './canvasLoop';
import { media } from '../../lib/media';

export const CHOUSHO_VIDEO: VideoSources = {
  webm: media('/videos/menseki4/boss/idle.webm'),
  mp4: media('/videos/menseki4/boss/idle.mp4'),
  poster: media('/videos/menseki4/boss/idle-poster.jpg'),
  preferMp4: true,
};

/** 明るい コミックの上でも文字が読めるように暗く落とし、四隅をしぼる（中央の超翔神は やや明るく残す） */
const GRADE_OVERLAY = [
  'radial-gradient(ellipse at 50% 44%, rgba(10,22,60,0.22) 18%, rgba(6,12,40,0.80) 100%)',
  'linear-gradient(to bottom, rgba(8,18,52,0.52) 0%, rgba(8,18,52,0.26) 38%, rgba(6,12,40,0.50) 100%)',
].join(', ');

const rand = (a: number, b: number) => a + Math.random() * (b - a);

interface Line { a: number; r0: number; len: number; sp: number; w: number; ph: number; c: string }

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
  const glow = makeGlow(64, '255,230,150', 'rgba(255,252,230,1)');
  let lines: Line[] = [];
  let stars: Array<{ x: number; y: number; r: number; ph: number }> = [];
  const mk = (): Line => ({
    a: rand(0, Math.PI * 2), r0: rand(0.5, 0.95), len: rand(0.08, 0.22), sp: rand(0.05, 0.14), w: rand(0.8, 2), ph: Math.random(),
    c: Math.random() < 0.7 ? '255,255,255' : '170,220,255',
  });
  return {
    setup({ W, H }) {
      lines = Array.from({ length: Math.min(46, Math.floor((W * H) / 20000)) }, mk);
      stars = Array.from({ length: 22 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(6, 16), ph: rand(0, 6.28) }));
    },
    draw(ctx, { W, H }, t, dt) {
      const s = dt / 1000;
      const cx = W * 0.5, cy = H * 0.46;
      const R = Math.hypot(W, H) * 0.55;
      ctx.globalCompositeOperation = 'lighter';
      // スピードライン：外から中心へ、ゆっくり すいこまれる
      for (const L of lines) {
        L.r0 -= L.sp * s * 0.5;
        if (L.r0 < 0.2) Object.assign(L, mk(), { r0: 1.0 });
        const fade = Math.min(1, (L.r0 - 0.2) / 0.25) * Math.min(1, (1.02 - L.r0) / 0.12);
        const r1 = L.r0 * R, r2 = (L.r0 + L.len) * R;
        ctx.globalAlpha = 0.28 * Math.max(0, fade);
        ctx.strokeStyle = `rgba(${L.c},1)`;
        ctx.lineWidth = L.w;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(L.a) * r1, cy + Math.sin(L.a) * r1);
        ctx.lineTo(cx + Math.cos(L.a) * r2, cy + Math.sin(L.a) * r2);
        ctx.stroke();
      }
      // どんっ：6秒ごとに中心から広がる衝撃の輪（2本）
      const period = 6000;
      for (const delay of [0, 240]) {
        const p = (((t - delay) % period) + period) % period / period;
        if (p < 0.8) {
          const q = p / 0.8;
          ctx.globalAlpha = 0.22 * (1 - q) * (delay ? 0.6 : 1);
          ctx.strokeStyle = 'rgba(255,225,150,1)';
          ctx.lineWidth = 2 + 8 * (1 - q);
          ctx.beginPath(); ctx.arc(cx, cy, 30 + q * Math.max(W, H) * 0.55, 0, Math.PI * 2); ctx.stroke();
        }
      }
      // きらめき
      for (const st of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * 0.0011 + st.ph);
        ctx.globalAlpha = 0.5 * tw;
        ctx.fillStyle = 'rgba(255,240,190,1)';
        drawStar4(ctx, st.x, st.y, st.r * (0.7 + 0.5 * tw));
        const gs = st.r * 5;
        ctx.globalAlpha = 0.2 * tw;
        ctx.drawImage(glow, st.x - gs / 2, st.y - gs / 2, gs, gs);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
  };
}

export const ChoushoBackground: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const active = theme === 'tenkuu';
  const [mode] = useState<BgMode>(detectBgMode);
  const canvasRef = useCanvasLayer(active, mode, createScene);
  if (!active) return null;
  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0a1736]">
      <ThemeVideo src={CHOUSHO_VIDEO} mode={mode} />
      <div className="absolute inset-0" style={{ background: GRADE_OVERLAY }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
