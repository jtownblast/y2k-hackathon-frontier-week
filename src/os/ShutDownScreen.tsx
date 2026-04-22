export default function ShutDownScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        color: '#ff8800',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30000,
        fontFamily: '"Pixelated MS Sans Serif", "MS Sans Serif", Arial, sans-serif',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 'bold',
          lineHeight: 1.5,
          textShadow: '0 0 6px rgba(255, 136, 0, 0.6)',
          letterSpacing: 1,
        }}
      >
        It&apos;s now safe to turn off
        <br />
        your computer.
      </div>
    </div>
  );
}
