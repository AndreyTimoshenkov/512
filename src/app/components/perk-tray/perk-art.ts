import { EPerk } from '../../interfaces/perk.types';

export type TArtLayer = {
  d: string;
  fill?: string;
  // Unoutlined detail such as pips and shine, or a bare ink line.
  style?: 'plain' | 'line';
};

const WHITE = '#ffffff';
const GOLD = '#ffd21f';
const ORANGE = '#ff9a2e';
const CORAL = '#ff4f5e';
const MAGENTA = '#ff3d9a';
const LILAC = '#c09aff';
const MINT = '#7fe8b5';
const SKY = '#62ccff';

// Sticker-style icons on a 32 unit canvas, painted bottom layer first.
export const PERK_ART: Record<EPerk, TArtLayer[]> = {
  [EPerk.double]: [
    { d: 'M16 2.5a13.5 13.5 0 1 0 0 27a13.5 13.5 0 0 0 0-27z', fill: GOLD },
    { d: 'M7 13a10 10 0 0 1 7-6.5', style: 'line', fill: WHITE },
    { d: 'M7.5 13l6.5 7M14 13l-6.5 7M17.5 15a3.4 3.4 0 1 1 5.6 2.6L17.5 22h7', style: 'line' },
  ],
  [EPerk.swap]: [
    { d: 'M6 2.5h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3z', fill: LILAC },
    { d: 'M18 15.5h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3z', fill: MINT },
    { d: 'M21 4.5c4 0 7 2 7 6.5M24.5 8.5l3.5 3 3-3.5M11 27.5c-4 0-7-2-7-6.5M7.5 23.5L4 20.5l-3 3.5', style: 'line' },
  ],
  [EPerk.hammer]: [
    { d: 'M13.5 14.5L4 24a2.8 2.8 0 0 0 4 4l9.5-9.5z', fill: ORANGE },
    { d: 'M18.5 3L29 13.5l-7.5 7.5L11 10.5z', fill: MAGENTA },
    { d: 'M18.5 7l6.5 6.5', style: 'line', fill: WHITE },
  ],
  [EPerk.undo]: [
    { d: 'M13 3L2.5 12.5 13 22v-6h7a4.5 4.5 0 0 1 0 9h-5v5h6a9.5 9.5 0 0 0 0-19h-8z', fill: SKY },
    { d: 'M11 8l-5 4.5', style: 'line', fill: WHITE },
  ],
  [EPerk.shuffle]: [
    { d: 'M15 2h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z', fill: LILAC },
    { d: 'M5 11h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z', fill: CORAL },
    {
      d: 'M5 16a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM15 16a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM10 21a2 2 0 1 0 4 0a2 2 0 1 0-4 0z'
        + 'M5 26a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM15 26a2 2 0 1 0 4 0a2 2 0 1 0-4 0z',
      fill: WHITE,
      style: 'plain',
    },
  ],
  [EPerk.sweep]: [
    { d: 'M27.5 1.5l3 3L19 16l-3-3z', fill: ORANGE },
    { d: 'M12.5 13.5l6 6c-2 6-7 9.5-15 10.5l-1.5-1.5c1-8 4.5-13 10.5-15z', fill: GOLD },
    { d: 'M13 11.5l7.5 7.5-2.5 2.5-7.5-7.5z', fill: MAGENTA },
    { d: 'M9 19.5l-3.5 6.5M13 22l-4.5 5', style: 'line' },
    { d: 'M26 20l1.3 3.7 3.7 1.3-3.7 1.3L26 30l-1.3-3.7L21 25l3.7-1.3z', fill: WHITE },
  ],
  [EPerk.save]: [
    { d: 'M5 2.5h19l5.5 5.5v19a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 27V5A2.5 2.5 0 0 1 5 2.5z', fill: MINT },
    { d: 'M9 2.5h13V11a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 9 11z', fill: WHITE },
    { d: 'M16.5 5h3v5h-3z', fill: CORAL, style: 'plain' },
    { d: 'M8 29.5V19a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10.5z', fill: GOLD },
    { d: 'M12 21.5h8M12 25.5h8', style: 'line' },
  ],
  [EPerk.upgrade]: [
    { d: 'M16 2L29.5 15.5H22V21H10v-5.5H2.5z', fill: MAGENTA },
    { d: 'M10 24h12a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 22 29H10a1.5 1.5 0 0 1-1.5-1.5v-2A1.5 1.5 0 0 1 10 24z', fill: GOLD },
    { d: 'M15 7l-6 6', style: 'line', fill: WHITE },
  ],
};
