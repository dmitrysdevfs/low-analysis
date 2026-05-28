import ExcelJS from 'exceljs';
import * as exportService from '../services/exportService.js';

export async function exportDataset(req, res, next) {
  try {
    const {
      lawId,
      format = 'json',
      mode = 'flat',
      subject,
      article,
      startDate,
      endDate,
      dateFrom,
      dateTo,
    } = req.query;

    if (!lawId) {
      return res.status(400).json({
        message: 'Параметр lawId є обов’язковим для експорту.',
      });
    }

    const filters = {};
    if (subject) filters.subject = subject;
    if (article) filters.article = article;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    if (format === 'xlsx' || format === 'xls' || format === 'csv') {
      // Set headers for Excel XLSX file download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dataset-${lawId}.xlsx"`,
      );
      res.setHeader('X-Accel-Buffering', 'no');

      // Initialize streaming workbook writer
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: res,
        useStyles: true,
        useSharedStrings: true,
      });

      const worksheet = workbook.addWorksheet('Dataset');

      worksheet.columns = [
        { header: 'ID закону', key: 'law_id', width: 25 },
        { header: 'Номер закону', key: 'law_number', width: 15 },
        { header: 'Назва закону', key: 'law_title', width: 30 },
        { header: 'Тип закону', key: 'law_type', width: 15 },
        { header: 'Дата прийняття', key: 'adoption_date', width: 15 },
        { header: 'Розділ', key: 'section_number', width: 15 },
        { header: 'Назва розділу', key: 'section_title', width: 20 },
        { header: 'Стаття', key: 'article_number', width: 10 },
        { header: 'Назва статті', key: 'article_title', width: 20 },
        { header: 'Абзац', key: 'paragraph_number', width: 10 },
        { header: 'Текст', key: 'paragraph_text', width: 50 },
        { header: 'Код елемента', key: 'element_code', width: 20 },
        { header: 'Суб’єкти', key: 'detected_subjects', width: 30 },
        { header: 'Регулятори', key: 'regulators', width: 30 },
        { header: 'Аліаси суб’єктів', key: 'subject_aliases', width: 35 },
        { header: 'Рівень ризику', key: 'risk_level', width: 15 },
        { header: 'Z-Score', key: 'z_score', width: 10 },
      ];

      // Fetch and stream rows
      const rows = await exportService.getFlatDataset(lawId, filters);
      for (const row of rows) {
        worksheet
          .addRow({
            law_id: row.law_id,
            law_number: row.law_number,
            law_title: row.law_title,
            law_type: row.law_type,
            adoption_date: row.adoption_date,
            section_number: row.section_number,
            section_title: row.section_title,
            article_number: row.article_number,
            article_title: row.article_title,
            paragraph_number: row.paragraph_number,
            paragraph_text: row.paragraph_text,
            element_code: row.element_code,
            detected_subjects: row.detected_subjects,
            regulators: row.regulators,
            subject_aliases: row.subject_aliases,
            risk_level: row.risk_level,
            z_score: row.z_score,
          })
          .commit();
      }

      worksheet.commit();
      await workbook.commit();
      return;
    } else {
      // JSON Format
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dataset-${lawId}.json"`,
      );

      const data =
        mode === 'nested'
          ? await exportService.getNestedDataset(lawId, filters)
          : await exportService.getFlatDataset(lawId, filters);

      return res.send(JSON.stringify(data || {}, null, 2));
    }
  } catch (error) {
    return next(error);
  }
}
