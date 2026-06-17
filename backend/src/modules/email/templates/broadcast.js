import { escapeHtml } from '../email.utils.js';

export function broadcastTemplate({ headline, body, ctaText, ctaUrl }) {
  return `
    <h1 style="margin-top:0;">${escapeHtml(headline)}</h1>
    <p>${escapeHtml(body)}</p>
    ${ctaText && ctaUrl ? `<p style="text-align:center;margin-top:32px;"><a href="${escapeHtml(ctaUrl)}" class="btn">${escapeHtml(ctaText)}</a></p>` : ''}
  `;
}
