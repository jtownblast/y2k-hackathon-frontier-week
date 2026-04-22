import { usePaint } from './state';
import { TOOLS, ToolIcon, type ToolId } from './tools';

interface Props {
  onHint: (hint: string | null) => void;
  onAIGenerate: () => void;
}

const TOOL_BTN = 36;

const SHAPE_TOOLS: ToolId[] = ['line', 'rectangle', 'ellipse'];

export default function Toolbox({ onHint, onAIGenerate }: Props) {
  const tool = usePaint((s) => s.tool);
  const setTool = usePaint((s) => s.setTool);
  const shapeFill = usePaint((s) => s.shapeFill);
  const setShapeFill = usePaint((s) => s.setShapeFill);

  const showShapeOptions = SHAPE_TOOLS.includes(tool) && tool !== 'line';

  return (
    <div
      style={{
        width: TOOL_BTN * 2 + 8,
        flex: '0 0 auto',
        padding: 4,
        background: '#c0c0c0',
        borderRight: '1px solid #808080',
        boxShadow: 'inset -1px 0 0 #fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        userSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 2 x 8 tool grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(2, ${TOOL_BTN}px)`,
          gap: 0,
        }}
      >
        {TOOLS.map((t) => {
          const active = t.id === tool;
          return (
            <button
              key={t.id}
              type="button"
              aria-label={t.name}
              title={t.name}
              onClick={() => setTool(t.id)}
              onMouseEnter={() => onHint(t.hint)}
              onMouseLeave={() => onHint(null)}
              style={{
                width: TOOL_BTN,
                height: TOOL_BTN,
                padding: 0,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? '#808080' : '#c0c0c0',
                border: '1px solid',
                borderColor: active
                  ? '#000 #fff #fff #000'
                  : '#fff #808080 #808080 #fff',
                cursor: 'pointer',
                boxShadow: active ? 'inset 1px 1px 0 #000' : undefined,
                opacity: t.implemented ? 1 : 0.8,
              }}
            >
              <ToolIcon spriteIndex={t.spriteIndex} />
            </button>
          );
        })}
      </div>

      {/* Tool options sub-panel */}
      <div
        style={{
          width: TOOL_BTN * 2,
          minHeight: 56,
          border: '1px solid',
          borderColor: '#808080 #fff #fff #808080',
          background: '#c0c0c0',
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          flex: '0 0 auto',
        }}
      >
        {showShapeOptions ? (
          <>
            <button
              type="button"
              aria-pressed={shapeFill === 'outline'}
              onClick={() => setShapeFill('outline')}
              style={fillOptionStyle(shapeFill === 'outline')}
              title="Outline"
            >
              <svg viewBox="0 0 24 14" width={24} height={14}>
                <rect x="2" y="2" width="20" height="10" fill="none" stroke="#000" />
              </svg>
            </button>
            <button
              type="button"
              aria-pressed={shapeFill === 'filled'}
              onClick={() => setShapeFill('filled')}
              style={fillOptionStyle(shapeFill === 'filled')}
              title="Filled"
            >
              <svg viewBox="0 0 24 14" width={24} height={14}>
                <rect x="2" y="2" width="20" height="10" fill="#000" />
              </svg>
            </button>
          </>
        ) : (
          <div style={{ opacity: 0.5, fontSize: 10, textAlign: 'center' }}>
            {/* intentional blank when no options */}
          </div>
        )}
      </div>

      {/* AI Generate — turns the canvas sketch into a Y2K wallpaper via SD */}
      <button
        type="button"
        aria-label="Generate with AI"
        title="Generate with AI"
        onClick={onAIGenerate}
        onMouseEnter={() => onHint('Sends the canvas through Stable Diffusion to create a wallpaper.')}
        onMouseLeave={() => onHint(null)}
        style={{
          width: TOOL_BTN * 2,
          height: TOOL_BTN,
          padding: 0,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#c0c0c0',
          border: '1px solid',
          borderColor: '#fff #808080 #808080 #fff',
          cursor: 'pointer',
          flex: '0 0 auto',
        }}
      >
        <WandIcon />
      </button>
    </div>
  );
}

function WandIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 16 16" aria-hidden="true" style={{ imageRendering: 'pixelated' }}>
      {/* wand shaft */}
      <rect x="9" y="5"  width="1" height="1" fill="#000" />
      <rect x="8" y="6"  width="1" height="1" fill="#000" />
      <rect x="7" y="7"  width="1" height="1" fill="#000" />
      <rect x="6" y="8"  width="1" height="1" fill="#000" />
      <rect x="5" y="9"  width="1" height="1" fill="#000" />
      <rect x="4" y="10" width="1" height="1" fill="#000" />
      <rect x="3" y="11" width="1" height="1" fill="#000" />
      {/* wand handle highlight */}
      <rect x="4" y="11" width="1" height="1" fill="#808080" />
      <rect x="3" y="12" width="1" height="1" fill="#808080" />
      {/* 4-point star at tip */}
      <rect x="10" y="2"  width="1" height="3" fill="#000" />
      <rect x="9"  y="3"  width="3" height="1" fill="#000" />
      <rect x="10" y="3"  width="1" height="1" fill="#ffff00" />
      {/* small sparkles */}
      <rect x="13" y="5"  width="1" height="1" fill="#000" />
      <rect x="12" y="6"  width="3" height="1" fill="#000" />
      <rect x="13" y="6"  width="1" height="1" fill="#ffff00" />
      <rect x="13" y="7"  width="1" height="1" fill="#000" />
      <rect x="7"  y="3"  width="1" height="1" fill="#000" />
      <rect x="6"  y="4"  width="3" height="1" fill="#000" />
      <rect x="7"  y="4"  width="1" height="1" fill="#ffff00" />
      <rect x="7"  y="5"  width="1" height="1" fill="#000" />
    </svg>
  );
}

function fillOptionStyle(active: boolean): React.CSSProperties {
  return {
    width: 40,
    height: 20,
    padding: 0,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? '#808080' : '#c0c0c0',
    border: '1px solid',
    borderColor: active ? '#000 #fff #fff #000' : '#fff #808080 #808080 #fff',
    cursor: 'pointer',
  };
}
