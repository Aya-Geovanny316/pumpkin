import * as THREE from 'three';
import { gsap } from 'gsap';
import { AsciiRenderer } from './ascii';
import { CONFIG, TULIPS } from './config';
import { createTulip, disposeTulip, setTulipGrowth, type Tulip } from './tulip';
import './style.css';
import './tulips-cover.css';
import './tulips-transition.css';
import './tulips-modal.css';

const canvas = document.querySelector<HTMLCanvasElement>('#ascii-canvas')!;
const app = document.querySelector<HTMLElement>('#eternal-tulips-app')!;
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
let tulipHome = app.parentElement;
const dedicationLine = document.querySelector<HTMLElement>('#dedication-line');
const dedicationSignature = document.querySelector<HTMLElement>('#dedication-signature');
if (dedicationLine) dedicationLine.textContent = CONFIG.dedication.line;
if (dedicationSignature) dedicationSignature.textContent = CONFIG.dedication.signature;
const ascii = new AsciiRenderer(canvas);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');
scene.fog = new THREE.FogExp2(0x000000, 0.045);
const camera = new THREE.PerspectiveCamera(29, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.1, 20);
camera.lookAt(0, 1.4, 0);
const time = { value: 0 };
const bouquet = new THREE.Group();
scene.add(bouquet);

const tulips = TULIPS.slice(0, CONFIG.tulipCount).map((config, index) => {
  const tulip = createTulip(config, index, time);
  bouquet.add(tulip);
  setTulipGrowth(tulip, 0);
  return tulip;
});

const ambient = document.querySelector<HTMLAudioElement>('#ambient-audio')!;
if (CONFIG.music.file) ambient.src = assetUrl(CONFIG.music.file);
const soundButton = document.querySelector<HTMLButtonElement>('#sound-toggle')!;
const restartButton = document.querySelector<HTMLButtonElement>('#restart')!;
const fullscreenButton = document.querySelector<HTMLButtonElement>('#fullscreen')!;
const hint = document.querySelector<HTMLElement>('#interaction-hint')!;
let soundOn = false;
let paused = false;
let started = false;
let lastTime = performance.now();
let pointerX = 0;
let pointerY = 0;
let activeTulip: Tulip | null = null;
let tapCount = 0;
let tapStartedAt = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let coverShown = false;
let introStartedAt = performance.now();
const coverButton = document.createElement('button');
coverButton.type = 'button';
coverButton.className = 'album-reveal';
coverButton.setAttribute('aria-label', 'Presionar la portada para reproducir Congratulations');
coverButton.innerHTML = '<canvas class="cover-ascii" aria-hidden="true"></canvas><span>Presiona el diseño</span>';
app.appendChild(coverButton);
const minimizeButton = document.createElement('button');
minimizeButton.type = 'button';
minimizeButton.className = 'minimize-tulips';
minimizeButton.textContent = '×';
minimizeButton.setAttribute('aria-label', 'Cerrar pantalla completa');
app.appendChild(minimizeButton);
const coverAscii = coverButton.querySelector<HTMLCanvasElement>('.cover-ascii')!;
const coverContext = coverAscii.getContext('2d')!;
const morphCanvas = document.createElement('canvas');
morphCanvas.className = 'tulip-morph';
morphCanvas.setAttribute('aria-hidden', 'true');
app.appendChild(morphCanvas);
const morphContext = morphCanvas.getContext('2d')!;
const lyricsVideo = document.createElement('video');
lyricsVideo.className = 'lyrics-video-backdrop';
lyricsVideo.muted = true;
lyricsVideo.loop = true;
lyricsVideo.playsInline = true;
lyricsVideo.preload = 'metadata';
lyricsVideo.setAttribute('aria-hidden', 'true');
lyricsVideo.src = assetUrl('media/Recuerdos_cronologico.mp4');
lyricsVideo.hidden = true;
app.appendChild(lyricsVideo);
const lyricsVideoShade = document.createElement('div');
lyricsVideoShade.className = 'lyrics-video-shade';
lyricsVideoShade.setAttribute('aria-hidden', 'true');
lyricsVideoShade.hidden = true;
app.appendChild(lyricsVideoShade);
coverAscii.style.opacity = '0';
const bouquetAscii = document.createElement('canvas');
bouquetAscii.className = 'reference-bouquet-ascii';
bouquetAscii.setAttribute('aria-hidden', 'true');
app.appendChild(bouquetAscii);
const bouquetContext = bouquetAscii.getContext('2d')!;
type MorphParticle = { x: number; y: number; tx: number; ty: number; color: string; char: string; seed: number };
let morphParticles: MorphParticle[] = [];
let morphStartedAt = 0;
let morphRunning = false;
const coverTargets: Array<{ x: number; y: number; color: string; char: string }> = [];
const flowerTargets: Array<{ x: number; y: number; color: string; char: string }> = [];
let flowerReady = false;
let bouquetBuilding = false;
let bouquetBuildStartedAt = 0;
const coverSource = new Image();
coverSource.src = assetUrl('media/congratulations.jpg');
const flowerSource = new Image();
flowerSource.src = assetUrl('media/tulip-bouquet-reference.png');

