import { useEffect, useRef, useState } from 'react';

export interface MenuItem {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
  shortcut?: string;
}

export interface MenuDef {
  id: string;
  label: string;
  items: MenuItem[];
}

interface Props {
  menus: MenuDef[];
}

export default function MenuBar({ menus }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div
      ref={barRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 20,
        background: '#c0c0c0',
        borderBottom: '1px solid #808080',
        boxShadow: 'inset 0 -1px 0 #fff',
        paddingLeft: 2,
        flex: '0 0 auto',
        userSelect: 'none',
        position: 'relative',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menus.map((m) => {
        const isOpen = open === m.id;
        return (
          <div key={m.id} style={{ position: 'relative' }}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(isOpen ? null : m.id);
              }}
              onMouseEnter={() => {
                if (open && open !== m.id) setOpen(m.id);
              }}
              style={{
                padding: '2px 8px',
                background: isOpen ? '#000080' : 'transparent',
                color: isOpen ? '#fff' : '#000',
                border: 'none',
                minWidth: 0,
                height: 18,
                fontFamily: 'inherit',
                fontSize: 11,
                cursor: 'default',
              }}
            >
              {renderLabel(m.label)}
            </button>
            {isOpen && (
              <MenuDropdown items={m.items} onClose={() => setOpen(null)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderLabel(label: string) {
  // Underline the first character as the accelerator hint (visual only).
  if (!label) return label;
  return (
    <>
      <span style={{ textDecoration: 'underline' }}>{label[0]}</span>
      {label.slice(1)}
    </>
  );
}

function MenuDropdown({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  return (
    <ul
      role="menu"
      style={{
        position: 'absolute',
        left: 0,
        top: 18,
        zIndex: 50,
        margin: 0,
        padding: 2,
        minWidth: 180,
        listStyle: 'none',
        background: '#c0c0c0',
        border: '1px solid',
        borderColor: '#ffffff #808080 #808080 #ffffff',
        boxShadow: '1px 1px 0 #000',
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
            onMouseDown={(e) => {
              e.preventDefault();
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
              display: 'flex',
              justifyContent: 'space-between',
              gap: 24,
              padding: '3px 20px 3px 22px',
              cursor: 'default',
              color: item.disabled ? '#808080' : '#000000',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span style={{ color: item.disabled ? '#808080' : '#000000' }}>
                {item.shortcut}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
