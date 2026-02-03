import { createHash } from 'crypto';

export function extractText(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text.length ? text : undefined;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const text = extractText(entry);
      if (text) {
        return text;
      }
    }
    return undefined;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const inner = extractText(record._ ?? record['#text'] ?? record.href ?? record.url);
    if (inner) {
      return inner;
    }
    return undefined;
  }

  return undefined;
}

export function toStringArray(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => extractText(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  const text = extractText(value);
  return text ? [text] : [];
}

export function compactObject<T extends Record<string, unknown>>(value: T): T {
  const entries = Object.entries(value).filter(([, item]) => item !== undefined);
  return Object.fromEntries(entries) as T;
}

export function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

export function normalizeWhitespace(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned.length ? cleaned : undefined;
}