const paintReferenceBouquet = () => {
  if (!flowerSource.complete || !flowerSource.naturalWidth) return;
  const columns = 92;
  const rows = 108;
  const sample = document.createElement('canvas');
  sample.width = columns;
  sample.height = rows;
  const sampleContext = sample.getContext('2d', { willReadFrequently: true })!;
  sampleContext.drawImage(flowerSource, 0, 0, columns, rows);
  const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
  flowerTargets.length = 0;
  const density = CONFIG.ascii.density;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const index = (y * columns + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const luma = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
      if (luma < 0.055) continue;
      flowerTargets.push({
        x: (x + 0.5) / columns,
        y: (y + 0.5) / rows,
        color: `rgb(${red}, ${green}, ${blue})`,
        char: density[Math.min(density.length - 1, Math.floor(luma * density.length))]
      });
    }
  }
  flowerReady = flowerTargets.length > 0;
  bouquetAscii.hidden = false;
  gsap.set(canvas, { opacity: 0 });
  const width = app.clientWidth || window.innerWidth;
  const height = app.clientHeight || window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  bouquetAscii.width = Math.floor(width * dpr);
  bouquetAscii.height = Math.floor(height * dpr);
  renderReferenceBouquet();
};

function renderReferenceBouquet() {
  if (!flowerTargets.length) return;
  const width = app.clientWidth || window.innerWidth;
  const height = app.clientHeight || window.innerHeight;
  const aspect = flowerSource.naturalWidth / flowerSource.naturalHeight;
  const designWidth = Math.min(width * 0.78, height * 0.84 * aspect);
  const designHeight = designWidth / aspect;
  const progress = bouquetBuilding ? Math.min(1, (performance.now() - bouquetBuildStartedAt) / 2800) : 1;
  const eased = 1 - Math.pow(1 - progress, 3);
  bouquetContext.clearRect(0, 0, bouquetAscii.width, bouquetAscii.height);
  bouquetContext.textAlign = 'center';
  bouquetContext.textBaseline = 'middle';
  bouquetContext.font = `${Math.max(7, Math.round(height / 86))}px ui-monospace, monospace`;
  flowerTargets.forEach((point, index) => {
    const startX = 0.12 + ((index * 37) % 76) / 100;
    const startY = 0.12 + ((index * 61) % 76) / 100;
    const x = startX + (0.5 + (point.x - 0.5) * designWidth / width - startX) * eased;
    const y = startY + (0.5 + (point.y - 0.5) * designHeight / height - startY) * eased;
    bouquetContext.globalAlpha = 0.25 + eased * 0.75;
    bouquetContext.fillStyle = point.color;
    bouquetContext.fillText(point.char, x * bouquetAscii.width, y * bouquetAscii.height);
  });
  bouquetContext.globalAlpha = 1;
  if (progress >= 1) bouquetBuilding = false;
}
flowerSource.addEventListener('load', paintReferenceBouquet);
const paintCoverDesign = () => {
  if (!coverSource.complete || !coverSource.naturalWidth) return;
  const columns = 108;
  const rows = 82;
  coverAscii.width = columns * 8;
  coverAscii.height = rows * 12;
  const sample = document.createElement('canvas');
  sample.width = columns;
  sample.height = rows;
  const sampleContext = sample.getContext('2d', { willReadFrequently: true })!;
  const imageRatio = coverSource.naturalWidth / coverSource.naturalHeight;
  const targetRatio = columns / rows;
  const sourceWidth = imageRatio > targetRatio ? coverSource.naturalHeight * targetRatio : coverSource.naturalWidth;
  const sourceHeight = imageRatio > targetRatio ? coverSource.naturalHeight : coverSource.naturalWidth / targetRatio;
  sampleContext.drawImage(coverSource, (coverSource.naturalWidth - sourceWidth) / 2, (coverSource.naturalHeight - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, columns, rows);
  const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
  const density = CONFIG.ascii.density;
  coverTargets.length = 0;
  coverContext.fillStyle = '#000';
  coverContext.fillRect(0, 0, coverAscii.width, coverAscii.height);
  coverContext.font = '10px ui-monospace, monospace';
  coverContext.textAlign = 'center';
  coverContext.textBaseline = 'middle';
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const index = (y * columns + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const luma = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
      if (luma < 0.06) continue;
      coverTargets.push({
        x: (x + 0.5) / columns,
        y: (y + 0.5) / rows,
        color: `rgb(${red}, ${green}, ${blue})`,
        char: density[Math.min(density.length - 1, Math.floor(luma * density.length))]
      });
      coverContext.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      coverContext.fillText(density[Math.min(density.length - 1, Math.floor(luma * density.length))], x * 8 + 4, y * 12 + 6);
    }
  }
};
coverSource.addEventListener('load', paintCoverDesign);

