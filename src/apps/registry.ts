import type { ComponentType } from 'react';
import type { AppId } from '../os/types';

import MyComputer from './myComputer';
import RecycleBin from './recycleBin';
import Paint from './paint';
import Limewire from './limewire';
import InternetExplorer from './internetExplorer';
import WindowsMediaPlayer from './windowsMediaPlayer';
import StickFighter from './stickFighter';

import myComputerIcon from '../assets/icons/my-computer.png';
import recycleBinIcon from '../assets/icons/recycle-bin.png';
import paintIcon from '../assets/icons/paint.png';
import limewireIcon from '../assets/icons/limewire.png';
import ieIcon from '../assets/icons/internet-explorer.png';
import wmpIcon from '../assets/icons/windows-media-player.png';
import stickFighterIcon from '../assets/icons/msagent-3.png';

export interface AppDefinition {
  title: string;
  icon: string;
  component: ComponentType;
  defaultSize: { width: number; height: number };
}

export const APPS: Record<AppId, AppDefinition> = {
  'my-computer':          { title: 'My Computer',          icon: myComputerIcon, component: MyComputer,         defaultSize: { width: 480, height: 320 } },
  'recycle-bin':          { title: 'Recycle Bin',          icon: recycleBinIcon, component: RecycleBin,         defaultSize: { width: 480, height: 320 } },
  'paint':                { title: 'Paint',                icon: paintIcon,      component: Paint,              defaultSize: { width: 640, height: 480 } },
  'limewire':             { title: 'LimeWire',             icon: limewireIcon,   component: Limewire,           defaultSize: { width: 560, height: 400 } },
  'internet-explorer':    { title: 'Internet Explorer',    icon: ieIcon,         component: InternetExplorer,   defaultSize: { width: 640, height: 440 } },
  'windows-media-player': { title: 'Windows Media Player', icon: wmpIcon,        component: WindowsMediaPlayer, defaultSize: { width: 620, height: 400 } },
  'stick-fighter':        { title: 'Stick Fighter',        icon: stickFighterIcon, component: StickFighter,       defaultSize: { width: 640, height: 480 } },
};

export const DESKTOP_ORDER: AppId[] = [
  'my-computer',
  'recycle-bin',
  'paint',
  'limewire',
  'internet-explorer',
  'windows-media-player',
  'stick-fighter',
];
