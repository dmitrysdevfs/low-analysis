import { escapeHtml } from '../email.utils.js';

export function productUpdateTemplate({
  headline,
  body,
  features,
  ctaText,
  ctaUrl,
}) {
  const featureList =
    features && features.length > 0
      ? `<ul style="padding-left:20px;">${features.map((f) => `<li style="color:#8892a4;margin-bottom:8px;">${escapeHtml(f)}</li>`).join('')}</ul>`
      : '';
  return `
    <h1 style="margin-top:0;">${escapeHtml(headline)}</h1>
    <p>${escapeHtml(body)}</p>
    ${featureList}
    ${ctaText && ctaUrl ? `<p style="text-align:center;margin-top:32px;"><a href="${escapeHtml(ctaUrl)}" class="btn">${escapeHtml(ctaText)}</a></p>` : ''}
  `;
}
