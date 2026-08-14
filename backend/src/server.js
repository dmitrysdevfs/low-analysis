// loadEnv раніше за instrument: інакше Sentry.init читає SENTRY_DSN до того,
// як dotenv підвантажить backend/.env, і мовчки стартує без DSN. На хостингу
// це не помітно, бо там змінні лежать в оточенні процесу.
// loadEnv тягне лише dotenv і node:path, тож патчинг модулів Sentry не зачіпає.
import './bootstrap/loadEnv.js';
import './instrument.js';

const { default: app } = await import('./app.js');
const { default: connectDB } = await import('./config/db.js');
const { ensureLocalDevAdmin } =
  await import('./bootstrap/ensureLocalDevAdmin.js');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  await ensureLocalDevAdmin();

  const httpServer = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  });

  const { attachGroupChatWS } =
    await import('./modules/group-chat/groupChat.ws.js');
  attachGroupChatWS(httpServer);

  if (
    process.env.TELEGRAM_WEBHOOK_AUTO_REGISTER === 'true' &&
    process.env.BACKEND_PUBLIC_URL
  ) {
    const { setTelegramWebhook } =
      await import('./modules/support/support.telegram.service.js');
    const webhookUrl = `${process.env.BACKEND_PUBLIC_URL}/api/support/telegram/webhook`;
    setTelegramWebhook(webhookUrl)
      .then(() =>
        console.log(`[telegram] webhook auto-registered: ${webhookUrl}`),
      )
      .catch((err) =>
        console.error('[telegram] webhook auto-register failed:', err.message),
      );
  }
};

startServer().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
