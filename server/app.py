"""FastAPI sidecar: MS Paint sketch + prompt -> Y2K fighting-arena wallpaper.

Wraps the ControlNet scribble pipeline proven out in the sibling sd-lab repo.
Model weights load once at process start; each /api/generate call reuses them.

Run:
    cd server && python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    uvicorn app:app --host 127.0.0.1 --port 8000

Vite proxies /api -> 127.0.0.1:8000 (see vite.config.ts).
"""
from __future__ import annotations

import base64
import io
import time
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import torch
from PIL import Image
from diffusers import (
    ControlNetModel,
    StableDiffusionControlNetPipeline,
    UniPCMultistepScheduler,
)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# -- Config ------------------------------------------------------------------

SD15_CANDIDATES = [
    "stable-diffusion-v1-5/stable-diffusion-v1-5",
    "runwayml/stable-diffusion-v1-5",
    "Lykon/DreamShaper",
    "benjamin-paine/stable-diffusion-v1-5",
]
CONTROLNET_ID = "lllyasviel/control_v11p_sd15_scribble"

# Widescreen output — 768x512 (3:2). SD 1.5's sweet spot above square, and
# stretches cleanly to a 16:9 desktop via CSS background-size: cover.
DEFAULT_WIDTH = 768
DEFAULT_HEIGHT = 512
DEFAULT_STEPS = 35
DEFAULT_GUIDANCE = 7.5
DEFAULT_SCALE = 1.0  # controlnet_conditioning_scale — proven in sd-lab

Y2K_PROMPT_SUFFIX = (
    ", 2D side-scrolling platformer stage background, "
    "solid thick floating platforms with clean flat tops, "
    "wide rectangular ledges the player can stand on, bold platform edges, "
    "empty environment, no characters, no creatures, scenery only, "
    "flat side view, single scene, full screen, game stage background art, "
    "Y2K early 2000s digital art, MS Paint aesthetic, dithered, chunky airbrush, "
    "Windows 98 wallpaper style"
)
NEGATIVE = (
    "characters, people, fighters, player character, sprites, figures, faces, "
    "humanoid, creatures, animals, monkeys, apes, mushrooms with faces, "
    "enemies, NPCs, boss, mascots, hero, Mario, Kirby, Link, Donkey Kong, "
    "thin floor, wisps, smoke platforms, transparent platforms, "
    "top-down, aerial view, bird's eye view, isometric, tiled, grid, "
    "repeating pattern, multiple panels, collage, mosaic, "
    "photorealistic, photograph, deformed, blurry, text, watermark, UI, HUD, score"
)


# -- Model lifecycle ---------------------------------------------------------

def pick_device() -> tuple[str, torch.dtype]:
    if torch.backends.mps.is_available():
        # ControlNet on MPS can NaN at fp16; fp32 is slower but stable.
        return "mps", torch.float32
    if torch.cuda.is_available():
        return "cuda", torch.float16
    return "cpu", torch.float32


def _load_pipeline():
    device, dtype = pick_device()
    print(f"[server] device={device} dtype={dtype}", flush=True)

    controlnet = ControlNetModel.from_pretrained(CONTROLNET_ID, torch_dtype=dtype)

    last_err: Exception | None = None
    pipe = None
    for candidate in SD15_CANDIDATES:
        try:
            print(f"[server] loading base: {candidate}", flush=True)
            pipe = StableDiffusionControlNetPipeline.from_pretrained(
                candidate,
                controlnet=controlnet,
                torch_dtype=dtype,
                safety_checker=None,
                requires_safety_checker=False,
            )
            print(f"[server] base loaded: {candidate}", flush=True)
            break
        except Exception as e:  # try next mirror
            print(f"[server]   failed: {type(e).__name__}: {e}", flush=True)
            last_err = e
    if pipe is None:
        raise RuntimeError(f"No SD 1.5 mirror worked. Last error: {last_err}")

    pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)
    pipe = pipe.to(device)
    pipe.set_progress_bar_config(disable=True)
    return pipe, device


PIPE = None
DEVICE = "cpu"


@asynccontextmanager
async def lifespan(_: FastAPI):
    global PIPE, DEVICE
    t0 = time.time()
    PIPE, DEVICE = _load_pipeline()
    print(f"[server] ready in {time.time() - t0:.1f}s", flush=True)
    yield
    # nothing to tear down — process exit reclaims VRAM


app = FastAPI(lifespan=lifespan, title="y2k-sd-sidecar")

# Open CORS for local dev. Vite proxies same-origin, but direct curl also works.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# -- Schemas -----------------------------------------------------------------


class GenerateRequest(BaseModel):
    sketch: str = Field(..., description="Base64-encoded PNG of the Paint canvas")
    prompt: str = Field(..., description="Short theme, e.g. 'mushroom forest'")
    width: int = Field(DEFAULT_WIDTH, ge=256, le=1024)
    height: int = Field(DEFAULT_HEIGHT, ge=256, le=1024)
    steps: int = Field(DEFAULT_STEPS, ge=10, le=60)
    guidance: float = Field(DEFAULT_GUIDANCE, ge=0.0, le=20.0)
    conditioning_scale: float = Field(DEFAULT_SCALE, ge=0.0, le=2.0)
    seed: Optional[int] = Field(None)


class GenerateResponse(BaseModel):
    image: str  # base64 PNG
    width: int
    height: int
    seconds: float


# -- Image preprocessing -----------------------------------------------------


def decode_b64_png(b64: str) -> Image.Image:
    # Tolerate "data:image/png;base64," prefix the browser may include.
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    raw = base64.b64decode(b64)
    return Image.open(io.BytesIO(raw)).convert("RGB")


def encode_b64_png(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def preprocess_scribble(img: Image.Image, width: int, height: int) -> Image.Image:
    """Paint canvas is black strokes on white; ControlNet scribble wants white
    strokes on black. Threshold + invert, resize to model dims."""
    img = img.convert("L").resize((width, height), Image.NEAREST)
    arr = np.array(img)
    mask = (arr < 200).astype(np.uint8) * 255
    rgb = np.stack([mask, mask, mask], axis=-1)
    return Image.fromarray(rgb)


# -- Routes ------------------------------------------------------------------


@app.get("/api/health")
def health():
    return {
        "ok": PIPE is not None,
        "device": DEVICE,
    }


@app.post("/api/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest) -> GenerateResponse:
    if PIPE is None:
        raise HTTPException(503, "Pipeline not ready yet")

    try:
        raw = decode_b64_png(req.sketch)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(400, f"Invalid sketch PNG: {e}")

    control = preprocess_scribble(raw, req.width, req.height)
    full_prompt = req.prompt.strip() + Y2K_PROMPT_SUFFIX

    seed = req.seed if req.seed is not None else int(torch.seed()) & 0x7FFFFFFF
    generator = torch.Generator(device=DEVICE).manual_seed(seed)

    t0 = time.time()
    out = PIPE(
        prompt=full_prompt,
        negative_prompt=NEGATIVE,
        image=control,
        num_inference_steps=req.steps,
        guidance_scale=req.guidance,
        controlnet_conditioning_scale=req.conditioning_scale,
        width=req.width,
        height=req.height,
        generator=generator,
    ).images[0]
    dt = time.time() - t0
    print(f"[server] generated {req.width}x{req.height} prompt={req.prompt!r} in {dt:.1f}s", flush=True)

    return GenerateResponse(
        image=encode_b64_png(out),
        width=req.width,
        height=req.height,
        seconds=dt,
    )
