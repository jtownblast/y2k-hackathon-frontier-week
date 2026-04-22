import { useLimewire } from './state';
import type { TabId } from './state';
import Search from './Search';
import Library from './Library';

const TABS: { id: TabId; label: string }[] = [
  { id: 'search', label: 'Search' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'library', label: 'Library' },
  { id: 'tools', label: 'Tools' },
];

function MonitorTab() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        fontFamily: 'Tahoma, sans-serif',
        fontSize: 11,
        color: '#333',
        background: '#f0efe8',
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 12 }}>Download Monitor</div>
      <div style={{ display: 'flex', gap: 40 }}>
        <div>
          <div style={{ color: '#808080', fontSize: 10 }}>ACTIVE</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0a246a' }}>0</div>
        </div>
        <div>
          <div style={{ color: '#808080', fontSize: 10 }}>QUEUED</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0a246a' }}>0</div>
        </div>
        <div>
          <div style={{ color: '#808080', fontSize: 10 }}>HOSTS</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#009900' }}>4,821</div>
        </div>
      </div>
      <div
        style={{
          padding: 8,
          background: '#fff',
          border: '1px inset #808080',
          fontSize: 11,
          color: '#808080',
        }}
      >
        No active transfers.
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
