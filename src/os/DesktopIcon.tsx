interface Props {
  icon: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export default function DesktopIcon({
  icon,
  label,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
}: Props) {
  return (
    <div
      className="desktop-icon"
      role="button"
      tabIndex={0}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
        onContextMenu(e);
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 4,
        width: 76,
        padding: 4,
        background: 'transparent',
        color: '#ffffff',
        cursor: 'default',
        textAlign: 'center',
      }}
    >
      <img
        src={icon}
        alt=""
        width={32}
        height={32}
        draggable={false}
        style={{
          filter: selected
            ? 'drop-shadow(0 0 0 #000080) brightness(0.75) sepia(1) hue-rotate(200deg) saturate(6)'
            : 'none',
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontFamily: '"Pixelated MS Sans Serif", "MS Sans Serif", Arial, sans-serif',
          color: '#ffffff',
          padding: '1px 3px',
          textShadow: '1px 1px 0 rgba(0,0,0,0.7)',
          background: selected ? '#000080' : 'transparent',
          outline: selected ? '1px dotted #ffffff' : 'none',
          outlineOffset: '-1px',
          maxWidth: 74,
          lineHeight: 1.15,
          wordBreak: 'break-word',
        }}
      >
        {label}
      </span>
    </div>
  );
}
