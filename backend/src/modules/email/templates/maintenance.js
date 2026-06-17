import { escapeHtml } from '../email.utils.js';

export function maintenanceTemplate({
  headline,
  body,
  startTime,
  endTime,
  ctaText,
  ctaUrl,
}) {
  return `
    <h1 style="margin-top:0;">${escapeHtml(headline)}</h1>
    <p>${escapeHtml(body)}</p>
    ${startTime ? `<p><strong>Початок:</strong> ${escapeHtml(startTime)}</p>` : ''}
    ${endTime ? `<p><strong>Завершення:</strong> ${escapeHtml(endTime)}</p>` : ''}
    ${ctaText && ctaUrl ? `<p style="text-align:center;margin-top:32px;"><a href="${escapeHtml(ctaUrl)}" class="btn">${escapeHtml(ctaText)}</a></p>` : ''}
  `;
}