const createMorphParticles = () => {
  const count = Math.max(2400, Math.min(8000, Math.max(coverTargets.length, flowerTargets.length)));
  const source = Array.from({ length: count }, (_, index) => {
    if (!bouquetAscii.hidden && flowerTargets.length) {
      const sourceIndex = Math.floor(index * flowerTargets.length / count);
      const point = flowerTargets[sourceIndex];
      return { x: point.x, y: point.y, seed: index * 0.71 };
    }
    const head = index % 4;
    const centers = [[0.29, 0.32], [0.56, 0.17], [0.73, 0.34], [0.45, 0.42]] as const;
    const [cx, cy] = centers[head];
    const angle = (index * 2.399 + head) % (Math.PI * 2);
    const radius = Math.sqrt((index % 97) / 97);
    const isStem = index % 5 === 0;
    return {
      x: isStem ? cx + Math.sin(index * 1.7) * 0.025 : cx + Math.cos(angle) * radius * 0.12,
      y: isStem ? cy + 0.16 + ((index * 13) % 61) / 100 : cy + Math.sin(angle) * radius * 0.16,
      seed: index * 0.71
    };
  });
  morphParticles = source.map((point, index) => {
    // Distribute the available particles over the complete sampled image;
    // using the first N pixels would only reconstruct its upper rows.
    const targetIndex = coverTargets.length ? Math.floor(index * coverTargets.length / count) : 0;
    const target = coverTargets[targetIndex] ?? { x: 0.5, y: 0.5, color: '#ffd1e8', char: '@' };
    return { x: point.x, y: point.y, tx: target.x, ty: target.y, color: target.color, char: target.char, seed: point.seed };
  });
};

