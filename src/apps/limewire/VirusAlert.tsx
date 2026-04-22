interface Props {
  filename: string;
  onClose: () => void;
}

export default function VirusAlert({ filename, onClose }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        fontFamily: 'Tahoma, sans-serif',
      }}
    >
      <div className="window" style={{ width: 360, color: '#000' }}>
        <div className="title-bar">
          <div className="title-bar-text">Norton AntiVirus</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="window-body" style={{ padding: 14 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: 'radial-gradient(circle at 50% 50%, #ff4444 0%, #cc0000 60%, #880000 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: '#fff',
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              !
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                NORTON ANTIVIRUS
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.5 }}>
                <strong>47 threats detected on your computer!</strong>
                <br />
                The file <em style={{ color: '#880000' }}>{filename}</em> contains
                a known virus signature (W32.Klez.H@mm).
                <br />
                <br />
                Your computer may be at risk. Purchase Norton AntiVirus 2004
                to remove all threats now!
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button
              onClick={onClose}
              style={{
                minWidth: 90,
                background: 'linear-gradient(180deg, #ff6b6b 0%, #cc0000 100%)',
                color: '#fff',
                border: '1px solid #880000',
                fontWeight: 700,
                fontFamily: 'Tahoma, sans-serif',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Clean now
            </button>
            <button onClick={onClose} style={{ minWidth: 70 }}>
              Ignore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
