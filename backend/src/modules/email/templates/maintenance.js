export function maintenanceTemplate({ headline, body, startTime, endTime, ctaText, ctaUrl }) {
  return `
    <h1 style="margin-top:0;">${headline}</h1>
    <p>${body}</p>
    ${startTime ? `<p><strong>Початок:</strong> ${startTime}</p>` : ''}
    ${endTime ? `<p><strong>Завершення:</strong> ${endTime}</p>` : ''}
    ${ctaText && ctaUrl ? `<p style="text-align:center;margin-top:32px;"><a href="${ctaUrl}" class="btn">${ctaText}</a></p>` : ''}
  `;
}
