interface StatusBarProps {
  playerCount: number;
}

export default function StatusBar({ playerCount }: StatusBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 8px',
        borderTop: '1px solid #808080',
        background: '#c0c0c0',
        fontSize: 12,
      }}
    >
      <span>Controls: W A S D · Space · K</span>
      <span>Players: {playerCount}</span>
    </div>
  );
}
