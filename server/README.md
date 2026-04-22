# SD sidecar

Local FastAPI service that turns a Paint canvas sketch + a text prompt into a
Y2K fighting-arena wallpaper via Stable Diffusion 1.5 + ControlNet scribble.

Runs alongside the Vite dev server. Vite proxies `/api` requests to
`127.0.0.1:8000` (see `vite.config.ts`).

## First-time setup

Requires Python 3.11+ and Apple Silicon / CUDA for reasonable speed.

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

First run downloads ~5.5 GB of model weights to `~/.cache/huggingface/`
(SD 1.5 + ControlNet v1.1 scribble). Subsequent runs are instant.

## Run

```bash
cd server
source .venv/bin/activate
uvicorn app:app --host 127.0.0.1 --port 8000
```

Wait for `[server] ready in …s` before generating. MPS fp32 @ 768x512 / 35
steps is ~50 s per image.

Health check:

```bash
curl http://127.0.0.1:8000/api/health
```

## Endpoints

**POST `/api/generate`** — JSON:

```json
{
  "sketch": "<base64 PNG of the Paint canvas>",
  "prompt": "mushroom forest",
  "width": 768,
  "height": 512
}
```

Returns `{ image: "<base64 PNG>", seconds: 48.2, width, height }`.
