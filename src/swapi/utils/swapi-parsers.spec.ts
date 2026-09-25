import {
  cleanString,
  extractSwapiId,
  extractSwapiIdOrNull,
  parseNullableInt,
  parseNullableNumericString,
} from './swapi-parsers.js';

describe('extractSwapiId', () => {
  it('extracts the trailing numeric id from a SWAPI url with a trailing slash', () => {
    expect(extractSwapiId('https://swapi.dev/api/planets/1/')).toBe('1');
  });

  it('extracts the trailing numeric id from a SWAPI url without a trailing slash', () => {
    expect(extractSwapiId('https://swapi.dev/api/planets/1')).toBe('1');
  });

  it('extracts multi-digit ids', () => {
    expect(extractSwapiId('https://swapi.dev/api/people/42/')).toBe('42');
  });

  it('throws when the url has no trailing numeric segment', () => {
    expect(() => extractSwapiId('https://swapi.dev/api/planets/')).toThrow(
      'Cannot extract SWAPI id from url: https://swapi.dev/api/planets/',
    );
  });

  it('throws for a completely malformed url', () => {
    expect(() => extractSwapiId('not-a-url')).toThrow(Error);
  });
});

describe('extractSwapiIdOrNull', () => {
  it('returns null for null input', () => {
    expect(extractSwapiIdOrNull(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(extractSwapiIdOrNull(undefined)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(extractSwapiIdOrNull('')).toBeNull();
  });

  it('returns the id for a well-formed url', () => {
    expect(extractSwapiIdOrNull('https://swapi.dev/api/planets/9/')).toBe('9');
  });

  it('swallows the parse error and returns null for a malformed url', () => {
    expect(extractSwapiIdOrNull('https://swapi.dev/api/planets/')).toBeNull();
  });
});

describe('cleanString', () => {
  it('returns null for null', () => {
    expect(cleanString(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(cleanString(undefined)).toBeNull();
  });

  it.each(['unknown', 'n/a', 'none', 'indefinite', ''])(
    'normalizes SWAPI sentinel value %j to null',
    (value) => {
      expect(cleanString(value)).toBeNull();
    },
  );

  it('is case-insensitive when matching sentinel values', () => {
    expect(cleanString('Unknown')).toBeNull();
    expect(cleanString('N/A')).toBeNull();
    expect(cleanString('NONE')).toBeNull();
  });

  it('trims surrounding whitespace on real values', () => {
    expect(cleanString('  Tatooine  ')).toBe('Tatooine');
  });

  it('treats a whitespace-only value as the empty-string sentinel', () => {
    expect(cleanString('   ')).toBeNull();
  });

  it('passes through a normal value unchanged', () => {
    expect(cleanString('desert')).toBe('desert');
  });
});

describe('parseNullableInt', () => {
  it('returns null for null', () => {
    expect(parseNullableInt(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(parseNullableInt(undefined)).toBeNull();
  });

  it('returns null for a SWAPI sentinel value', () => {
    expect(parseNullableInt('unknown')).toBeNull();
  });

  it('parses a plain integer string', () => {
    expect(parseNullableInt('9')).toBe(9);
  });

  it('strips thousands separators before parsing', () => {
    expect(parseNullableInt('1,000')).toBe(1000);
  });

  it('returns null when the value cannot be parsed as a number', () => {
    expect(parseNullableInt('abc')).toBeNull();
  });
});

describe('parseNullableNumericString', () => {
  it('returns null for null', () => {
    expect(parseNullableNumericString(null)).toBeNull();
  });

  it('returns null for a SWAPI sentinel value', () => {
    expect(parseNullableNumericString('unknown')).toBeNull();
  });

  it('strips thousands separators but keeps the value as a string (avoids bigint precision loss)', () => {
    expect(parseNullableNumericString('1,000,000,000')).toBe('1000000000');
  });

  it('trims whitespace around the value', () => {
    expect(parseNullableNumericString('  200000  ')).toBe('200000');
  });
});
