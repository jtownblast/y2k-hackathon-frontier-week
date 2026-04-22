import { useLimewire } from './state';
import type { TabId, Download } from './state';
import Search from './Search';
import Library from './Library';

const TABS: { id: TabId; label: string }[] = [
  { id: 'search', label: 'Search' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'library', label: 'Library' },
  { id: 'tools', label: 'Tools' },
];

function DownloadRow({ dl }: { dl: Download }) {
  const isActive = dl.status === 'downloading';
  const isDone = dl.status === 'complete';

  return (
    <tr
      style={{
        background: isActive ? '#fffbe6' : 'transparent',
      }}
    >
      <td
        style={{
          padding: '3px 6px',
          maxWidth: 220,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: isActive ? '#0a246a' : '#333',
          fontWeight: isActive ? 700 : 400,
        }}
        title={dl.result.filename}
      >
        {dl.result.filename}
      </td>
      <td style={{ padding: '3px 6px', color: '#555' }}>{dl.result.size}</td>
      <td style={{ padding: '3px 6px', minWidth: 120 }}>
        {isActive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                flex: 1,
                height: 10,
                background: '#d4d0c8',
                border: '1px solid #808080',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${dl.progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2a7a2a, #5cb85c)',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
            <span style={{ fontSize: 10, color: '#555', minWidth: 28 }}>
              {Math.round(dl.progress)}%
            </span>
          </div>
        ) : isDone ? (
          <span style={{ color: '#007700', fontWeight: 700 }}>✓ Complete</span>
        ) : (
          <span style={{ color: '#888' }}>Cancelled</span>
        )}
      </td>
      <td style={{ padding: '3px 6px', color: '#555' }}>{dl.result.speed}</td>
    </tr>
  );
}

function MonitorTab() {
  const downloads = useLimewire((s) => s.downloads);
  const active = downloads.filter((d) => d.status === 'downloading');
  const queued = 0;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 12px 8px',
        fontFamily: 'Tahoma, sans-serif',
        fontSize: 11,
        color: '#333',
        background: '#f0efe8',
        gap: 8,
        overflow: 'hidden',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 12 }}>Download Monitor</div>
      <div style={{ display: 'flex', gap: 40, flexShrink: 0 }}>
        <div>
          <div style={{ color: '#808080', fontSize: 10 }}>ACTIVE</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: active.length > 0 ? '#cc6600' : '#0a246a' }}>
            {active.length}
          </div>
        </div>
        <div>
          <div style={{ color: '#808080', fontSize: 10 }}>QUEUED</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0a246a' }}>{queued}</div>
        </div>
        <div>
          <div style={{ color: '#808080', fontSize: 10 }}>COMPLETE</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#007700' }}>
            {downloads.filter((d) => d.status === 'complete').length}
          </div>
        </div>
        <div>
          <div style={{ color: '#808080', fontSize: 10 }}>HOSTS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#009900' }}>4,821</div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          background: '#fff',
          border: '1px inset #808080',
          overflowY: 'auto',
        }}
      >
        {downloads.length === 0 ? (
          <div style={{ padding: 8, color: '#808080' }}>No transfers.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '55%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '11%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#d4d0c8', borderBottom: '1px solid #808080' }}>
                <th style={{ padding: '2px 6px', textAlign: 'left', fontWeight: 700, fontSize: 10 }}>Filename</th>
                <th style={{ padding: '2px 6px', textAlign: 'left', fontWeight: 700, fontSize: 10 }}>Size</th>
                <th style={{ padding: '2px 6px', textAlign: 'left', fontWeight: 700, fontSize: 10 }}>Status</th>
                <th style={{ padding: '2px 6px', textAlign: 'left', fontWeight: 700, fontSize: 10 }}>Speed</th>
              </tr>
            </thead>
            <tbody>
              {[...downloads].reverse().map((dl) => (
                <DownloadRow key={dl.id} dl={dl} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ToolsTab() {
  return (
    <div
      style={{
        flex: 1,
        padding: 16,
        fontFamily: 'Tahoma, sans-serif',
        fontSize: 11,
        color: '#333',
        background: '#f0efe8',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Tools</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button style={{ textAlign: 'left', width: 180 }}>Options...</button>
        <button style={{ textAlign: 'left', width: 180 }}>Statistics</button>
        <button style={{ textAlign: 'left', width: 180 }}>About LimeWire...</button>
      </div>
    </div>
  );
}

export default function Limewire() {
  const activeTab = useLimewire((s) => s.activeTab);
  const setActiveTab = useLimewire((s) => s.setActiveTab);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f0efe8',
        fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
        fontSize: 11,
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Branded header */}
      <div
        style={{
          background: 'linear-gradient(90deg, #1a7a1a 0%, #2faa2f 50%, #1a7a1a 100%)',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '2px solid #0a5a0a',
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            background:
              'radial-gradient(circle at 35% 30%, #ffffff 0%, #aaffaa 30%, #006600 100%)',
            border: '1px solid #003300',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 900,
            color: '#003300',
          }}
        >
          L
        </div>
        <span
          style={{
            color: '#ffffff',
            fontWeight: 900,
            fontSize: 14,
            letterSpacing: 0.5,
            textShadow: '1px 1px 0 rgba(0,0,0,0.4)',
          }}
        >
          LimeWire
        </span>
        <span
          style={{
            color: '#aaffaa',
            fontSize: 10,
            marginLeft: 2,
            opacity: 0.85,
          }}
        >
          Basic 4.12.3
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#aaffaa', fontSize: 10 }}>
          🟢 Connected · 4,821 hosts
        </span>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          background: '#d4d0c8',
          borderBottom: '1px solid #808080',
          padding: '4px 4px 0',
          gap: 2,
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => {
          const active = t.id === activeTab;
          return (
            <div
              key={t.id}
              onMouseDown={() => setActiveTab(t.id)}
              style={{
                padding: '4px 16px',
                background: active ? '#f0efe8' : '#c0bdb5',
                border: '1px solid #808080',
                borderBottom: active ? '1px solid #f0efe8' : '1px solid #808080',
                marginBottom: active ? -1 : 0,
                cursor: 'default',
                fontSize: 11,
                fontWeight: active ? 700 : 400,
                color: '#000',
                position: 'relative',
                zIndex: active ? 1 : 0,
              }}
            >
              {t.label}
            </div>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'search' && <Search />}
        {activeTab === 'monitor' && <MonitorTab />}
        {activeTab === 'library' && <Library />}
        {activeTab === 'tools' && <ToolsTab />}
      </div>
    </div>
  );
}
