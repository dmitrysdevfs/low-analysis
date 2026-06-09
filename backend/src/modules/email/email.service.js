import * as BrevoTransactionalEmails from '@getbrevo/brevo/transactionalEmails';

let cachedClient = null;

function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  cachedClient = new BrevoTransactionalEmails.TransactionalEmailsClient({
    apiKey,
  });
  return cachedClient;
}

function getSender() {
  return {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME,
  };
}

export async function sendTransactionalEmail({ to, subject, htmlContent }) {
  const response = await getClient().sendTransacEmail({
    sender: getSender(),
    to,
    subject,
    htmlContent,
  });
  return response.data ?? response.body ?? response;
}

export async function sendBulkEmails({ recipients, subject, htmlContent }) {
  const results = [];
  // Send in batches of 10 to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const promises = batch.map(({ email, name }) =>
      sendTransactionalEmail({ to: [{ email, name }], subject, htmlContent })
        .then((res) => ({ email, success: true, messageId: res?.messageId }))
        .catch((err) => ({ email, success: false, error: err.message })),
    );
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }
  return results;
}