const drawMorph = (now: number) => {
  if (!morphRunning) return;
  const width = app.clientWidth || window.innerWidth;
  const height = app.clientHeight || window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  if (morphCanvas.width !== Math.floor(width * dpr) || morphCanvas.height !== Math.floor(height * dpr)) {
    morphCanvas.width = Math.floor(width * dpr);
    morphCanvas.height = Math.floor(height * dpr);
  }
  const elapsed = now - morphStartedAt;
  const progress = Math.min(1, elapsed / 3600);
  const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  morphContext.clearRect(0, 0, morphCanvas.width, morphCanvas.height);
  morphContext.textAlign = 'center';
  morphContext.textBaseline = 'middle';
  morphContext.font = `${Math.max(8, Math.round(height / 72))}px ui-monospace, monospace`;
  const designSize = Math.min(width * 0.72, height * 0.72);
  const flowerAspect = flowerSource.naturalWidth && flowerSource.naturalHeight ? flowerSource.naturalWidth / flowerSource.naturalHeight : 1;
  const flowerWidth = Math.min(width * 0.78, height * 0.84 * flowerAspect);
  const flowerHeight = flowerWidth / flowerAspect;
  morphParticles.forEach((particle, index) => {
    const wave = Math.sin(particle.seed + progress * 11) * (1 - eased) * 0.045;
    const sourceX = 0.5 + (particle.x - 0.5) * flowerWidth / width;
    const sourceY = 0.5 + (particle.y - 0.5) * flowerHeight / height;
    const targetX = 0.5 + (particle.tx - 0.5) * designSize / width;
    const targetY = 0.5 + (particle.ty - 0.5) * designSize / height;
    const x = (sourceX + (targetX - sourceX) * eased + wave) * morphCanvas.width;
    const y = (sourceY + (targetY - sourceY) * eased + Math.cos(particle.seed + progress * 9) * (1 - eased) * 0.035) * morphCanvas.height;
    morphContext.globalAlpha = 0.45 + eased * 0.55;
    morphContext.fillStyle = particle.color;
    morphContext.fillText(particle.char, x, y);
    if (index % 9 === 0 && progress < 0.92) {
      morphContext.globalAlpha = 0.15;
      morphContext.fillText('·', x + Math.sin(particle.seed) * 16, y + Math.cos(particle.seed) * 12);
    }
  });
  morphContext.globalAlpha = 1;
  if (progress >= 1) {
    morphRunning = false;
    gsap.to(coverButton, { opacity: 1, duration: 0.9, ease: 'power2.out' });
  }
};
minimizeButton.hidden = true;
const lyricsLayer = document.createElement('pre');
lyricsLayer.className = 'lyrics-layer';
lyricsLayer.setAttribute('aria-live', 'polite');
lyricsLayer.hidden = true;
app.appendChild(lyricsLayer);
const lyricsAsciiCanvas = document.createElement('canvas');
lyricsAsciiCanvas.className = 'lyrics-ascii';
lyricsAsciiCanvas.setAttribute('aria-hidden', 'true');
lyricsAsciiCanvas.hidden = true;
app.appendChild(lyricsAsciiCanvas);
const lyricsAsciiContext = lyricsAsciiCanvas.getContext('2d', { willReadFrequently: true })!;
type SyncedLyricLine = { text: string; start: number | null; end: number | null };
let syncedLyrics: SyncedLyricLine[] = [];
void fetch(assetUrl('lyrics/congratulations.sync.json')).then(response => response.json()).then(data => {
  syncedLyrics = (data.lines ?? []).map((line: SyncedLyricLine) => ({
    text: line.text,
    start: line.start ?? 0,
    end: line.end
  }));
});

const renderLyric = () => {
  if (!ambient.duration || !syncedLyrics.length) return;
  const activeLine = syncedLyrics.find(line => line.start !== null && line.end !== null && ambient.currentTime >= line.start && ambient.currentTime < line.end);
  if (!activeLine) {
    lyricsLayer.textContent = '';
    return;
  }
  const line = activeLine.text;
  lyricsLayer.textContent = line;
};
ambient.addEventListener('timeupdate', renderLyric);

