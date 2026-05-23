import { describe, test, expect } from 'vitest';
import { classifyElement } from './taxonomyService.js';

describe('taxonomyService', () => {
  test('should classify right', () => {
    const el = { text: 'Громадянин має право на працю.' };
    const result = classifyElement(el);
    expect(result.legalFunctions).toContain('right');
  });

  test('should classify obligation', () => {
    const el = { text: 'Роботодавець зобов’язаний виплатити заробітну плату.' };
    const result = classifyElement(el);
    expect(result.legalFunctions).toContain('obligation');
    expect(result.domains).toContain('labor');
  });

  test('should classify prohibition', () => {
    const el = { text: 'Забороняється дискримінація у сфері праці.' };
    const result = classifyElement(el);
    expect(result.legalFunctions).toContain('prohibition');
    expect(result.domains).toContain('labor');
  });

  test('should classify multiple domains', () => {
    const el = { text: 'Банк стягує податок з відсотків по депозиту.' };
    const result = classifyElement(el);
    expect(result.domains).toContain('finance');
    expect(result.domains).toContain('taxation');
  });

  test('should classify responsibility and sanction', () => {
    const el = { text: 'Особа несе відповідальність у вигляді штрафу.' };
    const result = classifyElement(el);
    expect(result.legalFunctions).toContain('responsibility');
    expect(result.legalFunctions).toContain('sanction');
  });
});
