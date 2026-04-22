let audioEl: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;

export function registerAudioElement(el: HTMLAudioElement | null) {
  audioEl = el;
}

export function getAudioElement(): HTMLAudioElement | null {
  return audioEl;
}

export function getAnalyser(): AnalyserNode | null {
  return analyser;
}

/**
 * Call from a user-gesture handler (click, keydown). Creates the AudioContext
 * and wires analyser → destination. Safe to call multiple times — idempotent
 * once the graph is built. If a previous attempt failed (sourceNode null),
 * retries the wiring without recreating the context.
 */
export function ensureAudioGraph(): void {
  if (!audioEl) return;

  const Ctor: typeof AudioContext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return;

  if (!audioCtx) {
    audioCtx = new Ctor();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
  }

  // Wire source → analyser → destination if not yet done.
  if (!sourceNode) {
    try {
      sourceNode = audioCtx.createMediaElementSource(audioEl);
      sourceNode.connect(analyser!);
      analyser!.connect(audioCtx.destination);
    } catch {
      // createMediaElementSource can only be called once per element.
      // If it throws the element is already owned by another context — ignore.
    }
  }
}

export function resumeAudioContext(): Promise<void> {
  if (!audioCtx) return Promise.resolve();
  if (audioCtx.state === 'suspended') return audioCtx.resume();
  return Promise.resolve();
}