function renderLyricAscii(line: string) {
  const width = Math.min(1200, Math.max(420, app.clientWidth || window.innerWidth));
  const height = Math.min(260, Math.max(120, Math.round(width * 0.22)));
  lyricsAsciiCanvas.width = width;
  lyricsAsciiCanvas.height = height;
  const mask = document.createElement('canvas');
  mask.width = Math.round(width / 3);
  mask.height = Math.round(height / 3);
  const maskContext = mask.getContext('2d')!;
  maskContext.fillStyle = '#000';
  maskContext.fillRect(0, 0, mask.width, mask.height);
  maskContext.fillStyle = '#fff';
  maskContext.textAlign = 'center';
  maskContext.textBaseline = 'middle';
  maskContext.font = `700 ${Math.max(18, Math.min(44, mask.width / Math.max(line.length * 0.48, 1)))}px Georgia, serif`;
  const maxChars = width < 600 ? 25 : 46;
  const words = line.split(/\s+/);
  const wrapped: string[] = [];
  let current = '';
  words.forEach(word => {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > maxChars) {
      wrapped.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) wrapped.push(current);
  const visibleLines = wrapped.slice(0, 3);
  const lineSize = Math.max(10, Math.min(24, mask.width / Math.max(maxChars * 0.55, 1)));
  maskContext.font = `700 ${lineSize}px Georgia, serif`;
  visibleLines.forEach((part, row) => maskContext.fillText(part, mask.width / 2, mask.height / 2 + (row - (visibleLines.length - 1) / 2) * (lineSize * 1.5)));
  const pixels = maskContext.getImageData(0, 0, mask.width, mask.height).data;
  const density = CONFIG.ascii.density;
  const step = 3;
  lyricsAsciiContext.clearRect(0, 0, width, height);
  lyricsAsciiContext.fillStyle = 'rgba(0, 0, 0, .78)';
  lyricsAsciiContext.fillRect(0, 18, width, height - 36);
  lyricsAsciiContext.textAlign = 'center';
  lyricsAsciiContext.textBaseline = 'middle';
  lyricsAsciiContext.font = `${Math.max(9, Math.round(height / 20))}px ui-monospace, monospace`;
  for (let y = 0; y < mask.height; y += step) {
    for (let x = 0; x < mask.width; x += step) {
      const alpha = pixels[(y * mask.width + x) * 4];
      if (alpha < 80) continue;
      const char = density[Math.min(density.length - 1, Math.floor((alpha / 255) * density.length))];
      lyricsAsciiContext.fillStyle = (x + y) % 7 === 0 ? '#ffd1e8' : '#fff4f8';
      lyricsAsciiContext.fillText(char, x * 3 + 1.5, y * 3 + 1.5);
    }
  }
}

const showAlbumCover = () => {
  if (coverShown) return;
  coverShown = true;
  app.classList.add('is-cover-visible');
  gsap.to('.dedication', { opacity: 1, duration: 0.5 });
  if (dedicationLine) dedicationLine.textContent = 'Presiona el album';
  if (dedicationSignature) dedicationSignature.textContent = '';
  coverButton.hidden = false;
  morphCanvas.hidden = false;
  paintCoverDesign();
  createMorphParticles();
  morphStartedAt = performance.now();
  morphRunning = true;
  minimizeButton.hidden = false;
  hint.textContent = 'Presiona el disco para comenzar';
  hint.style.opacity = '0';
  // The flower characters dissolve as the same visual language rebuilds the disc design.
  gsap.to(canvas, { opacity: 0, duration: 1.8, ease: 'power2.inOut' });
  gsap.to(bouquetAscii, { opacity: 0, duration: 2.6, ease: 'power2.inOut' });
  gsap.fromTo(coverButton, { opacity: 0, scale: 0.72, rotate: -3 }, { opacity: 0, scale: 1, rotate: 0, duration: 2.4, ease: 'power3.out' });
};

const expandTulips = () => {
  restart();
  if (app.parentElement && app.parentElement !== document.body) tulipHome = app.parentElement;
  document.body.append(app);
  app.hidden = false;
  app.style.display = 'grid';
  canvas.style.opacity = '0';
  document.body.classList.add('tulips-modal-open');
  app.classList.add('is-fullscreen');
  void app.requestFullscreen?.().catch(() => undefined);
  minimizeButton.hidden = false;
  bouquetBuilding = true;
  bouquetBuildStartedAt = performance.now();
  paintReferenceBouquet();
  paintCoverDesign();
  requestAnimationFrame(() => {
    ascii.resize();
    updateCamera();
  });
};
const minimizeTulips = () => {
  document.body.classList.remove('tulips-modal-open');
  app.classList.remove('is-fullscreen');
  minimizeButton.hidden = true;
  if (tulipHome) tulipHome.append(app);
  if (document.fullscreenElement) void document.exitFullscreen?.();
};
app.addEventListener('expand-tulips', expandTulips);
minimizeButton.addEventListener('click', minimizeTulips);
app.addEventListener('dblclick', event => {
  if (event.target === canvas) expandTulips();
});

const startSong = async () => {
  ambient.currentTime = 0;
  await ambient.play().catch(() => undefined);
  soundOn = true;
  soundButton.setAttribute('aria-pressed', 'true');
  soundButton.classList.add('is-active');
  gsap.to(ambient, { volume: CONFIG.music.volume, duration: 1.8 });
  app.classList.add('is-playing');
  bouquetAscii.hidden = true;
  lyricsVideo.currentTime = 0;
  lyricsVideo.hidden = false;
  lyricsVideoShade.hidden = false;
  void lyricsVideo.play().catch(() => undefined);
  gsap.to(morphCanvas, { opacity: 0, duration: 1.2, ease: 'power2.inOut', onComplete: () => { morphCanvas.hidden = true; } });
  gsap.to(coverButton, { opacity: 0, duration: 1.2, ease: 'power2.inOut', onComplete: () => { coverButton.hidden = true; } });
  gsap.to('.dedication', { opacity: 0, duration: 0.8 });
  lyricsLayer.hidden = false;
  lyricsAsciiCanvas.hidden = true;
  gsap.fromTo(lyricsLayer, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' });
  hint.textContent = 'Congratulations';
  coverButton.querySelector('span')!.textContent = 'Reproduciendo';
};
coverButton.hidden = true;
coverButton.addEventListener('click', () => { void startSong(); });

const updateCamera = () => {
  const narrow = window.innerWidth < 650;
  camera.fov = narrow ? 58 : window.innerWidth < 900 ? 36 : 29;
  camera.position.z = narrow ? 16.5 : 16;
  bouquet.scale.setScalar(narrow ? 1.08 : 1);
  const bounds = app.getBoundingClientRect();
  camera.aspect = bounds.width / Math.max(bounds.height, 1);
  camera.updateProjectionMatrix();
};

const bloomTimeline = () => {
  const timeline = gsap.timeline({ onComplete: () => { started = true; } });
  tulips.forEach((tulip, index) => {
    const proxy = { value: 0 };
    timeline.to(proxy, {
      value: 1,
      duration: CONFIG.growth.stems + CONFIG.growth.leaves + CONFIG.growth.bloom,
      delay: index * 0.09,
      ease: 'power2.out',
      onUpdate: () => setTulipGrowth(tulip, proxy.value)
    }, index * 0.08);
  });
  if (reducedMotion) {
    gsap.set('.dedication', { opacity: 1, y: 0 });
    gsap.set('.interaction-hint', { opacity: 0.7 });
  } else {
    gsap.fromTo('.dedication', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.8, delay: 3.8, ease: 'power2.out' });
    gsap.to('.interaction-hint', { opacity: 0, delay: 7, duration: 1.2, ease: 'power2.out' });
  }
};

const restart = () => {
  gsap.killTweensOf('.dedication, .interaction-hint');
  gsap.killTweensOf(canvas);
  gsap.killTweensOf(coverButton);
  gsap.killTweensOf(bouquetAscii);
  gsap.killTweensOf(morphCanvas);
  gsap.set(canvas, { opacity: 0 });
  gsap.set(bouquetAscii, { opacity: 1 });
  gsap.set(morphCanvas, { opacity: 1 });
  gsap.set(coverButton, { opacity: 0, scale: 1, rotate: 0 });
  morphRunning = false;
  morphCanvas.hidden = true;
  bouquetBuilding = false;
  bouquetAscii.hidden = false;
  started = false;
  coverShown = false;
  introStartedAt = performance.now();
  coverButton.hidden = true;
  minimizeButton.hidden = true;
  app.classList.remove('is-cover-visible', 'is-playing');
  lyricsLayer.hidden = true;
  lyricsLayer.textContent = '';
  lyricsAsciiCanvas.hidden = true;
  lyricsVideo.pause();
  lyricsVideo.currentTime = 0;
  lyricsVideo.hidden = true;
  lyricsVideoShade.hidden = true;
  if (dedicationLine) dedicationLine.textContent = CONFIG.dedication.line;
  if (dedicationSignature) dedicationSignature.textContent = CONFIG.dedication.signature;
  ambient.pause();
  ambient.currentTime = 0;
  hint.style.opacity = '0.6';
  tulips.forEach(tulip => setTulipGrowth(tulip, 0));
  bloomTimeline();
};

const spawnBurst = (tulip: Tulip, count = 18) => {
  const world = new THREE.Vector3();
  tulip.getWorldPosition(world);
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'burst-particle';
    particle.textContent = i % 3 === 0 ? '@' : '*';
    particle.style.left = `${50 + world.x * 3.2}%`;
    particle.style.top = `${48 - world.y * 3.4}%`;
    particle.style.color = CONFIG.particleColors[i % CONFIG.particleColors.length];
    particle.style.setProperty('--burst-x', `${(Math.random() - 0.5) * 130}px`);
    particle.style.setProperty('--burst-y', `${-30 - Math.random() * 110}px`);
    app.appendChild(particle);
    window.setTimeout(() => particle.remove(), 1350);
  }
};

