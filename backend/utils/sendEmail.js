import nodemailer from 'nodemailer';

const SMTP_CONNECTION_TIMEOUT_MS = 6000;
const SMTP_SOCKET_TIMEOUT_MS = 10000;

export const sendEmail = async (options) => {
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '');

  if (!Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass) {
    throw new Error('Gmail SMTP is not configured. Set SMTP_USER and SMTP_PASS to a Gmail address and its Google App Password.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
  });

  try {
    const info = await transporter.sendMail({
      from: user,
      to: options.email,
      subject: options.subject,
      text: options.message,
      ...(options.html ? { html: options.html } : {}),
    });

    console.log('Email accepted by Gmail SMTP:', info.messageId);
  } catch (error) {
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      throw new Error(
        `Gmail SMTP connection timed out on port ${port}. The hosting provider may block outbound SMTP; use a host that permits Gmail SMTP or enable SMTP egress.`
      );
    }
    throw new Error(`Gmail SMTP delivery failed: ${error.message}`);
  } finally {
    transporter.close();
  }
};
