import { useState } from 'react';
import { useStickFighter } from './state';

export default function Lobby() {
  const createRoom = useStickFighter((s) => s.createRoom);
  const joinRoom = useStickFighter((s) => s.joinRoom);

  const [joinInput, setJoinInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = () => {
    const ok = joinRoom(joinInput);
    if (!ok) {
      setError('Room IDs are 6 letters or digits (e.g. abc123).');
      return;
    }
    setError(null);
    setJoinInput('');
  };

  return (
    <div
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: '#c0c0c0',
        height: '100%',
      }}
    >
      <fieldset>
        <legend>Create a new room</legend>
        <button type="button" onClick={createRoom}>
          Create
        </button>
      </fieldset>

      <div style={{ textAlign: 'center', opacity: 0.75 }}>— or —</div>

      <fieldset>
        <legend>Join existing</legend>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={joinInput}
            onChange={(e) => {
              setJoinInput(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoin();
            }}
            placeholder="abc123"
            maxLength={6}
            style={{ flex: 1 }}
          />
          <button type="button" onClick={handleJoin} disabled={!joinInput.trim()}>
            Join
          </button>
        </div>
        {error && (
          <div style={{ color: '#a00', marginTop: 8, fontSize: 12 }}>{error}</div>
        )}
      </fieldset>
    </div>
  );
}
