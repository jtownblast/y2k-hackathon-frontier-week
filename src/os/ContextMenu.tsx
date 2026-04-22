import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label?: string;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
  bold?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const MENU_WIDTH = 170;

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const clampedX = Math.min(x, window.innerWidth - MENU_WIDTH - 4);
  const clampedY = Math.min(y, window.innerHeight - items.length * 22 - 8);

  return (
    <ul
      ref={ref}
      role="menu"
      className="context-menu"
      style={{
        position: 'fixed',
        left: clampedX,
        top: clampedY,
        zIndex: 10000,
        margin: 0,
        padding: 2,
        minWidth: MENU_WIDTH,
        listStyle: 'none',
        background: '#c0c0c0',
        border: '1px solid',
        borderColor: '#ffffff #808080 #808080 #ffffff',
        boxShadow: '1px 1px 0 #000',
        fontFamily: '"Pixelated MS Sans Serif", "MS Sans Serif", Arial, sans-serif',
        fontSize: 11,
      }}
    >
      {items.map((item, i) => {
        if (item.divider) {
          return (
            <li
              key={i}
              aria-hidden="true"
              style={{
                height: 2,
                margin: '3px 2px',
                borderTop: '1px solid #808080',
                borderBottom: '1px solid #ffffff',
              }}
            />
          );
        }
        return (
          <li
            key={i}
            role="menuitem"
            aria-disabled={item.disabled || undefined}
            onClick={() => {
              if (item.disabled) return;
              item.onClick?.();
              onClose();
            }}
            onMouseEnter={(e) => {
              if (item.disabled) return;
              e.currentTarget.style.background = '#000080';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = item.disabled ? '#808080' : '#000000';
            }}
            style={{
              padding: '3px 20px 3px 22px',
              cursor: 'default',
              color: item.disabled ? '#808080' : '#000000',
              fontWeight: item.bold ? 'bold' : 'normal',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}