const showEgg = () => {
  const egg = document.createElement('div');
  egg.className = 'easter-egg';
  egg.textContent = CONFIG.easterEgg.initials;
  app.appendChild(egg);
  gsap.fromTo(egg, { opacity: 0, scale: 0.4, letterSpacing: '0.8em' }, { opacity: 1, scale: 1, letterSpacing: '0.22em', duration: 1.2, ease: 'power3.out' });
  gsap.to(egg, { opacity: 0, scale: 1.4, delay: 2.5, duration: 1.8, ease: 'power2.in', onComplete: () => egg.remove() });
};

const activateTulip = (tulip: Tulip) => {
  if (activeTulip === tulip) {
    gsap.to(tulip.scale, { x: tulip.userData.config.scale * 1.05, y: tulip.userData.config.scale * 1.05, z: tulip.userData.config.scale * 1.05, duration: 0.45, yoyo: true, repeat: 1, ease: 'power2.out' });
  } else {
    activeTulip = tulip;
    gsap.to(tulip.rotation, { z: tulip.userData.config.lean - 0.08, duration: 0.35, yoyo: true, repeat: 1, ease: 'power2.out' });
  }
  spawnBurst(tulip);
  if (performance.now() - tapStartedAt > CONFIG.easterEgg.tripleTapWindow * 1000) tapCount = 0;
  if (!tapCount) tapStartedAt = performance.now();
  tapCount += 1;
  if (tapCount >= 3 && tulip.userData.index === 3) {
    tapCount = 0;
    showEgg();
  }
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pick = (event: PointerEvent) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(tulips, true);
  const picked = hits.find(hit => {
    let object: THREE.Object3D | null = hit.object;
    while (object && !tulips.includes(object as Tulip)) object = object.parent;
    return object;
  });
  if (picked) {
    let object: THREE.Object3D | null = picked.object;
    while (object && !tulips.includes(object as Tulip)) object = object.parent;
    if (object) activateTulip(object as Tulip);
  }
};

