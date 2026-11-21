/**
 * 「ヒーローコミック」テーマ専用の背景：アメコミ風の予告映像（ヒーローたちと、せまる闇のロボ）の動画。
 * 動画は 480p・音声なし・約1.2MB（元は 720p・音声つき・6.1MB）。はじめと終わりを1秒かけて溶かして、くり返しの継ぎ目をなめらかにしてある。
 * その上に、コミックらしい演出を重ねる：
 *   - 印刷のような「網点（ハーフトーン）」のもよう（CSS。ごくうすく）
 *   - ゆっくり またたく 星と、ふわっと広がる 光の十字（canvas。点滅させない）
 * さらに、文字を読みやすくする暗幕（動画の中の英語の文字が目立たないよう、すこし深く落とす）を重ねる。
 * theme === 'inferno'（内部ID。バッジ75%で解放。表示名は「ヒーローコミック」）のときだけ描画し、それ以外のテーマでは動画を読み込みもしない。
 * 「視差効果を減らす」設定では静止画＋止まった演出、データセーバー／低速回線では静止画＋演出にする。
 */
import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { BgMode, ThemeVideo, VideoSources, detectBgMode } from './ThemeVideo';
import { CanvasScene, makeGlow, useCanvasLayer } from './canvasLoop';
import { media } from '../../lib/media';

const VIDEO: VideoSources = {
  webm: media('/videos/menseki4/theme/loop.webm'),
  mp4: media('/videos/menseki4/theme/loop.mp4'),
  poster: media('/videos/menseki4/theme/poster.jpg'),
  preferMp4: true,
};

/** 明るい コミックの上でも文字が読めるように、深い紫がかった紺に落とし、四隅をしぼる */
const GRADE_OVERLAY = [
  'radial-gradient(ellipse at 50% 42%, rgba(22,12,58,0.34) 16%, rgba(12,6,36,0.82) 100%)',
  'linear-gradient(to bottom, rgba(20,10,52,0.55) 0%, rgba(20,10,52,0.3) 40%, rgba(12,6,36,0.56) 100%)',
].join(', ');

/** 網点（ハーフトーン）：ごくうすい黒い点を、ななめに ならべる */
const HALFTONE = 'radial-gradient(rgba(0,0,0,0.38) 1.1px, transparent 1.6px)';

const rand = (a: number, b: number) => a + Math.random() * (b - a);

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
  const glow = makeGlow(64, '255,215,90');
  let stars: Array<{ x: number; y: number; r: number; ph: number; c: string }> = [];
  return {
    setup({ W, H }) {
      stars = Array.from({ length: 30 }, () => ({
        x: rand(0, W), y: rand(0, H), r: rand(5, 14), ph: rand(0, 6.28), c: ['255,230,120', '255,140,120', '150,210,255'][Math.floor(Math.random() * 3)],
      }));
    },
    draw(ctx, _env, t) {
      ctx.globalCompositeOperation = 'lighter';
      for (const st of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * 0.00095 + st.ph);
        ctx.globalAlpha = 0.5 * tw;
        ctx.fillStyle = `rgba(${st.c},1)`;
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

export const ComicVideoBackground: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const active = theme === 'inferno';
  const [mode] = useState<BgMode>(detectBgMode);
  const canvasRef = useCanvasLayer(active, mode, createScene);
  if (!active) return null;
  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#1a1033]">
      <ThemeVideo src={VIDEO} mode={mode} />
      <div className="absolute inset-0" style={{ background: GRADE_OVERLAY }} />
      <div className="absolute inset-0" style={{ backgroundImage: HALFTONE, backgroundSize: '7px 7px', mixBlendMode: 'multiply', opacity: 0.5 }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
