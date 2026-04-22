export interface GenerateRequest {
  sketch: string; // data URL or base64 PNG
  prompt: string;
  width?: number;
  height?: number;
  conditioning_scale?: number;
  seed?: number;
}

export interface GenerateResponse {
  image: string; // base64 PNG (no data: prefix)
  width: number;
  height: number;
  seconds: number;
}

export async function generateWallpaper(
  req: GenerateRequest,
  signal?: AbortSignal,
): Promise<GenerateResponse> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.detail ?? ''; } catch { /* ignore */ }
    throw new Error(detail || `Generate failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as GenerateResponse;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}

export function toDataUrl(b64: string): string {
  return b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
}
