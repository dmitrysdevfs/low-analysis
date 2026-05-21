import { describe, expect, it } from 'vitest';
import { extractDefinitions } from './definitionExtractor.js';

describe('extractDefinitions', () => {
  it('correctly extracts simple definitions and handles edge cases', () => {
    const elements = [
      {
        code: 'law.st1.pu1',
        text: '1. Державна служба - це публічна, професійна, політично неупереджена діяльність...',
      },
      {
        code: 'law.st1.pu1.pp1',
        // Should NOT be matched as a definition since the hyphen is a compound hyphen without spaces
        text: '1) аналіз проектів законів та інших нормативно-правових актів;',
      },
      {
        code: 'law.st1.pu1.pp2',
        // Should NOT be matched as a definition
        text: '2) забезпечення реалізації державної політики, виконання програм та інших нормативно-правових актів;',
      },
      {
        code: 'law.st1.pu1.pp7',
        // Should correctly handle dashes inside parentheses (далі - ...) and split on the main space-dash-space
        text: '7) відокремлений підрозділ надавача фінансових послуг (далі - відокремлений підрозділ) - філія, представництво, інший підрозділ;',
      },
      {
        code: 'law.st1.pu1.pp8',
        // Should NOT be matched because of "будь-якої" compound hyphen
        text: 'суб’єкт господарювання будь-якої організаційно-правової форми, що реалізує товари;',
      },
    ];

    const result = extractDefinitions(elements);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      term: '1. Державна служба',
      definition:
        'це публічна, професійна, політично неупереджена діяльність...',
    });
    expect(result[1]).toEqual({
      term: 'відокремлений підрозділ надавача фінансових послуг (далі - відокремлений підрозділ)',
      definition: 'філія, представництво, інший підрозділ;',
    });
  });
});
