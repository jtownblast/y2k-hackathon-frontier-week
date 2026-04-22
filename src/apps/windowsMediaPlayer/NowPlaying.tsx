import { ensureAudioGraph, resumeAudioContext } from '../../os/mediaHost';
import { useMediaPlayer } from './state';
import type { Visualization } from './state';
import { useFiles } from '../../os/useFiles';

const VIZ_OPTIONS: { value: Visualization; label: string }[] = [
  { value: 'bars', label: 'Bars' },
  { value: 'battery', label: 'Battery' },
  { value: 'ocean-mist', label: 'Ocean Mist' },
  { value: 'plenoptic', label: 'Plenoptic' },
];

export default function NowPlaying() {
  const currentTrackId = useMediaPlayer((s) => s.currentTrackId);
  const visualization = useMediaPlayer((s) => s.visualization);
  const setVisualization = useMediaPlayer((s) => s.setVisualization);
  const loadTrack = useMediaPlayer((s) => s.loadTrack);
  const play = useMediaPlayer((s) => s.play);
  const library = useFiles((s) => s.musicLibrary);
  const track = library.find((t) => t.id === currentTrackId) ?? null;

  const artHue = track ? Math.abs(hashString(track.id)) % 360 : 210;

  const handleTrackClick = (id: string) => {
    ensureAudioGraph();
    loadTrack(id);
    void resumeAudioContext().then(() => play());
  };

  return (
    <div
      style={{
        flex: '0 0 30%',
        minWidth: 160,
        background: 'linear-gradient(180deg, #1f3a7a 0%, #0c1a3f 100%)',
        borderLeft: '1px solid #081334',
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        color: '#e7f0ff',
        overflow: 'hidden',
      }}
    >
      {/* Album art */}
      {track?.coverArt ? (
        <img
          src={track.coverArt}
          alt={`${track.title} cover`}
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            border: '1px solid #000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
            flexShrink: 0,
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            background: `linear-gradient(135deg, hsl(${artHue} 80% 55%) 0%, hsl(${(artHue + 50) % 360} 70% 25%) 100%)`,
            border: '1px solid #000',
            boxShadow: 'inset 0 0 14px rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 28,
            fontWeight: 800,
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            flexShrink: 0,
          }}
        >
          {track ? track.title.slice(0, 1).toUpperCase() : '♪'}
        </div>
      )}

      {/* Track info */}
      <div style={{ flexShrink: 0 }}>
        <div
          style={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={track?.title}
        >
          {track?.title ?? '— No track —'}
        </div>
        <div
          style={{ fontSize: 11, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={track?.artist}
        >
          {track?.artist ?? 'Open a file to begin'}
        </div>
      </div>

      {/* Visualization selector */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 3 }}>Visualizations:</div>
        <select
          value={visualization}
          onChange={(e) => setVisualization(e.target.value as Visualization)}
          style={{ width: '100%', fontSize: 11, fontFamily: 'Tahoma, sans-serif' }}
        >
          {VIZ_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Playlist */}
      {library.length > 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 3, flexShrink: 0 }}>
            Playlist ({library.length}):
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid #0a1e4a',
            }}
          >
            {library.map((t) => {
              const active = t.id === currentTrackId;
              return (
                <div
                  key={t.id}
                  onClick={() => handleTrackClick(t.id)}
                  style={{
                    padding: '3px 6px',
                    cursor: 'default',
                    background: active ? 'rgba(44,100,199,0.7)' : 'transparent',
                    borderLeft: active ? '2px solid #66b8ff' : '2px solid transparent',
                    fontSize: 11,
                    color: active ? '#fff' : 'rgba(231,240,255,0.8)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                  title={`${t.artist} — ${t.title}`}
                >
                  {active ? '▶ ' : '  '}{t.title}
                  <span style={{ opacity: 0.55, fontSize: 10, marginLeft: 4 }}>{t.artist}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
