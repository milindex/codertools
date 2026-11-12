export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder('utf-8', { fatal: false });

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

export const base64UrlEncode = (bytes: Uint8Array): string =>
  bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const base64UrlEncodeText = (value: string): string =>
  base64UrlEncode(textEncoder.encode(value));

export const base64UrlDecode = (value: string): Uint8Array =>
  base64ToBytes(value);

export const base64UrlDecodeText = (value: string): string =>
  textDecoder.decode(base64UrlDecode(value));
