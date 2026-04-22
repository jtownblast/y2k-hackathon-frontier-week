import type { ComponentType } from 'react';
import type { AppId } from '../os/types';

import MyComputer from './myComputer';
import RecycleBin from './recycleBin';
import Paint from './paint';
import Limewire from './limewire';
import InternetExplorer from './internetExplorer';
import WindowsMediaPlayer from './windowsMediaPlayer';
import StickFighter from './stickFighter';
import Platform from './platform';

import myComputerIcon from '../assets/icons/my-computer.png';
import recycleBinIcon from '../assets/icons/recycle-bin.png';
import paintIcon from '../assets/icons/paint.png';
import limewireIcon from '../assets/icons/limewire.png';
import ieIcon from '../assets/icons/internet-explorer.png';
import wmpIcon from '../assets/icons/windows-media-player.png';
import stickFighterIcon from '../assets/icons/msagent-3.png';
import programsIcon from '../assets/icons/programs.png';

export interface AppWindowOptions {
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  showMinimize?: boolean;
  showMaximize?: boolean;
  showBody?: boolean;
}

export interface AppSpawnContext {
  appWindowCount: number;
  totalWindowCount: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface AppDefinition {
  title: string;
  icon: string;
  component: ComponentType;
  defaultSize: { width: number; height: number };
  launchOnClick?: boolean;
  window?: AppWindowOptions;
  getSpawnPosition?: (context: AppSpawnContext) => { x: number; y: number };
}

export const APPS: Record<AppId, AppDefinition> = {
  'my-computer':          { title: 'My Computer',          icon: myComputerIcon, component: MyComputer,         defaultSize: { width: 480, height: 320 } },
  'recycle-bin':          { title: 'Recycle Bin',          icon: recycleBinIcon, component: RecycleBin,         defaultSize: { width: 480, height: 320 } },
  'paint':                { title: 'Paint',                icon: paintIcon,      component: Paint,              defaultSize: { width: 640, height: 480 } },
  'limewire':             { title: 'LimeWire',             icon: limewireIcon,   component: Limewire,           defaultSize: { width: 560, height: 400 } },
  'internet-explorer':    { title: 'Internet Explorer',    icon: ieIcon,         component: InternetExplorer,   defaultSize: { width: 640, height: 440 } },
  'windows-media-player': { title: 'Windows Media Player', icon: wmpIcon,        component: WindowsMediaPlayer, defaultSize: { width: 900, height: 520 } },
  'stick-fighter':        { title: 'Stick Fighter',        icon: stickFighterIcon, component: StickFighter,       defaultSize: { width: 640, height: 480 } },
  'platform':             {
    title: 'Platform',
    icon: programsIcon,
    component: Platform,
    defaultSize: { width: 200, height: 50 },
    launchOnClick: true,
    window: {
      minWidth: 160,
      minHeight: 50,
      resizable: false,
      showMinimize: false,
      showMaximize: false,
      showBody: false,
    },
    getSpawnPosition: ({ appWindowCount, viewportWidth, viewportHeight }) => {
      const width = 200;
      const height = 50;
      const maxX = Math.max(0, viewportWidth - width);
      const maxY = Math.max(0, viewportHeight - height);
      const x = Math.min(Math.max(0, Math.round((viewportWidth - width) / 2)), maxX);
      const y = Math.min(96 + (appWindowCount % 10) * 24, maxY);

      return { x, y };
    },
  },
};

export const DESKTOP_ORDER: AppId[] = [
  'my-computer',
  'recycle-bin',
  'paint',
  'limewire',
  'internet-explorer',
  'windows-media-player',
  'stick-fighter',
  'platform',
];
