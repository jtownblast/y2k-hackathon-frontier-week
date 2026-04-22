const ID_LENGTH = 6;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'; // 36 chars
const ID_PATTERN = /^[a-z0-9]{6}$/;

export function generateRoomId(): string {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function normalizeRoomId(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidRoomId(input: string): boolean {
  return ID_PATTERN.test(normalizeRoomId(input));
}
