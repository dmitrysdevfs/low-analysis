export function broadcastTemplate({ headline, body, ctaText, ctaUrl }) {
  return `
    <h1 style="margin-top:0;">${headline}</h1>
    <p>${body}</p>
    ${ctaText && ctaUrl ? `<p style="text-align:center;margin-top:32px;"><a href="${ctaUrl}" class="btn">${ctaText}</a></p>` : ''}
  `;
}
