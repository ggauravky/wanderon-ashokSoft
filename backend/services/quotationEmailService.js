export const sendQuotationVerificationEmail = async ({ email, code, quotationNumber, expiresMinutes = 10 }) => {
  const apiKey = String(process.env.BREVO_API_KEY || '').trim();
  const senderEmail = String(process.env.BREVO_SENDER_EMAIL || '').trim();
  const senderName = String(process.env.BREVO_SENDER_NAME || 'WanderLuxe').trim();
  if (!apiKey || !senderEmail) {
    const error = new Error('Recipient verification email is not configured.');
    error.status = 503;
    throw error;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email }],
      subject: `Verify your WanderLuxe quotation ${quotationNumber}`,
      htmlContent: `<p>Your WanderLuxe quotation verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in ${expiresMinutes} minutes. Do not share it.</p>`
    })
  });
  if (!response.ok) {
    const error = new Error('Unable to send the recipient verification email.');
    error.status = 502;
    throw error;
  }
  return response.json().catch(() => ({}));
};
