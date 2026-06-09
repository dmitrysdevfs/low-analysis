export function passwordResetTemplate({ resetUrl }) {
  return `
    <h1 style="margin-top:0;">Відновлення паролю</h1>
    <p>Ви запросили скидання паролю для вашого акаунту Law Analysis. Натисніть кнопку нижче, щоб встановити новий пароль.</p>
    <p style="text-align:center;margin-top:24px;">
      <a href="${resetUrl}" class="btn">Встановити новий пароль</a>
    </p>
    <p style="font-size:12px;margin-top:24px;">Посилання дійсне 1 годину. Якщо ви не запитували скидання паролю — просто ігноруйте цей лист.</p>
  `;
}
