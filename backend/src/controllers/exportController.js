import * as exportService from '../services/exportService.js';

const csvEscape = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

export async function exportDataset(req, res, next) {
  try {
    const { lawId, format = 'json', mode = 'flat', subject } = req.query;

    if (!lawId) {
      return res.status(400).json({
        message: 'Параметр lawId є обов’язковим для експорту.',
      });
    }

    const filters = { subject };

    if (format === 'csv') {
      // Set headers for CSV file download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dataset-${lawId}.csv"`,
      );
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      // Write UTF-8 BOM for Excel compatibility
      res.write('\uFEFF');

      // CSV Header columns
      const headers = [
        'Закон',
        'Номер закону',
        'Назва закону',
        'Тип закону',
        'Дата прийняття',
        'Розділ',
        'Назва розділу',
        'Стаття',
        'Назва статті',
        'Абзац',
        'Текст',
        'Код елемента',
        'Суб’єкти',
        'Регулятори',
        'Аліаси суб’єктів',
        'Рівень ризику',
        'Z-Score',
      ];

      res.write(headers.map(csvEscape).join(',') + '\n');

      // Fetch and stream rows
      const rows = await exportService.getFlatDataset(lawId, filters);
      for (const row of rows) {
        const line = [
          row.law_title,
          row.law_number,
          row.law_title,
          row.law_type,
          row.adoption_date,
          row.section_number,
          row.section_title,
          row.article_number,
          row.article_title,
          row.paragraph_number,
          row.paragraph_text,
          row.element_code,
          row.detected_subjects,
          row.regulators,
          row.subject_aliases,
          row.risk_level,
          row.z_score,
        ];
        res.write(line.map(csvEscape).join(',') + '\n');
      }

      return res.end();
    } else {
      // JSON Format
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dataset-${lawId}.json"`,
      );

      if (mode === 'nested') {
        const data = await exportService.getNestedDataset(lawId, filters);
        return res.json(data);
      } else {
        const data = await exportService.getFlatDataset(lawId, filters);
        return res.json(data);
      }
    }
  } catch (error) {
    return next(error);
  }
}
