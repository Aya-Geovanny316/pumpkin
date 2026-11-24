import * as THREE from 'three';
import { CONFIG } from './config';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export class AsciiRenderer {
  readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly renderer: THREE.WebGLRenderer;
  private target: THREE.WebGLRenderTarget;
  private pixels = new Uint8Array();
  private previousLuma = new Float32Array();
  private columns = 0;
  private rows = 0;
  private readonly chars = CONFIG.ascii.density;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false })!;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.target = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: true, stencilBuffer: false });
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  get webgl() { return this.renderer; }

  resize() {
    const bounds = this.canvas.parentElement?.getBoundingClientRect();
    const viewportWidth = bounds?.width || window.innerWidth;
    const viewportHeight = bounds?.height || window.innerHeight;
    const mobile = viewportWidth < 650;
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.quality.maxPixelRatio);
    const maxColumns = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ? CONFIG.quality.lowPowerColumns : Infinity;
    this.columns = Math.min(mobile ? CONFIG.ascii.mobileColumns : CONFIG.ascii.desktopColumns, maxColumns);
    this.rows = Math.max(24, Math.round(this.columns * (viewportHeight / Math.max(viewportWidth, 1)) * CONFIG.ascii.fontAspect));
    this.canvas.width = Math.floor(viewportWidth * dpr);
    this.canvas.height = Math.floor(viewportHeight * dpr);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.context.font = `${Math.max(6, Math.floor(this.canvas.height / this.rows))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    this.context.textBaseline = 'top';
    this.target.setSize(this.columns, this.rows);
    this.pixels = new Uint8Array(this.columns * this.rows * 4);
    this.previousLuma = new Float32Array(this.columns * this.rows);
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.columns, this.rows, false);
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);
    this.renderer.readRenderTargetPixels(this.target, 0, 0, this.columns, this.rows, this.pixels);
    this.renderer.setRenderTarget(null);
    this.draw();
  }

  private draw() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cellW = width / this.columns;
    const cellH = height / this.rows;
    this.context.fillStyle = '#000';
    this.context.fillRect(0, 0, width, height);
    this.context.textAlign = 'center';
    this.context.font = `${Math.max(6, Math.floor(cellH * 1.1))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.columns; x += 1) {
        const sourceY = this.rows - y - 1;
        const index = (sourceY * this.columns + x) * 4;
        const red = this.pixels[index];
        const green = this.pixels[index + 1];
        const blue = this.pixels[index + 2];
        const current = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
        const pixelIndex = sourceY * this.columns + x;
        const luma = this.previousLuma[pixelIndex] * CONFIG.ascii.smoothing + current * (1 - CONFIG.ascii.smoothing);
        this.previousLuma[pixelIndex] = luma;
        if (luma < 0.028) continue;
        const edge = clamp(0.72 + (y / this.rows) * 0.28, 0, 1);
        const charIndex = Math.min(this.chars.length - 1, Math.floor(luma * edge * this.chars.length * 1.12));
        const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
        const color = `rgb(${clamp(red * 1.14 + 12, 0, 255)}, ${clamp(green * 1.12 + 10, 0, 255)}, ${clamp(blue * 1.16 + 14, 0, 255)})`;
        this.context.fillStyle = saturation < 12 ? '#fff4f8' : color;
        this.context.fillText(this.chars[charIndex], x * cellW + cellW / 2, y * cellH);
      }
    }
  }

  dispose() {
    this.target.dispose();
    this.renderer.dispose();
  }
}
