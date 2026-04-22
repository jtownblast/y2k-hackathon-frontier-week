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
          padding: '4px 2px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          background: 'linear-gradient(180deg, #d8d8ff 0%, #a0a0ff 50%, #7070d0 100%)',
          border: '1px solid',
          borderColor: '#fff #404080 #404080 #fff',
          cursor: 'pointer',
          flex: '0 0 auto',
        }}
      >
        <SparkleIcon />
        <span style={{ fontSize: 10, fontWeight: 'bold', color: '#000040' }}>AI</span>
      </button>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width={24} height={16} viewBox="0 0 24 16" aria-hidden="true">
      {/* Chunky sparkle — big star + two smaller satellites, Y2K-ish */}
      <g fill="#ffff80" stroke="#000040" strokeWidth={0.8} strokeLinejoin="round">
        <path d="M12 1 L13.5 7 L19 8 L13.5 9 L12 15 L10.5 9 L5 8 L10.5 7 Z" />
        <path d="M4 3 L4.7 5 L6.5 5.5 L4.7 6 L4 8 L3.3 6 L1.5 5.5 L3.3 5 Z" />
        <path d="M20 10 L20.7 12 L22.5 12.5 L20.7 13 L20 15 L19.3 13 L17.5 12.5 L19.3 12 Z" />
      </g>
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
