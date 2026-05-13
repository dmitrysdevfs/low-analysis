import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useParseLaw } from '@/hooks/useParseLaw';
import { parseLaw } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  parseLaw: vi.fn(),
}));

describe('useParseLaw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits a law parsing request successfully', async () => {
    const onSuccess = vi.fn();

    vi.mocked(parseLaw).mockResolvedValue({
      message: 'Success',
      lawId: 'law-1',
      elementsCount: 10,
    });

    const { result } = renderHook(() => useParseLaw(onSuccess));

    await act(async () => {
      await result.current.submit('https://zakon.rada.gov.ua/laws/show/254к/96-вр');
    });

    expect(parseLaw).toHaveBeenCalledWith('https://zakon.rada.gov.ua/laws/show/254к/96-вр');

    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles parse request errors', async () => {
    vi.mocked(parseLaw).mockRejectedValue(new Error('Помилка парсингу'));

    const { result } = renderHook(() => useParseLaw());

    await act(async () => {
      await result.current.submit('https://zakon.rada.gov.ua/laws/show/254к/96-вр');
    });

    expect(result.current.error).toBe('Помилка парсингу');
    expect(result.current.loading).toBe(false);
  });
});
