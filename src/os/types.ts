export type AppId =
  | 'my-computer'
  | 'recycle-bin'
  | 'paint'
  | 'limewire'
  | 'internet-explorer'
  | 'windows-media-player'
  | 'stick-fighter';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState extends WindowBounds {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  isMinimized: boolean;
  isMaximized: boolean;
  preMaxBounds?: WindowBounds;
}
