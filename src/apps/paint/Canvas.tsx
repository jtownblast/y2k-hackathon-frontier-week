import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { usePaint } from './state';
import type { ToolId } from './tools';
import { TOOL_BY_ID } from './tools';

export interface CanvasHandle {
  clear: () => void;
  saveAsPng: () => void;
  undo: () => void;
  redo: () => void;
  invertColors: () => void;
  deleteSelection: () => void;
  exportDataUrl: () => string | null;
}

interface Props {
  width: number;
  height: number;
  onCursor: (p: { x: number; y: number } | null) => void;
  onHint: (hint: string | null) => void;
  onResize: (width: number, height: number) => void;
}

const UNDO_CAP = 10;

const BRUSH_RADIUS = 3;
const ERASER_SIZE = 10;
const AIRBRUSH_RADIUS = 10;
const AIRBRUSH_DENSITY = 10; // dots per tick
const AIRBRUSH_INTERVAL = 30; // ms
const POLYGON_CLOSE_DIST = 8; // px threshold to auto-close
const DOUBLECLICK_MS = 350;

const MIN_CANVAS = 50;
const MAX_CANVAS_W = 2400;
const MAX_CANVAS_H = 1800;

type Point = { x: number; y: number };

type Selection =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'free'; path: Point[]; bounds: { x: number; y: number; w: number; h: number } }
  | null;

