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

  test('should classify procedure', () => {
    const el = { text: 'Процедура подання документів визначена законом.' };
    const result = classifyElement(el);
    expect(result.legalFunctions).toContain('procedure');
  });

  test('should classify definition', () => {
    const el = { text: 'Термін "підприємство" означає юридичну особу.' };
    const result = classifyElement(el);
    expect(result.legalFunctions).toContain('definition');
  });

  test('should classify business domain', () => {
    const el = {
      text: 'Для здійснення господарської діяльності потрібна ліцензія.',
    };
    const result = classifyElement(el);
    expect(result.domains).toContain('business');
  });

  test('should classify education domain', () => {
    const el = { text: 'Освітні стандарти затверджуються міністерством.' };
    const result = classifyElement(el);
    expect(result.domains).toContain('education');
  });

  test('should classify healthcare domain', () => {
    const el = { text: 'Пацієнт має право на отримання медичної допомоги.' };
    const result = classifyElement(el);
    expect(result.domains).toContain('healthcare');
  });

  test('should classify military domain', () => {
    const el = { text: 'Військова служба є обов’язком громадян.' };
    const result = classifyElement(el);
    expect(result.domains).toContain('military');
  });

  test('should classify social_protection domain', () => {
    const el = {
      text: 'Громадяни мають право на пенсію та соціальний захист.',
    };
    const result = classifyElement(el);
    expect(result.domains).toContain('social_protection');
  });

  test('should return empty arrays for unclassifiable text', () => {
    const el = { text: 'Випадковий текст без жодних юридичних маркерів.' };
    const result = classifyElement(el);
    expect(result.legalFunctions).toEqual([]);
    expect(result.domains).toEqual([]);
  });

  test('should not classify unrelated domains', () => {
    const el = { text: 'Громадянин має право на працю.' };
    const result = classifyElement(el);
    expect(result.legalFunctions).toContain('right');
    expect(result.domains).not.toContain('finance');
  });
});
