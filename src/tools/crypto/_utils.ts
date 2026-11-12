export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder('utf-8', { fatal: false });

export const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

export const hexToBytes = (value: string): Uint8Array => {
  const clean = value.replace(/\s+/g, '').replace(/^0x/i, '');
  if (!clean) {
    throw new Error('Enter some hexadecimal data.');
  }
  if (!/^[0-9a-f]+$/i.test(clean)) {
    throw new Error('Hexadecimal data can only contain 0-9 and A-F.');
  }
  if (clean.length % 2 !== 0) {
    throw new Error('Hexadecimal data must have an even number of digits.');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(clean.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize)
    );
  }
  return btoa(binary);
};

export const base64ToBytes = (value: string): Uint8Array => {
  const clean = value.replace(/\s+/g, '');
  if (!clean) {
    throw new Error('Enter some base64 data.');
  }
  const normalized = clean.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '='
  );
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error('The input is not valid base64.');
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export const concatBytes = (...parts: Uint8Array[]): Uint8Array => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${
    units[unitIndex]
  }`;
};

export const derToPem = (der: Uint8Array, label: string): string => {
  const base64 = bytesToBase64(der);
  const lines = base64.match(/.{1,64}/g)?.join('\n') ?? base64;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
};

export type PemBlock = {
  label: string;
  der: Uint8Array;
};

export const parsePemBlocks = (input: string): PemBlock[] => {
  const pattern = /-----BEGIN ([^-\r\n]+)-----([\s\S]*?)-----END \1-----/g;
  const blocks: PemBlock[] = [];
  let match = pattern.exec(input);
  while (match) {
    const label = (match[1] ?? '').trim();
    const body = (match[2] ?? '').replace(/\s+/g, '');
    if (!label || !body) {
      throw new Error('Found a PEM block with an empty body.');
    }
    blocks.push({ label, der: base64ToBytes(body) });
    match = pattern.exec(input);
  }
  if (blocks.length === 0) {
    throw new Error(
      'No PEM block found. Expected a -----BEGIN …----- header and matching footer.'
    );
  }
  return blocks;
};

export const copyBytes = (bytes: Uint8Array): Uint8Array =>
  new Uint8Array(bytes);
