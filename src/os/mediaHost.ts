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
 * Must be invoked from a user gesture. Creates the AudioContext + analyser graph
 * lazily and only once per audio element. A MediaElementAudioSourceNode can only
 * be created ONCE per `<audio>`, so we keep `audioEl` stable for the session.
 */
export function ensureAudioGraph(): void {
  if (!audioEl || audioCtx) return;
  const Ctor: typeof AudioContext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return;
  audioCtx = new Ctor();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.75;
  sourceNode = audioCtx.createMediaElementSource(audioEl);
  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);
}

export function resumeAudioContext(): Promise<void> {
  if (!audioCtx) return Promise.resolve();
  if (audioCtx.state === 'suspended') return audioCtx.resume();
  return Promise.resolve();
}
