import { useEffect, useRef } from 'react';
import type { SearchResult } from './data';

interface Props {
  result: SearchResult;
  x: number;
  y: number;
  onClose: () => void;
  onDownload: (r: SearchResult) => void;
}

const ITEMS = [
  { label: 'Download', action: 'download' },
  { label: 'Download As...' },
  { label: '-' },
  { label: 'Preview' },
  { label: 'Browse Host' },
  { label: 'Block Host' },
  { label: 'Chat with Host' },
];

export default function ContextMenu({ result, x, y, onClose, onDownload }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 100,
        background: '#ece9d8',
        border: '1px solid #404040',
        boxShadow: '2px 2px 6px rgba(0,0,0,0.35)',
        padding: '2px 0',
        minWidth: 160,
        fontFamily: 'Tahoma, sans-serif',
        fontSize: 11,
        color: '#000',
      }}
    >
      {ITEMS.map((item, i) =>
        item.label === '-' ? (
          <div
            key={i}
            style={{ height: 1, background: '#808080', margin: '3px 4px' }}
          />
        ) : (
          <div
            key={i}
            onMouseDown={(e) => {
              e.preventDefault();
              if (item.action === 'download') {
                onDownload(result);
                onClose();
              }
            }}
            style={{
              padding: '3px 22px',
              color: item.action ? '#000' : '#808080',
              cursor: item.action ? 'default' : 'default',
            }}
            onMouseEnter={(e) => {
              if (item.action) {
                (e.currentTarget as HTMLDivElement).style.background = '#0a246a';
                (e.currentTarget as HTMLDivElement).style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              (e.currentTarget as HTMLDivElement).style.color =
                item.action ? '#000' : '#808080';
            }}
          >
            {item.label}
          </div>
        ),
      )}
    </div>
  );
}
