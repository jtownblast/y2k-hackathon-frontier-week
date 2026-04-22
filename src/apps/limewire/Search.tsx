import { useState, useCallback } from 'react';
import { useLimewire } from './state';
import { searchResults } from './data';
import type { SearchResult } from './data';
import ResultsTable from './ResultsTable';
import ContextMenu from './ContextMenu';
import DownloadModal from './DownloadModal';
import VirusAlert from './VirusAlert';
import { useFiles } from '../../os/useFiles';
import { useWindows } from '../../os/useWindows';

const TYPE_OPTIONS = ['All Types', 'Audio', 'Video', 'Image', 'Document', 'Program'];

export default function Search() {
  const query = useLimewire((s) => s.searchQuery);
  const type = useLimewire((s) => s.searchType);
  const results = useLimewire((s) => s.results);
  const downloads = useLimewire((s) => s.downloads);
  const activeDownloadId = useLimewire((s) => s.activeDownloadId);
  const { setSearchQuery, setSearchType, setResults, startDownload, updateProgress, completeDownload, cancelDownload, setActiveDownload } = useLimewire();

  const addTrack = useFiles((s) => s.addTrack);
  const requestPlay = useFiles((s) => s.requestPlay);
  const openWindow = useWindows((s) => s.openWindow);

  const [contextMenu, setContextMenu] = useState<{ result: SearchResult; x: number; y: number } | null>(null);
  const [virusFile, setVirusFile] = useState<string | null>(null);

  const handleSearch = () => {
    setResults(searchResults(query, type));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDownload = useCallback(
    (r: SearchResult) => {
      if (r.isVirus) {
        setVirusFile(r.filename);
        return;
      }
      if (!r.realFile) return;

      const dlId = startDownload(r);

      // Simulate download progress to 100, then finalize.
      const totalMs = 2000 + Math.random() * 2000;
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const pct = Math.min(99, (elapsed / totalMs) * 100);
        updateProgress(dlId, pct);
        if (elapsed < totalMs) {
          setTimeout(tick, 120);
        } else {
          // Complete: add to library.
          const track = addTrack({
            src: r.realFile!,
            filename: r.filename,
            title: r.title ?? r.filename.replace(/\.mp3$/, '').replace(/_/g, ' '),
            artist: r.artist ?? 'Unknown Artist',
          });
          completeDownload(dlId, track.id);

          // Auto-open WMP and play.
          requestPlay(track.id);
          const wmps = Object.values(useWindows.getState().windows).filter(
            (w) => w.appId === 'windows-media-player',
          );
          if (wmps.length === 0) openWindow('windows-media-player');
        }
      };
      setTimeout(tick, 120);
    },
    [startDownload, updateProgress, completeDownload, addTrack, requestPlay, openWindow],
  );

  const activeDownload = downloads.find((d) => d.id === activeDownloadId);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Search bar */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '6px 8px',
          background: '#f0efe8',
          borderBottom: '1px solid #c0c0c0',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a file..."
          style={{
            flex: 1,
            fontFamily: 'Tahoma, sans-serif',
            fontSize: 11,
            padding: '2px 6px',
          }}
        />
        <select
          value={type}
          onChange={(e) => setSearchType(e.target.value)}
          style={{ fontFamily: 'Tahoma, sans-serif', fontSize: 11 }}
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          style={{
            background: 'linear-gradient(180deg, #5cb85c 0%, #3a7a3a 100%)',
            color: '#fff',
            border: '1px solid #2a5a2a',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 14px',
            cursor: 'pointer',
            letterSpacing: 0.3,
          }}
        >
          Search
        </button>
      </div>

      <ResultsTable
        results={results}
        onDoubleClick={handleDownload}
        onContextMenu={(e, r) =>
          setContextMenu({ result: r, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })
        }
      />

      {contextMenu && (
        <ContextMenu
          result={contextMenu.result}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDownload={handleDownload}
        />
      )}

      {activeDownload && activeDownload.status === 'downloading' && (
        <DownloadModal
          download={activeDownload}
          onClose={() => {
            cancelDownload(activeDownload.id);
            setActiveDownload(null);
          }}
        />
      )}

      {virusFile && (
        <VirusAlert filename={virusFile} onClose={() => setVirusFile(null)} />
      )}
    </div>
  );
}
