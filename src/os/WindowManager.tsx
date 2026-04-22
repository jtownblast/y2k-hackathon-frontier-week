import { createElement } from 'react';
import Window from './Window';
import { useWindows } from './useWindows';
import { APPS } from '../apps/registry';

export default function WindowManager() {
  const windows = useWindows((s) => s.windows);
  const zOrder = useWindows((s) => s.zOrder);
  const focusedId = useWindows((s) => s.focusedId);

  return (
    <>
      {zOrder.map((id) => {
        const win = windows[id];
        if (!win) return null;
        const App = APPS[win.appId].component;
        const zIndex = zOrder.indexOf(id) + 10;
        return (
          <Window
            key={id}
            window={win}
            zIndex={zIndex}
            focused={focusedId === id && !win.isMinimized}
          >
            {createElement(App)}
          </Window>
        );
      })}
    </>
  );
}
