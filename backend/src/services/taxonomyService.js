/**
 * Classifies a legal element based on its text content using rule-based regex.
 * @param {object} element - The element object with 'text' property.
 * @returns {object} - Classified taxonomy tags, confidence and source.
 */
export const classifyElement = (element) => {
  const text = element.text || '';
  const legalFunctions = [];
  const domains = [];
  const keywords = [];

  // 1. Legal Functions Classification
  const rules = [
    {
      type: 'right',
      regex: /має право|мають право|може|можуть|вправі/iu,
    },
    {
      type: 'obligation',
      regex: /зобов[’']язаний|зобов[’']язані|повинен|повинні|мусить|мусять|необхідно/iu,
    },
    {
      type: 'prohibition',
      regex: /забороняється|не має права|не мають права|не допускається/iu,
    },
    {
      type: 'responsibility',
      regex: /відповідальність|відповідає за|несе відповідальність/iu,
    },
    {
      type: 'sanction',
      regex: /штраф|покарання|стягнення|конфіскація/iu,
    },
    {
      type: 'procedure',
      regex: /порядок|процедура|шляхом|протягом|термін/iu,
    },
    {
      type: 'definition',
      regex: /це\s|—|значення|термін\s"|поняття/iu,
    },
  ];

  rules.forEach((rule) => {
    if (rule.regex.test(text)) {
      legalFunctions.push(rule.type);
    }
  });

  // 2. Domain Classification
  const domainRules = [
    {
      domain: 'labor',
      regex: /роботодавець|працівник|звільнення|трудов|заробітн|відпустк|прац/iu,
    },
    {
      domain: 'taxation',
      regex: /податок|збір|платник|акциз|мито|оподаткування/iu,
    },
    {
      domain: 'business',
      regex: /ліцензія|дозвіл|підприємець|господарська діяльність|фізична особа - підприємець|тов|ат/iu,
    },
    {
      domain: 'finance',
      regex: /банк|фінансовий|депозит|кредит|платіж|рахунок|валюта/iu,
    },
    {
      domain: 'education',
      regex: /освіта|навчання|студент|школа|університет|викладач/iu,
    },
    {
      domain: 'healthcare',
      regex: /медична|лікар|пацієнт|здоров'я|лікування|аптека/iu,
    },
    {
      domain: 'military',
      regex: /військовий|збройні сили|оборона|мобілізація|служба/iu,
    },
    {
      domain: 'social_protection',
      regex: /пенсія|соціальний|допомога|пільги|інвалідність/iu,
    },
  ];

  domainRules.forEach((rule) => {
    if (rule.regex.test(text)) {
      domains.push(rule.domain);
    }
  });

  return {
    legalFunctions,
    domains,
    keywords,
    confidence: 0.8, // Static confidence for rule-based approach
    source: 'rules',
  };
};
