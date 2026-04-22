import { useEffect, useState } from 'react';
import { useOS } from './os/useOS';
import BootScreen from './os/BootScreen';
import Desktop from './os/Desktop';
import ShutDownScreen from './os/ShutDownScreen';

export default function App() {
  const booted = useOS((s) => s.booted);
  const shutDown = useOS((s) => s.shutDown);

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
    <div
      style={{
        opacity: desktopVisible ? 1 : 0,
        transition: 'opacity 700ms ease-out',
        width: '100%',
        height: '100%',
      }}
    >
      <Desktop />
    </div>
  );
}
