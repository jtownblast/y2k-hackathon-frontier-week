import { useEffect, useRef } from 'react';
import { getAnalyser } from '../../os/mediaHost';
import { useMediaPlayer } from './state';
import type { Visualization } from './state';

interface Props {
  fullscreen?: boolean;
}

interface ColorScheme {
  bg: string;
  stops: [number, string][];
  accent: string;
}

const SCHEMES: Record<Visualization, ColorScheme> = {
  bars: {
    bg: '#000',
    stops: [
      [0, '#00ff66'],
      [0.6, '#ffee00'],
      [1, '#ff3030'],
    ],
    accent: '#00ff66',
  },
  battery: {
    bg: '#000810',
    stops: [
      [0, '#00ccff'],
      [0.6, '#4488ff'],
      [1, '#0033aa'],
    ],
    accent: '#00ccff',
  },
  'ocean-mist': {
    bg: '#02121a',
    stops: [
      [0, '#66fff0'],
      [0.5, '#4494c9'],
      [1, '#21347a'],
    ],
    accent: '#66fff0',
  },
  plenoptic: {
    bg: '#100018',
    stops: [
      [0, '#ff00ff'],
      [0.5, '#aa33ff'],
      [1, '#3300aa'],
    ],
    accent: '#ff66ff',
  },
};

export default function Visualizer({ fullscreen = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visualization = useMediaPlayer((s) => s.visualization);
  const isPlaying = useMediaPlayer((s) => s.isPlaying);
  const currentTrackId = useMediaPlayer((s) => s.currentTrackId);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const fit = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);

    let tick = 0;

    const draw = () => {
      if (cancelled) return;
      tick++;
      const scheme = SCHEMES[useMediaPlayer.getState().visualization];
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.fillStyle = scheme.bg;
      ctx.fillRect(0, 0, w, h);

      const analyser = getAnalyser();
      let freqs: number[];
      if (analyser) {
        const count = analyser.frequencyBinCount;
        const arr = new Uint8Array(count);
        analyser.getByteFrequencyData(arr);
        freqs = Array.from(arr);
      } else {
        freqs = Array.from({ length: 64 }, (_, i) => {
          const base = Math.sin(tick * 0.05 + i * 0.35) * 20 + 30;
          return Math.max(0, base);
        });
      }

      const barCount = Math.min(48, freqs.length);
      const step = Math.max(1, Math.floor(freqs.length / barCount));
      const padding = fullscreen ? 12 : 6;
      const gap = fullscreen ? 4 : 2;
      const usableW = w - padding * 2;
      const barW = (usableW - gap * (barCount - 1)) / barCount;
      const maxH = h - padding * 2;

      const grad = ctx.createLinearGradient(0, h - padding, 0, padding);
      for (const [stop, color] of scheme.stops) grad.addColorStop(stop, color);

      const chunkSize = fullscreen ? 6 : 4;

      for (let i = 0; i < barCount; i++) {
        const value = freqs[i * step] ?? 0;
        let height = (value / 255) * maxH;
        height = Math.max(1, Math.floor(height / chunkSize) * chunkSize);
        const x = padding + i * (barW + gap);
        const y = h - padding - height;
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barW, height);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x, y, Math.max(1, barW * 0.3), height);
      }

      if (!useMediaPlayer.getState().currentTrackId) {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '11px Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Drag a file here or use File > Open', w / 2, h / 2);
      }

      timerId = setTimeout(() => {
        if (!cancelled) rafId = requestAnimationFrame(draw);
      }, 33);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (timerId !== null) clearTimeout(timerId);
      ro.disconnect();
    };
  }, [fullscreen]);

  void visualization;
  void isPlaying;
  void currentTrackId;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