canvas.addEventListener('pointermove', event => {
  const rect = canvas.getBoundingClientRect();
  pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
});
canvas.addEventListener('pointerdown', event => { pick(event); hint.style.opacity = '0'; });

soundButton.addEventListener('click', async () => {
  soundOn = !soundOn;
  soundButton.setAttribute('aria-pressed', String(soundOn));
  soundButton.classList.toggle('is-active', soundOn);
  if (!CONFIG.music.file) return;
  if (soundOn) {
    await ambient.play().catch(() => undefined);
    if (app.classList.contains('is-playing')) void lyricsVideo.play().catch(() => undefined);
    gsap.to(ambient, { volume: CONFIG.music.volume, duration: 1.8 });
  } else {
    gsap.to(ambient, { volume: 0, duration: 0.8, onComplete: () => { ambient.pause(); lyricsVideo.pause(); } });
  }
});
restartButton.addEventListener('click', restart);
fullscreenButton.addEventListener('click', async () => {
  if (!document.fullscreenElement) await app.requestFullscreen?.();
  else await document.exitFullscreen?.();
});

document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
});

const clock = new THREE.Clock();
const animate = () => {
  requestAnimationFrame(animate);
  if (paused) return;
  const now = performance.now();
  const delta = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  time.value = clock.getElapsedTime();
  if (!coverShown && now - introStartedAt > 15000) showAlbumCover();
  if (bouquetBuilding) renderReferenceBouquet();
  drawMorph(now);
  bouquet.rotation.y += ((pointerX * CONFIG.motion.parallax) - bouquet.rotation.y) * delta * 3;
  bouquet.rotation.x += ((-pointerY * CONFIG.motion.parallax * 0.45) - bouquet.rotation.x) * delta * 3;
  tulips.forEach(tulip => {
    const config = tulip.userData.config;
    tulip.rotation.z += (config.lean + Math.sin(time.value * CONFIG.motion.breeze + config.phase) * 0.018 - tulip.rotation.z) * delta * 2.2;
  });
  ascii.render(scene, camera);
};

window.addEventListener('resize', updateCamera);
updateCamera();

restart();
animate();

window.addEventListener('beforeunload', () => {
  tulips.forEach(disposeTulip);
  ascii.dispose();
});
