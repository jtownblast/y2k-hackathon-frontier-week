import { useEffect, useRef, useState } from 'react';
import { generateWallpaper, toDataUrl } from './aiClient';
import { useOS } from '../../os/useOS';
import type { WallpaperMode } from '../../os/useOS';

interface Props {
  sketchDataUrl: string | null;
  onClose: () => void;
}

type Phase = 'idle' | 'generating' | 'done' | 'error';

const THEME_PRESETS: Array<{ label: string; prompt: string }> = [
  { label: 'Mushroom forest', prompt: 'mushroom forest level' },
  { label: 'Sky temple',      prompt: 'sky temple arena with floating stone platforms, clouds and distant mountains' },
  { label: 'Industrial',      prompt: 'industrial construction arena, steel platforms with rivets, warehouse interior, orange and red color scheme' },
  { label: 'Volcano',         prompt: 'volcano arena with obsidian rock platforms, glowing lava background, red and orange sky' },
  { label: 'Ice cavern',      prompt: 'ice cavern arena, crystal platforms, blue frozen background, icicles' },
];

export default function AIGenerateModal({ sketchDataUrl, onClose }: Props) {
  const [prompt, setPrompt] = useState('mushroom forest level');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<{ dataUrl: string; seconds: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const setWallpaper = useOS((s) => s.setWallpaper);

  // Tick elapsed counter while generating so the user knows we're alive.
  useEffect(() => {
    if (phase !== 'generating') return;
    const start = performance.now();
    const id = window.setInterval(() => {
      setElapsed((performance.now() - start) / 1000);
    }, 250);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = async () => {
    if (!sketchDataUrl) {
      setError('Nothing on the canvas to send.');
      setPhase('error');
      return;
    }
    setError(null);
    setOutput(null);
    setElapsed(0);
    setPhase('generating');
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await generateWallpaper(
        { sketch: sketchDataUrl, prompt },
        ac.signal,
      );
      setOutput({ dataUrl: toDataUrl(res.image), seconds: res.seconds });
      setPhase('done');
    } catch (e) {
      if (ac.signal.aborted) return;
      setError((e as Error).message);
      setPhase('error');
    }
  };

  const apply = (mode: WallpaperMode) => {
    if (!output) return;
    setWallpaper(output.dataUrl, mode);
    onClose();
  };

  return (
    <div style={backdrop} onMouseDown={onClose}>
      <div
        className="window"
        style={windowStyle}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="title-bar">
          <div className="title-bar-text">Generate with AI</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="window-body" style={body}>
          <div style={row}>
            <SketchPreview src={sketchDataUrl} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11 }}>
                Theme
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={phase === 'generating'}
                  style={{ width: '100%', marginTop: 2 }}
                  placeholder="e.g., volcano, sky temple, mushroom forest"
                />
              </label>
              <div>
                <div style={{ fontSize: 11, marginBottom: 4 }}>Presets</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {THEME_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      disabled={phase === 'generating'}
                      onClick={() => setPrompt(p.prompt)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              disabled={phase === 'generating' || !sketchDataUrl || !prompt.trim()}
              onClick={run}
            >
              {phase === 'generating' ? 'Generating…' : phase === 'done' ? 'Regenerate' : 'Generate'}
            </button>
            {phase === 'generating' && (
              <span style={{ fontSize: 11, color: '#444' }}>
                {elapsed.toFixed(1)}s — Stable Diffusion takes ~50s per image.
              </span>
            )}
            {phase === 'error' && error && (
              <span style={{ fontSize: 11, color: '#aa0000' }}>{error}</span>
            )}
            {phase === 'done' && output && (
              <span style={{ fontSize: 11, color: '#004400' }}>
                Done in {output.seconds.toFixed(1)}s.
              </span>
            )}
          </div>

          <OutputPreview output={output} />

          {output && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => apply('fit')}>
                Set As Wallpaper (Fit)
              </button>
              <button type="button" onClick={() => apply('centered')}>
                Set As Wallpaper (Centered)
              </button>
              <button type="button" onClick={() => apply('tiled')}>
                Set As Wallpaper (Tiled)
              </button>
              <button type="button" onClick={onClose}>Close</button>
            </div>
          )}
          {!output && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SketchPreview({ src }: { src: string | null }) {
  return (
    <div style={previewBox}>
      {src ? (
        <img src={src} alt="Current canvas" style={previewImg} />
      ) : (
        <span style={{ color: '#888', fontSize: 10 }}>empty canvas</span>
      )}
      <div style={previewLabel}>Sketch input</div>
    </div>
  );
}

function OutputPreview({ output }: { output: { dataUrl: string; seconds: number } | null }) {
  if (!output) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...previewBox, width: 512, height: 'auto', aspectRatio: '3 / 2' }}>
        <img
          src={output.dataUrl}
          alt="Generated wallpaper"
          style={{ ...previewImg, imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}

// -- styles ------------------------------------------------------------------

const backdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const windowStyle: React.CSSProperties = {
  width: 560,
  maxWidth: '92vw',
  maxHeight: '90vh',
  overflow: 'auto',
};

const body: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const row: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'stretch',
};

const previewBox: React.CSSProperties = {
  width: 160,
  height: 112,
  border: '2px inset #c0c0c0',
  background: '#fff',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flex: '0 0 auto',
};

const previewImg: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
};

const previewLabel: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '1px 4px',
  background: 'rgba(0,0,0,0.6)',
  color: '#fff',
  fontSize: 9,
  textAlign: 'center',
};
