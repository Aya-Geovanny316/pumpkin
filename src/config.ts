export const CONFIG = {
  tulipCount: 7,
  petalColors: ['#FFD1E8', '#F49AC2', '#E879AC', '#D95791', '#702345'],
  stemColors: ['#79B891', '#47865C', '#234D38'],
  particleColors: ['#FFF4F8', '#FFB6D9'],
  ascii: {
    density: ' .,:;irsXA253hMHGS#9B&@',
    desktopColumns: 138,
    mobileColumns: 74,
    smoothing: 0.78,
    fontAspect: 0.52
  },
  growth: { stems: 1.35, leaves: 1.1, bloom: 1.55 },
  motion: { breeze: 0.8, parallax: 0.055, particleSpeed: 0.22 },
  particles: { desktop: 150, mobile: 72 },
  dedication: {
    line: 'Sé que los tulipanes no son tus favoritos, pero aún recuerdo cuando me dijiste que jamás te habían regalado tulipanes. No importa que se marchiten rápido, porque yo te voy a dejar de amar cuando estos se marchiten.',
    signature: 'Para ti, siempre.'
  },
  easterEgg: { initials: 'M.F.', tripleTapWindow: 1.45 },
  music: { file: 'media/audio/congratulations.mp3', volume: 0.18, lyricsOffset: 0 },
  quality: { maxPixelRatio: 1.35, lowPowerColumns: 92 }
} as const;

export type TulipConfig = {
  kind: 'tulip' | 'gerbera';
  height: number;
  scale: number;
  x: number;
  z: number;
  lean: number;
  phase: number;
  hue: number;
};

export const TULIPS: TulipConfig[] = [
  { kind: 'tulip', height: 5.8, scale: 1.04, x: -1.72, z: 0.12, lean: -0.11, phase: 0.2, hue: 0.2 },
  { kind: 'tulip', height: 7.2, scale: 1.08, x: 0.38, z: -0.28, lean: 0.02, phase: 1.5, hue: 0.5 },
  { kind: 'tulip', height: 5.95, scale: 1.03, x: 1.9, z: 0.05, lean: 0.1, phase: 2.4, hue: 0.0 },
  { kind: 'tulip', height: 4.95, scale: 0.98, x: -0.42, z: 0.18, lean: -0.04, phase: 0.75, hue: 0.8 },
  { kind: 'gerbera', height: 3.05, scale: 0.86, x: -2.25, z: -0.16, lean: -0.06, phase: 1.1, hue: 0.35 },
  { kind: 'gerbera', height: 2.85, scale: 0.92, x: 0.1, z: -0.52, lean: 0.02, phase: 2.1, hue: 0.65 },
  { kind: 'gerbera', height: 3.2, scale: 0.84, x: 2.35, z: -0.12, lean: 0.08, phase: 2.8, hue: 0.15 }
];
