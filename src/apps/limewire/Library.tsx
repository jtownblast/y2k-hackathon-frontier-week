import { useFiles } from '../../os/useFiles';
import { useWindows } from '../../os/useWindows';

export default function Library() {
  const library = useFiles((s) => s.musicLibrary);
  const requestPlay = useFiles((s) => s.requestPlay);
  const openWindow = useWindows((s) => s.openWindow);

  const play = (id: string) => {
    requestPlay(id);
    const wmps = Object.values(useWindows.getState().windows).filter(
      (w) => w.appId === 'windows-media-player',
    );
    if (wmps.length === 0) openWindow('windows-media-player');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          background: '#d4d0c8',
          borderBottom: '1px solid #808080',
          padding: '2px 0',
          fontWeight: 700,
          fontSize: 11,
          fontFamily: 'Tahoma, sans-serif',
          color: '#000',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{ flex: '0 0 28px' }} />
        <div style={{ flex: 1, padding: '1px 6px', borderRight: '1px solid #a0a0a0' }}>Filename</div>
        <div style={{ flex: '0 0 120px', padding: '1px 6px', borderRight: '1px solid #a0a0a0' }}>Artist</div>
        <div style={{ flex: '0 0 120px', padding: '1px 6px' }}>Title</div>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
        {library.length === 0 && (
          <div
            style={{
              padding: 16,
              color: '#808080',
              fontSize: 11,
              fontFamily: 'Tahoma, sans-serif',
            }}
          >
            No files yet. Download something from the Search tab!
          </div>
        )}
        {library.map((t, idx) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: idx % 2 === 0 ? '#fff' : '#f0f0f0',
              fontSize: 11,
              fontFamily: 'Tahoma, sans-serif',
              userSelect: 'none',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = '#cce5ff')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background =
                idx % 2 === 0 ? '#fff' : '#f0f0f0')
            }
          >
            <div style={{ flex: '0 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                title="Play in Windows Media Player"
                onClick={() => play(t.id)}
                style={{
                  width: 18,
                  height: 16,
                  padding: 0,
                  fontSize: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: 'linear-gradient(180deg, #6692d9 0%, #294a9a 100%)',
                  color: '#fff',
                  border: '1px solid #0a1e4a',
                  fontFamily: 'Tahoma, sans-serif',
                }}
              >
                ▶
              </button>
            </div>
            <div
              style={{
                flex: 1,
                padding: '2px 6px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                borderLeft: '1px solid #e0e0e0',
              }}
              title={t.filename}
            >
              {t.filename}
            </div>
            <div
              style={{
                flex: '0 0 120px',
                padding: '2px 6px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                borderLeft: '1px solid #e0e0e0',
              }}
            >
              {t.artist}
            </div>
            <div
              style={{
                flex: '0 0 120px',
                padding: '2px 6px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                borderLeft: '1px solid #e0e0e0',
              }}
            >
              {t.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
