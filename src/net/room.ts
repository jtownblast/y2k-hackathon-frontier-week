const ROOM_KEY_LENGTH = 8;
const ROOM_KEY_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ROOM_KEY_PATTERN = /^[a-z0-9]{1,64}$/;

let cachedRoomKey: string | null = null;

export function getRoomKey(): string {
  if (cachedRoomKey !== null) {
    return cachedRoomKey;
  }

  const currentUrl = new URL(window.location.href);
  const roomKey = normalizeRoomKey(currentUrl.searchParams.get('room'));

  if (roomKey !== null) {
    cachedRoomKey = roomKey;
    return cachedRoomKey;
  }

  cachedRoomKey = createRoomKey();
  currentUrl.searchParams.set('room', cachedRoomKey);
  window.history.replaceState(window.history.state, '', currentUrl.toString());
  return cachedRoomKey;
}

export function isValidRoomKey(value: string): boolean {
  return ROOM_KEY_PATTERN.test(value);
}

function normalizeRoomKey(value: string | null): string | null {
  const candidate = value?.trim() ?? null;

  if (candidate === null || !isValidRoomKey(candidate)) {
    return null;
  }

  return candidate;
}

function createRoomKey(): string {
  const randomValues = new Uint32Array(ROOM_KEY_LENGTH);
  window.crypto.getRandomValues(randomValues);

  return Array.from(randomValues, (value) => {
    const index = value % ROOM_KEY_ALPHABET.length;
    return ROOM_KEY_ALPHABET[index];
  }).join('');
}