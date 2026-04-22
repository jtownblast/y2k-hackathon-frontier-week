import { usePaint } from './state';
import { PALETTE } from './tools';

const SWATCH = 18;

export default function ColorPalette() {
  const primary = usePaint((s) => s.primary);
  const secondary = usePaint((s) => s.secondary);
  const setPrimary = usePaint((s) => s.setPrimary);
  const setSecondary = usePaint((s) => s.setSecondary);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 4px',
        background: '#c0c0c0',
        borderTop: '1px solid #fff',
        boxShadow: 'inset 0 1px 0 #808080',
        flex: '0 0 auto',
        userSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Primary/secondary indicator */}
      <div
        style={{
          width: 30,
          height: 34,
          position: 'relative',
          border: '1px solid',
          borderColor: '#808080 #fff #fff #808080',
          background: '#c0c0c0',
          flex: '0 0 auto',
        }}
        aria-label="Current colors"
      >
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 4,
            width: 14,
            height: 14,
            background: primary,
            border: '1px solid #000',
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 13,
            top: 13,
            width: 14,
            height: 14,
            background: secondary,
            border: '1px solid #000',
            zIndex: 1,
          }}
        />
      </div>

      {/* 2x14 swatch grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(14, ${SWATCH}px)`,
          gridTemplateRows: `repeat(2, ${SWATCH}px)`,
          gap: 1,
          padding: 1,
          background: '#808080',
        }}
      >
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.button === 2) setSecondary(color);
              else setPrimary(color);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSecondary(color);
            }}
            style={{
              width: SWATCH,
              height: SWATCH,
              boxSizing: 'border-box',
              padding: 0,
              minWidth: 0,
              minHeight: 0,
              background: color,
              border: '1px solid',
              borderColor: '#fff #808080 #808080 #fff',
              cursor: 'pointer',
              display: 'block',
            }}
          />
        ))}
      </div>
    </div>
  );
}
