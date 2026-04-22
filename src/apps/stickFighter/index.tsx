import Lobby from './Lobby';
import Room from './Room';
import { useStickFighter } from './state';

export default function StickFighter() {
  const roomId = useStickFighter((s) => s.roomId);
  return roomId === null ? <Lobby /> : <Room />;
}
