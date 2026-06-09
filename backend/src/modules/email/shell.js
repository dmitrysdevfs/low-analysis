export function emailShell({ theme, content, subject, previewText = '' }) {
  const t = theme;
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background: ${t.bg}; font-family: Inter, Arial, sans-serif; color: ${t.text}; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { border-bottom: 1px solid ${t.border}; padding-bottom: 24px; margin-bottom: 32px; }
    .logo { font-size: 20px; font-weight: 700; color: ${t.accent}; letter-spacing: 0.04em; }
    .surface { background: ${t.surface}; border: 1px solid ${t.border}; border-radius: 8px; padding: 32px; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid ${t.border}; font-size: 12px; color: ${t.muted}; text-align: center; }
    .btn { display: inline-block; background: ${t.btnBg}; color: ${t.btnText}; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; }
    h1, h2 { color: ${t.text}; }
    p { color: ${t.muted}; line-height: 1.7; }
    a { color: ${t.accent}; }
  </style>
</head>
<body>
  <div class="preheader" style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Law Analysis</div>
    </div>
    <div class="surface">
      ${content}
    </div>
    <div class="footer">
      <p>Ви отримали цей лист як користувач платформи Law Analysis.</p>
      <p>© ${new Date().getFullYear()} Law Analysis. Всі права захищені.</p>
    </div>
  </div>
</body>
</html>`;
}
