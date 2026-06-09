import * as SibApiV3Sdk from '@getbrevo/brevo';

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const SENDER = {
  email: process.env.BREVO_SENDER_EMAIL,
  name: process.env.BREVO_SENDER_NAME,
};

export async function sendTransactionalEmail({ to, subject, htmlContent }) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = SENDER;
  sendSmtpEmail.to = to; // [{ email, name }]
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
  return response.body;
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
