const UNKNOWN_VALUES = new Set(['unknown', 'n/a', 'none', 'indefinite', '']);

/** Extracts the trailing numeric id from a SWAPI resource URL, e.g. `.../planets/9/` -> `"9"`. */
export function extractSwapiId(url: string): string {
  const match = /\/(\d+)\/?$/.exec(url);
  if (!match) {
    throw new Error(`Cannot extract SWAPI id from url: ${url}`);
  }
  return match[1];
}

export function extractSwapiIdOrNull(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return extractSwapiId(url);
  } catch {
    return null;
  }
}

/** For varchar columns: normalizes SWAPI's "unknown"/"n/a"/"none"/"indefinite" sentinels to null. */
export function cleanString(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return UNKNOWN_VALUES.has(trimmed.toLowerCase()) ? null : trimmed;
}

/** For integer/smallint columns. Strips thousands separators; never handles ranges (none of our integer columns receive ranges). */
export function parseNullableInt(value: string | null | undefined): number | null {
  const cleaned = cleanString(value);
  if (cleaned == null) return null;
  const withoutCommas = cleaned.replaceAll(',', '');
  const parsed = Number.parseInt(withoutCommas, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/** For bigint/numeric columns, which TypeORM maps to `string | null` in TS to avoid precision loss. */
export function parseNullableNumericString(value: string | null | undefined): string | null {
  const cleaned = cleanString(value);
  if (cleaned == null) return null;
  return cleaned.replaceAll(',', '');
}
