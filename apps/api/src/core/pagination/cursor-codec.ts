type CursorPayload = Record<string, unknown>;

type CursorValidationFn<T> = (value: unknown) => value is T;

function toBase64Url(value: string): string {
  const base64: string = Buffer.from(value, 'utf8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const base64: string = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded: string = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

export class CursorCodec {
  static encode(payload: CursorPayload): string {
    const json: string = JSON.stringify(payload);
    return toBase64Url(json);
  }

  static decode<T>(cursor: string, isValid: CursorValidationFn<T>): T | null {
    try {
      const json: string = fromBase64Url(cursor);
      const parsed: unknown = JSON.parse(json);
      if (!isValid(parsed)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
