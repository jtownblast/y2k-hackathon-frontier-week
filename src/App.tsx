import { useEffect, useState } from 'react';
import { useOS } from './os/useOS';
import BootScreen from './os/BootScreen';
import Desktop from './os/Desktop';
import DesktopStickFigure from './os/DesktopStickFigure';
import ShutDownScreen from './os/ShutDownScreen';
import MediaPlayerHost from './os/MediaPlayerHost';
import { TASKBAR_HEIGHT } from './os/useWindows';
import { useParty } from './net/useParty';
import { useWindowSync } from './net/useWindowSync';

export default function App() {
  const booted = useOS((s) => s.booted);
  const shutDown = useOS((s) => s.shutDown);

  // App owns the single PartyKit connection so child surfaces can share the store without double-subscribing.
  useParty();
  useWindowSync();

  const [desktopVisible, setDesktopVisible] = useState(false);
  useEffect(() => {
    if (booted && !shutDown) {
      const t = setTimeout(() => setDesktopVisible(true), 40);
      return () => clearTimeout(t);
    }
  }, [booted, shutDown]);

  if (shutDown) return <ShutDownScreen />;
  if (!booted) return <BootScreen />;

  return (
    <>
      <div
        style={{
          opacity: desktopVisible ? 1 : 0,
          transition: 'opacity 700ms ease-out',
          width: '100%',
          height: '100%',
        }}
      >
        <Desktop />
        <MediaPlayerHost />
      </div>
      {desktopVisible && <DesktopStickFigure floorOffset={TASKBAR_HEIGHT} />}
    </>
  );
}
