interface Props {
  message: string;
  cursor: { x: number; y: number } | null;
  canvasSize: { width: number; height: number };
}

const cellStyle = {
  borderTop: '1px solid #808080',
  borderLeft: '1px solid #808080',
  borderRight: '1px solid #ffffff',
  borderBottom: '1px solid #ffffff',
  padding: '2px 6px',
  height: '100%',
  boxSizing: 'border-box' as const,
  display: 'flex',
  alignItems: 'center',
  fontSize: 11,
  whiteSpace: 'nowrap' as const,
  overflow: 'hidden' as const,
  textOverflow: 'ellipsis' as const,
};

export default function StatusBar({ message, cursor, canvasSize }: Props) {
  return (
    <div
      style={{
        height: 22,
        display: 'grid',
        gridTemplateColumns: '1fr 120px 120px',
        gap: 0,
        background: '#c0c0c0',
        borderTop: '1px solid #808080',
        boxShadow: 'inset 1px 1px 0 #fff',
        padding: 2,
        flex: '0 0 auto',
      }}
    >
      <div style={cellStyle}>{message}</div>
      <div style={{ ...cellStyle, justifyContent: 'flex-start' }}>
        {cursor ? `${cursor.x},${cursor.y}` : ''}
      </div>
      <div style={{ ...cellStyle, justifyContent: 'flex-end' }}>
        {canvasSize.width} x {canvasSize.height}
      </div>
    </div>
  );
}
