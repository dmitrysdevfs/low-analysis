import { describe, expect, it } from 'vitest';
import { buildSnippet } from '../services/searchService.js';

describe('buildSnippet', () => {
  it('returns null for empty text', () => {
    expect(buildSnippet(null, 'податок')).toBeNull();
    expect(buildSnippet('', 'податок')).toBeNull();
  });

  it('returns the whole short text when no match and it is short', () => {
    expect(buildSnippet('Коротко', 'xyz')).toBe('Коротко');
  });

  it('centres the snippet on the first literal match with ellipses', () => {
    const text = 'А'.repeat(200) + ' податок ' + 'Б'.repeat(200);
    const snippet = buildSnippet(text, 'податок');

    expect(snippet).toContain('податок');
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet.length).toBeLessThan(text.length);
  });

  it('is case-insensitive when locating the match', () => {
    expect(buildSnippet('Закон про ПОДАТОК', 'податок')).toContain('ПОДАТОК');
  });

  it('falls back to the head of long text when there is no literal match', () => {
    const text = 'А'.repeat(400);
    const snippet = buildSnippet(text, 'qqq');

    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet.length).toBeLessThan(text.length);
  });
});
