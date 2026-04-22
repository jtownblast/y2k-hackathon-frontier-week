import type { SearchResult } from './data';

interface Props {
  results: SearchResult[];
  onDoubleClick: (r: SearchResult) => void;
  onContextMenu: (e: React.MouseEvent, r: SearchResult) => void;
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: '#f5c518', fontSize: 11 }}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  );
}

export default function ResultsTable({ results, onDoubleClick, onContextMenu }: Props) {
  if (results.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#555',
          fontSize: 12,
          fontFamily: 'Tahoma, sans-serif',
        }}
      >
        No results — try searching above
      </div>
    );
  }

  const cols = [
    { label: 'Name', flex: '1 1 200px', key: 'filename' },
    { label: 'Size', flex: '0 0 70px', key: 'size' },
    { label: 'Type', flex: '0 0 60px', key: 'type' },
    { label: 'Speed', flex: '0 0 55px', key: 'speed' },
    { label: 'Quality', flex: '0 0 80px', key: 'quality' },
    { label: 'Bitrate', flex: '0 0 70px', key: 'bitrate' },
    { label: 'Length', flex: '0 0 55px', key: 'length' },
    { label: 'Seeds', flex: '0 0 45px', key: 'seeds' },
  ] as const;

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
        {cols.map((c) => (
          <div
            key={c.key}
            style={{
              flex: c.flex,
              padding: '1px 6px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              borderRight: '1px solid #a0a0a0',
            }}
          >
            {c.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
        {results.map((r, idx) => (
          <div
            key={r.id}
            onDoubleClick={() => onDoubleClick(r)}
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu(e, r);
            }}
            style={{
              display: 'flex',
              background: idx % 2 === 0 ? '#fff' : '#f0f0f0',
              fontSize: 11,
              fontFamily: 'Tahoma, sans-serif',
              cursor: 'default',
              userSelect: 'none',
              color: r.isVirus ? '#880000' : '#000',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = '#cce5ff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                idx % 2 === 0 ? '#fff' : '#f0f0f0';
            }}
          >
            <div
              style={{
                flex: '1 1 200px',
                padding: '2px 6px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
              title={r.filename}
            >
              {r.isVirus ? '⚠ ' : '♫ '}
              {r.filename}
            </div>
            <div style={{ flex: '0 0 70px', padding: '2px 6px', borderLeft: '1px solid #e0e0e0' }}>{r.size}</div>
            <div style={{ flex: '0 0 60px', padding: '2px 6px', borderLeft: '1px solid #e0e0e0' }}>{r.type}</div>
            <div style={{ flex: '0 0 55px', padding: '2px 6px', borderLeft: '1px solid #e0e0e0' }}>{r.speed}</div>
            <div style={{ flex: '0 0 80px', padding: '2px 6px', borderLeft: '1px solid #e0e0e0' }}>
              <Stars n={r.quality} />
            </div>
            <div style={{ flex: '0 0 70px', padding: '2px 6px', borderLeft: '1px solid #e0e0e0' }}>{r.bitrate}</div>
            <div style={{ flex: '0 0 55px', padding: '2px 6px', borderLeft: '1px solid #e0e0e0' }}>{r.length}</div>
            <div style={{ flex: '0 0 45px', padding: '2px 6px', borderLeft: '1px solid #e0e0e0' }}>{r.seeds}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
