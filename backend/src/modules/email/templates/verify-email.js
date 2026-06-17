import { escapeHtml } from '../email.utils.js';

export function verifyEmailTemplate({ fullName, verifyUrl }) {
  return `
    <h1 style="margin-top:0;">Ласкаво просимо, ${escapeHtml(fullName)}!</h1>
    <p>Дякуємо за реєстрацію на платформі Law Analysis — зручному інструменті для аналізу законодавства України.</p>
    <p>Будь ласка, підтвердіть вашу адресу електронної пошти, натиснувши кнопку нижче.</p>
    <p style="text-align:center;margin-top:24px;">
      <a href="${verifyUrl}" class="btn">Підтвердити email</a>
    </p>
    <p style="font-size:12px;margin-top:24px;">Посилання дійсне 24 години. Якщо ви не реєструвались — просто ігноруйте цей лист.</p>
  `;
}
