/**
 * 「超翔神（ちょうしょうしん）」の名前。「超翔」は小学校で習わない漢字なので、ふりがなをつける。
 * 背景テーマの名前とボス戦のボスの名前で共通に使う。文字だけが要る所（aria-label など）は CHOUSHO_TEXT を使う。
 */
import React from 'react';

export const CHOUSHO_TEXT = '超翔神（ちょうしょうしん）';

export const ChoushoName: React.FC = () => (
  <span className="inline-block whitespace-nowrap"><ruby>超翔<rt className="text-[0.5em] font-bold tracking-normal">ちょうしょう</rt></ruby>神</span>
);