const Canvas = forwardRef<CanvasHandle, Props>(function Canvas(
  { width, height, onCursor, onHint, onResize },
  ref,
) {
  const tool = usePaint((s) => s.tool);

  const mainRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const undoStackRef = useRef<Uint8ClampedArray[]>([]);
  const redoStackRef = useRef<Uint8ClampedArray[]>([]);

  // Ephemeral drawing state during a pointer gesture
  const gestureRef = useRef<{
    active: boolean;
    tool: ToolId;
    button: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    curveStage?: 0 | 1 | 2; // 0 = not started; 1 = line drawn, adjusting control 1; 2 = adjusting control 2
    curveEnd?: Point;
    curveControl1?: Point;
    freePath?: Point[];
  }>({
    active: false,
    tool: 'pencil',
    button: 0,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });

  const polygonRef = useRef<{
    vertices: Point[];
    color: string;
    fill: 'outline' | 'filled';
    lastClick: number;
    lastClickX: number;
    lastClickY: number;
  } | null>(null);
  const selectionRef = useRef<Selection>(null);
  const antsAnimRef = useRef<number | null>(null);
  const airbrushIntervalRef = useRef<number | null>(null);

  const getMainCtx = () => mainRef.current!.getContext('2d', { willReadFrequently: true })!;
  const getOverlayCtx = () => overlayRef.current!.getContext('2d')!;

  const snapshot = useCallback((w: number, h: number): Uint8ClampedArray => {
    const ctx = getMainCtx();
    return new Uint8ClampedArray(ctx.getImageData(0, 0, w, h).data);
  }, []);

  const restore = useCallback((buf: Uint8ClampedArray, w: number, h: number) => {
    const ctx = getMainCtx();
    // buf must have length === w*h*4; caller guarantees this.
    const img = new ImageData(new Uint8ClampedArray(buf), w, h);
    ctx.putImageData(img, 0, 0);
  }, []);

  const pushUndo = useCallback(() => {
    undoStackRef.current.push(snapshot(width, height));
    if (undoStackRef.current.length > UNDO_CAP) undoStackRef.current.shift();
    redoStackRef.current.length = 0;
  }, [snapshot, width, height]);

  const clearOverlay = () => {
    const oc = getOverlayCtx();
    oc.clearRect(0, 0, width, height);
  };

  const stopAnts = () => {
    if (antsAnimRef.current !== null) {
      cancelAnimationFrame(antsAnimRef.current);
      antsAnimRef.current = null;
    }
  };

  // Track the current canvas pixel dimensions separately from the latest
  // props so we can snapshot-before-resize correctly.
  const prevSizeRef = useRef<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const main = mainRef.current;
    const overlay = overlayRef.current;
    if (!main || !overlay) return;

    const prev = prevSizeRef.current;
    if (prev === null) {
      // First mount: initialize dimensions + white fill.
      main.width = width;
      main.height = height;
      overlay.width = width;
      overlay.height = height;
      const ctx = main.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      prevSizeRef.current = { w: width, h: height };
      return;
    }
    if (prev.w === width && prev.h === height) return;

    // Resize: snapshot current pixels first, then change dimensions
    // (which clears the canvas), then fill white + restore pixels at (0,0).
    const ctx = main.getContext('2d', { willReadFrequently: true })!;
    const old = ctx.getImageData(0, 0, main.width, main.height);

    main.width = width;
    main.height = height;
    overlay.width = width;
    overlay.height = height;
    const ctxNew = main.getContext('2d')!;
    ctxNew.fillStyle = '#ffffff';
    ctxNew.fillRect(0, 0, width, height);
    ctxNew.putImageData(old, 0, 0);

    prevSizeRef.current = { w: width, h: height };
    selectionRef.current = null;
    stopAnts();
  }, [width, height]);

  useImperativeHandle(
    ref,
    (): CanvasHandle => ({
      clear: () => {
        pushUndo();
        const ctx = getMainCtx();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        selectionRef.current = null;
        stopAnts();
        clearOverlay();
      },
      saveAsPng: () => {
        const canvas = mainRef.current;
        if (!canvas) return;
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'untitled.png';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }, 'image/png');
      },
      undo: () => {
        const stack = undoStackRef.current;
        if (stack.length === 0) return;
        redoStackRef.current.push(snapshot(width, height));
        const prev = stack.pop()!;
        // The snapshot's dimensions match the dims at time of push. If canvas
        // was since resized, skip restoring (safer than corrupting pixels).
        if (prev.length === width * height * 4) restore(prev, width, height);
      },
      redo: () => {
        const stack = redoStackRef.current;
        if (stack.length === 0) return;
        undoStackRef.current.push(snapshot(width, height));
        if (undoStackRef.current.length > UNDO_CAP) undoStackRef.current.shift();
        const next = stack.pop()!;
        if (next.length === width * height * 4) restore(next, width, height);
      },
      invertColors: () => {
        pushUndo();
        const ctx = getMainCtx();
        const img = ctx.getImageData(0, 0, width, height);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i] = 255 - d[i];
          d[i + 1] = 255 - d[i + 1];
          d[i + 2] = 255 - d[i + 2];
        }
        ctx.putImageData(img, 0, 0);
      },
      deleteSelection: () => {
        const sel = selectionRef.current;
        if (!sel) return;
        pushUndo();
        const { secondary } = usePaint.getState();
        const ctx = getMainCtx();
        ctx.fillStyle = secondary;
        if (sel.kind === 'rect') {
          ctx.fillRect(sel.x, sel.y, sel.w, sel.h);
        } else {
          ctx.save();
          ctx.beginPath();
          sel.path.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        selectionRef.current = null;
        stopAnts();
        clearOverlay();
      },
      exportDataUrl: () => mainRef.current?.toDataURL('image/png') ?? null,
    }),
    [width, height, pushUndo, snapshot, restore],
  );

  // -- Helpers -----------------------------------------------------------

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  };

  const paintDot = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    tool: ToolId,
  ) => {
    if (tool === 'pencil') {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    } else if (tool === 'brush') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === 'eraser') {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x - ERASER_SIZE / 2),
        Math.round(y - ERASER_SIZE / 2),
        ERASER_SIZE,
        ERASER_SIZE,
      );
    }
  };

  const paintStroke = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string,
    tool: ToolId,
  ) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    while (true) {
      paintDot(ctx, x, y, color, tool);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  };

  const spray = (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) => {
    ctx.fillStyle = color;
    for (let i = 0; i < AIRBRUSH_DENSITY; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * AIRBRUSH_RADIUS;
      const dx = Math.round(Math.cos(a) * r);
      const dy = Math.round(Math.sin(a) * r);
      ctx.fillRect(cx + dx, cy + dy, 1, 1);
    }
  };

  const pickColor = (x: number, y: number): string => {
    const ctx = getMainCtx();
    const d = ctx.getImageData(Math.max(0, x), Math.max(0, y), 1, 1).data;
    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(d[0])}${toHex(d[1])}${toHex(d[2])}`;
  };

  const floodFill = (sx: number, sy: number, hex: string) => {
    const ctx = getMainCtx();
    const img = ctx.getImageData(0, 0, width, height);
    const d = img.data;
    const parsed = parseHex(hex);
    const idx = (x: number, y: number) => (y * width + x) * 4;
    const start = idx(sx, sy);
    const tr = d[start], tg = d[start + 1], tb = d[start + 2], ta = d[start + 3];
    if (tr === parsed.r && tg === parsed.g && tb === parsed.b && ta === 255) return;
    const stack: number[] = [sx, sy];
    while (stack.length) {
      const y = stack.pop()!;
      const x = stack.pop()!;
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const p = idx(x, y);
      if (d[p] !== tr || d[p + 1] !== tg || d[p + 2] !== tb || d[p + 3] !== ta) continue;
      d[p] = parsed.r;
      d[p + 1] = parsed.g;
      d[p + 2] = parsed.b;
      d[p + 3] = 255;
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    ctx.putImageData(img, 0, 0);
  };

  // ---- Shape drawing (preview overlay OR committed main) --------------

  type Drawer = (
    ctx: CanvasRenderingContext2D,
    color: string,
    fill: 'outline' | 'filled',
  ) => void;

  const drawRect: Drawer = (ctx, color, fill) => {
    const g = gestureRef.current;
    const x = Math.min(g.startX, g.lastX);
    const y = Math.min(g.startY, g.lastY);
    const w = Math.abs(g.lastX - g.startX);
    const h = Math.abs(g.lastY - g.startY);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    if (fill === 'filled') ctx.fillRect(x, y, w, h);
    else ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
  };

  const drawRoundedRect: Drawer = (ctx, color, fill) => {
    const g = gestureRef.current;
    const x = Math.min(g.startX, g.lastX);
    const y = Math.min(g.startY, g.lastY);
    const w = Math.abs(g.lastX - g.startX);
    const h = Math.abs(g.lastY - g.startY);
    const r = Math.min(10, w / 2, h / 2);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1), r);
    } else {
      // Fallback for older browsers
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
    }
    if (fill === 'filled') ctx.fill();
    else ctx.stroke();
  };

  const drawEllipse: Drawer = (ctx, color, fill) => {
    const g = gestureRef.current;
    const cx = (g.startX + g.lastX) / 2;
    const cy = (g.startY + g.lastY) / 2;
    const rx = Math.abs(g.lastX - g.startX) / 2;
    const ry = Math.abs(g.lastY - g.startY) / 2;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (fill === 'filled') ctx.fill();
    else ctx.stroke();
  };

  const drawLine: Drawer = (ctx, color) => {
    const g = gestureRef.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(g.startX + 0.5, g.startY + 0.5);
    ctx.lineTo(g.lastX + 0.5, g.lastY + 0.5);
    ctx.stroke();
  };

  const drawCurvePreview = (ctx: CanvasRenderingContext2D, color: string) => {
    const g = gestureRef.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (g.curveStage === 1 && g.curveEnd) {
      // Quadratic curve with the cursor as the control point
      ctx.moveTo(g.startX + 0.5, g.startY + 0.5);
      ctx.quadraticCurveTo(g.lastX + 0.5, g.lastY + 0.5, g.curveEnd.x + 0.5, g.curveEnd.y + 0.5);
    } else if (g.curveStage === 2 && g.curveEnd && g.curveControl1) {
      // Cubic curve with control1 fixed and control2 = cursor
      ctx.moveTo(g.startX + 0.5, g.startY + 0.5);
      ctx.bezierCurveTo(
        g.curveControl1.x + 0.5,
        g.curveControl1.y + 0.5,
        g.lastX + 0.5,
        g.lastY + 0.5,
        g.curveEnd.x + 0.5,
        g.curveEnd.y + 0.5,
      );
    } else {
      // Stage 0: straight line preview
      ctx.moveTo(g.startX + 0.5, g.startY + 0.5);
      ctx.lineTo(g.lastX + 0.5, g.lastY + 0.5);
    }
    ctx.stroke();
  };

  const commitCurve = (color: string) => {
    const g = gestureRef.current;
    const ctx = getMainCtx();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (g.curveEnd && g.curveControl1) {
      ctx.moveTo(g.startX + 0.5, g.startY + 0.5);
      ctx.bezierCurveTo(
        g.curveControl1.x + 0.5,
        g.curveControl1.y + 0.5,
        g.lastX + 0.5,
        g.lastY + 0.5,
        g.curveEnd.x + 0.5,
        g.curveEnd.y + 0.5,
      );
    } else if (g.curveEnd) {
      ctx.moveTo(g.startX + 0.5, g.startY + 0.5);
      ctx.quadraticCurveTo(g.lastX + 0.5, g.lastY + 0.5, g.curveEnd.x + 0.5, g.curveEnd.y + 0.5);
    }
    ctx.stroke();
  };

  const drawPolygonPreview = (color: string, mouseX: number, mouseY: number, fill: 'outline' | 'filled') => {
    const poly = polygonRef.current;
    if (!poly || poly.vertices.length === 0) return;
    const oc = getOverlayCtx();
    oc.clearRect(0, 0, width, height);
    oc.strokeStyle = color;
    oc.fillStyle = color;
    oc.lineWidth = 1;
    oc.beginPath();
    poly.vertices.forEach((v, i) => {
      if (i === 0) oc.moveTo(v.x + 0.5, v.y + 0.5);
      else oc.lineTo(v.x + 0.5, v.y + 0.5);
    });
    oc.lineTo(mouseX + 0.5, mouseY + 0.5);
    if (fill === 'filled' && poly.vertices.length >= 2) {
      oc.closePath();
      oc.fill();
    } else {
      oc.stroke();
    }
    // Draw small markers at each committed vertex
    poly.vertices.forEach((v) => {
      oc.fillStyle = '#000';
      oc.fillRect(v.x - 1, v.y - 1, 3, 3);
      oc.fillStyle = '#fff';
      oc.fillRect(v.x, v.y, 1, 1);
    });
  };

  const commitPolygon = () => {
    const poly = polygonRef.current;
    if (!poly || poly.vertices.length < 2) return;
    const ctx = getMainCtx();
    ctx.strokeStyle = poly.color;
    ctx.fillStyle = poly.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    poly.vertices.forEach((v, i) => {
      if (i === 0) ctx.moveTo(v.x + 0.5, v.y + 0.5);
      else ctx.lineTo(v.x + 0.5, v.y + 0.5);
    });
    ctx.closePath();
    if (poly.fill === 'filled') ctx.fill();
    else ctx.stroke();
  };

  // ---- Selection marquee ants ------------------------------------------

  const drawSelectionAnts = (offset: number) => {
    const sel = selectionRef.current;
    if (!sel) return;
    const oc = getOverlayCtx();
    oc.clearRect(0, 0, width, height);
    oc.lineWidth = 1;
    oc.setLineDash([4, 4]);
    oc.lineDashOffset = -offset;
    oc.strokeStyle = '#000';
    oc.beginPath();
    if (sel.kind === 'rect') {
      oc.rect(sel.x + 0.5, sel.y + 0.5, sel.w, sel.h);
    } else {
      sel.path.forEach((p, i) => {
        if (i === 0) oc.moveTo(p.x + 0.5, p.y + 0.5);
        else oc.lineTo(p.x + 0.5, p.y + 0.5);
      });
      oc.closePath();
    }
    oc.stroke();
    oc.setLineDash([]);
  };

  const startAnts = () => {
    stopAnts();
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const offset = Math.floor((t - start) / 80);
      drawSelectionAnts(offset);
      antsAnimRef.current = requestAnimationFrame(tick);
    };
    antsAnimRef.current = requestAnimationFrame(tick);
  };

  // ---- Event handlers ---------------------------------------------------

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { tool, primary, secondary, shapeFill } = usePaint.getState();
    const toolDef = TOOL_BY_ID[tool];
    if (!toolDef.implemented) {
      onHint(`${toolDef.name}: not implemented in this demo`);
      return;
    }

    const { x, y } = getPos(e);
    const color = e.button === 2 ? secondary : primary;

    // --- Polygon: independent state machine
    if (tool === 'polygon') {
      const now = performance.now();
      if (!polygonRef.current) {
        polygonRef.current = {
          vertices: [{ x, y }],
          color,
          fill: shapeFill,
          lastClick: now,
          lastClickX: x,
          lastClickY: y,
        };
        drawPolygonPreview(color, x, y, shapeFill);
        return;
      }
      const poly = polygonRef.current;
      const first = poly.vertices[0];
      const isClose =
        Math.hypot(x - first.x, y - first.y) <= POLYGON_CLOSE_DIST &&
        poly.vertices.length >= 3;
      // Double-click = two clicks in quick succession at (nearly) the same position.
      const sameSpot = Math.hypot(x - poly.lastClickX, y - poly.lastClickY) <= 4;
      const isDoubleClick = now - poly.lastClick < DOUBLECLICK_MS && sameSpot;
      poly.lastClick = now;
      poly.lastClickX = x;
      poly.lastClickY = y;
      if (isClose || isDoubleClick) {
        if (poly.vertices.length >= 3) {
          pushUndo();
          clearOverlay();
          commitPolygon();
        } else {
          clearOverlay();
        }
        polygonRef.current = null;
        return;
      }
      poly.vertices.push({ x, y });
      drawPolygonPreview(poly.color, x, y, poly.fill);
      return;
    }

    // If a polygon was in progress when a non-polygon pointerdown arrives, cancel it.
    if (polygonRef.current) {
      polygonRef.current = null;
      clearOverlay();
    }

    // --- Curve: multi-stage
    if (tool === 'curve') {
      const g = gestureRef.current;
      if (g.curveStage === 1) {
        // Second click: lock control1, start adjusting control2 (stage 2)
        g.curveControl1 = { x, y };
        g.curveStage = 2;
        // Treat as an active gesture so pointermove updates preview.
        g.active = true;
        g.button = e.button;
        g.lastX = x;
        g.lastY = y;
        overlayRef.current?.setPointerCapture(e.pointerId);
        return;
      }
      // Stage 0 → draw straight line preview, capture endpoints
      overlayRef.current?.setPointerCapture(e.pointerId);
      gestureRef.current = {
        active: true,
        tool: 'curve',
        button: e.button,
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        curveStage: 0,
      };
      drawCurvePreview(getOverlayCtx(), color);
      return;
    }

    // --- Selection tools
    if (tool === 'select-rect' || tool === 'select-free') {
      // Clicking outside an existing selection clears it
      selectionRef.current = null;
      stopAnts();
      clearOverlay();

      overlayRef.current?.setPointerCapture(e.pointerId);
      gestureRef.current = {
        active: true,
        tool,
        button: e.button,
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        freePath: tool === 'select-free' ? [{ x, y }] : undefined,
      };
      return;
    }

    // --- Airbrush: scatter dots at interval while held
    if (tool === 'airbrush') {
      pushUndo();
      overlayRef.current?.setPointerCapture(e.pointerId);
      gestureRef.current = {
        active: true,
        tool: 'airbrush',
        button: e.button,
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
      };
      spray(getMainCtx(), x, y, color);
      airbrushIntervalRef.current = window.setInterval(() => {
        const g = gestureRef.current;
        if (!g.active) return;
        spray(getMainCtx(), g.lastX, g.lastY, color);
      }, AIRBRUSH_INTERVAL);
      return;
    }

    // --- Generic "start gesture" block for pencil/brush/eraser/line/rect/ellipse/rounded/fill/eyedropper
    overlayRef.current?.setPointerCapture(e.pointerId);
    gestureRef.current = {
      active: true,
      tool,
      button: e.button,
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
    };

    if (tool === 'eyedropper') {
      const picked = pickColor(x, y);
      if (e.button === 2) usePaint.getState().setSecondary(picked);
      else usePaint.getState().setPrimary(picked);
      return;
    }

    if (tool === 'fill') {
      pushUndo();
      floodFill(x, y, color);
      return;
    }

    if (tool === 'pencil' || tool === 'brush') {
      pushUndo();
      paintDot(getMainCtx(), x, y, color, tool);
      return;
    }

    if (tool === 'eraser') {
      pushUndo();
      paintDot(getMainCtx(), x, y, secondary, 'eraser');
      return;
    }

    if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse' || tool === 'rounded-rect') {
      const oc = getOverlayCtx();
      oc.clearRect(0, 0, width, height);
      if (tool === 'line') drawLine(oc, color, shapeFill);
      else if (tool === 'rectangle') drawRect(oc, color, shapeFill);
      else if (tool === 'ellipse') drawEllipse(oc, color, shapeFill);
      else drawRoundedRect(oc, color, shapeFill);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getPos(e);
    onCursor({ x, y });

    // Polygon: preview follows cursor even without active gesture
    if (polygonRef.current) {
      const poly = polygonRef.current;
      drawPolygonPreview(poly.color, x, y, poly.fill);
    }

    const g = gestureRef.current;
    if (!g.active) return;

    const { primary, secondary, shapeFill } = usePaint.getState();
    const color = g.button === 2 ? secondary : primary;

    if (g.tool === 'pencil' || g.tool === 'brush') {
      paintStroke(getMainCtx(), g.lastX, g.lastY, x, y, color, g.tool);
      g.lastX = x;
      g.lastY = y;
      return;
    }

    if (g.tool === 'eraser') {
      paintStroke(getMainCtx(), g.lastX, g.lastY, x, y, secondary, 'eraser');
      g.lastX = x;
      g.lastY = y;
      return;
    }

    if (g.tool === 'airbrush') {
      g.lastX = x;
      g.lastY = y;
      spray(getMainCtx(), x, y, color);
      return;
    }

    if (g.tool === 'line' || g.tool === 'rectangle' || g.tool === 'ellipse' || g.tool === 'rounded-rect') {
      g.lastX = x;
      g.lastY = y;
      const oc = getOverlayCtx();
      oc.clearRect(0, 0, width, height);
      if (g.tool === 'line') drawLine(oc, color, shapeFill);
      else if (g.tool === 'rectangle') drawRect(oc, color, shapeFill);
      else if (g.tool === 'ellipse') drawEllipse(oc, color, shapeFill);
      else drawRoundedRect(oc, color, shapeFill);
      return;
    }

    if (g.tool === 'curve') {
      g.lastX = x;
      g.lastY = y;
      const oc = getOverlayCtx();
      oc.clearRect(0, 0, width, height);
      drawCurvePreview(oc, color);
      return;
    }

    if (g.tool === 'select-rect') {
      g.lastX = x;
      g.lastY = y;
      const oc = getOverlayCtx();
      oc.clearRect(0, 0, width, height);
      oc.setLineDash([4, 4]);
      oc.strokeStyle = '#000';
      oc.lineWidth = 1;
      const rx = Math.min(g.startX, x);
      const ry = Math.min(g.startY, y);
      const rw = Math.abs(x - g.startX);
      const rh = Math.abs(y - g.startY);
      oc.strokeRect(rx + 0.5, ry + 0.5, rw, rh);
      oc.setLineDash([]);
      return;
    }

    if (g.tool === 'select-free') {
      g.lastX = x;
      g.lastY = y;
      if (g.freePath) g.freePath.push({ x, y });
      const oc = getOverlayCtx();
      oc.clearRect(0, 0, width, height);
      oc.setLineDash([4, 4]);
      oc.strokeStyle = '#000';
      oc.lineWidth = 1;
      oc.beginPath();
      (g.freePath ?? []).forEach((p, i) => {
        if (i === 0) oc.moveTo(p.x + 0.5, p.y + 0.5);
        else oc.lineTo(p.x + 0.5, p.y + 0.5);
      });
      oc.stroke();
      oc.setLineDash([]);
      return;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gestureRef.current;
    if (!g.active) return;
    const { x, y } = getPos(e);
    try { overlayRef.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }

    const { primary, secondary, shapeFill } = usePaint.getState();
    const color = g.button === 2 ? secondary : primary;

    if (g.tool === 'airbrush') {
      if (airbrushIntervalRef.current !== null) {
        clearInterval(airbrushIntervalRef.current);
        airbrushIntervalRef.current = null;
      }
      gestureRef.current = { ...g, active: false };
      return;
    }

    if (g.tool === 'line') {
      pushUndo();
      clearOverlay();
      drawLine(getMainCtx(), color, shapeFill);
    } else if (g.tool === 'rectangle') {
      pushUndo();
      clearOverlay();
      drawRect(getMainCtx(), color, shapeFill);
    } else if (g.tool === 'ellipse') {
      pushUndo();
      clearOverlay();
      drawEllipse(getMainCtx(), color, shapeFill);
    } else if (g.tool === 'rounded-rect') {
      pushUndo();
      clearOverlay();
      drawRoundedRect(getMainCtx(), color, shapeFill);
    } else if (g.tool === 'curve') {
      if (g.curveStage === 0) {
        // Line drawn; wait for the first control click
        g.curveEnd = { x: g.lastX, y: g.lastY };
        g.curveStage = 1;
        g.active = false;
        return;
      }
      if (g.curveStage === 2) {
        // Second control committed; finalize.
        pushUndo();
        clearOverlay();
        commitCurve(color);
        gestureRef.current = { active: false, tool: 'curve', button: 0, startX: 0, startY: 0, lastX: 0, lastY: 0 };
        return;
      }
    } else if (g.tool === 'select-rect') {
      const rx = Math.min(g.startX, x);
      const ry = Math.min(g.startY, y);
      const rw = Math.abs(x - g.startX);
      const rh = Math.abs(y - g.startY);
      if (rw > 1 && rh > 1) {
        selectionRef.current = { kind: 'rect', x: rx, y: ry, w: rw, h: rh };
        startAnts();
      } else {
        clearOverlay();
      }
    } else if (g.tool === 'select-free') {
      const path = g.freePath ?? [];
      if (path.length > 2) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of path) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
        selectionRef.current = {
          kind: 'free',
          path,
          bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
        };
        startAnts();
      } else {
        clearOverlay();
      }
    }

    gestureRef.current = { ...g, active: false, freePath: undefined };
  };

  const onPointerLeave = () => {
    onCursor(null);
  };

  // Listen for Delete/Backspace when a selection is active, and Escape to
  // cancel polygon / curve in progress.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (polygonRef.current) {
          polygonRef.current = null;
          clearOverlay();
          e.preventDefault();
          return;
        }
        if (gestureRef.current.tool === 'curve' && gestureRef.current.curveStage) {
          gestureRef.current = { active: false, tool: 'curve', button: 0, startX: 0, startY: 0, lastX: 0, lastY: 0 };
          clearOverlay();
          e.preventDefault();
          return;
        }
        if (selectionRef.current) {
          selectionRef.current = null;
          stopAnts();
          clearOverlay();
          e.preventDefault();
          return;
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear polygon/curve state when switching tools.
  useEffect(() => {
    if (tool !== 'polygon' && polygonRef.current) {
      polygonRef.current = null;
      clearOverlay();
    }
    if (tool !== 'curve' && gestureRef.current.curveStage) {
      gestureRef.current = { active: false, tool: 'curve', button: 0, startX: 0, startY: 0, lastX: 0, lastY: 0 };
      clearOverlay();
    }
    // When switching off a selection tool, keep the selection marquee.
    // When switching TO a drawing tool, clear selection so pointer events go to canvas.
    if (tool !== 'select-rect' && tool !== 'select-free' && selectionRef.current) {
      selectionRef.current = null;
      stopAnts();
      clearOverlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  return (
    <div
      style={{
        position: 'relative',
        width: width + 8,
        height: height + 8,
        margin: '4px 0 0 4px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          boxShadow: '1px 1px 0 #fff, -1px -1px 0 #808080',
          border: '1px solid #000',
          background: '#fff',
          boxSizing: 'content-box',
        }}
      />
      <canvas
        ref={mainRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'block',
          width,
          height,
        }}
      />
      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'block',
          width,
          height,
          cursor: cursorForTool(tool),
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      <ResizeHandles width={width} height={height} onResize={onResize} />
    </div>
  );
});

export default Canvas;

// ---- Resize handles --------------------------------------------------------

interface ResizeHandlesProps {
  width: number;
  height: number;
  onResize: (w: number, h: number) => void;
}

function ResizeHandles({ width, height, onResize }: ResizeHandlesProps) {
  // Three draggable handles: right (horizontal), bottom (vertical),
  // bottom-right (both). The other three (top, top-right, left) are cosmetic.
  return (
    <>
      <CosmeticHandle left={width / 2} top={0} />
      <CosmeticHandle left={width} top={0} />
      <CosmeticHandle left={0} top={height / 2} />
      <DragHandle
        left={width}
        top={height / 2}
        axis="x"
        width={width}
        height={height}
        onResize={onResize}
      />
      <DragHandle
        left={width / 2}
        top={height}
        axis="y"
        width={width}
        height={height}
        onResize={onResize}
      />
      <DragHandle
        left={width}
        top={height}
        axis="xy"
        width={width}
        height={height}
        onResize={onResize}
      />
    </>
  );
}

function CosmeticHandle({ left, top }: { left: number; top: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: left - 3,
        top: top - 3,
        width: 5,
        height: 5,
        background: '#000080',
        border: '1px solid #000',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
  );
}

function DragHandle({
  left,
  top,
  axis,
  width,
  height,
  onResize,
}: {
  left: number;
  top: number;
  axis: 'x' | 'y' | 'xy';
  width: number;
  height: number;
  onResize: (w: number, h: number) => void;
}) {
  const startRef = useRef<{ clientX: number; clientY: number; w: number; h: number } | null>(null);

  const cursor = axis === 'x' ? 'ew-resize' : axis === 'y' ? 'ns-resize' : 'nwse-resize';

  return (
    <div
      style={{
        position: 'absolute',
        left: left - 4,
        top: top - 4,
        width: 7,
        height: 7,
        background: '#000080',
        border: '1px solid #000',
        cursor,
        zIndex: 4,
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // setPointerCapture on a tiny handle with a synthetic-event pointerId
        // can throw InvalidStateError in some browsers; fall through — real
        // mouse drags don't need explicit capture since pointermove still
        // bubbles to the root React listener.
        try { (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
        startRef.current = { clientX: e.clientX, clientY: e.clientY, w: width, h: height };
      }}
      onPointerMove={(e) => {
        const s = startRef.current;
        if (!s) return;
        const dx = e.clientX - s.clientX;
        const dy = e.clientY - s.clientY;
        let nw = s.w;
        let nh = s.h;
        if (axis === 'x' || axis === 'xy') nw = Math.round(clamp(s.w + dx, MIN_CANVAS, MAX_CANVAS_W));
        if (axis === 'y' || axis === 'xy') nh = Math.round(clamp(s.h + dy, MIN_CANVAS, MAX_CANVAS_H));
        onResize(nw, nh);
      }}
      onPointerUp={(e) => {
        try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
        startRef.current = null;
      }}
    />
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const v =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function cursorForTool(tool: ToolId): string {
  switch (tool) {
    case 'select-rect':
    case 'select-free':
      return 'crosshair';
    default:
      return 'crosshair';
  }
}
