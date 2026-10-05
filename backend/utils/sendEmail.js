import nodemailer from 'nodemailer';

const SMTP_TIMEOUT_MS = 10000;

export const sendEmail = async (options) => {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  if (!host || !Number.isInteger(port) || !user || !pass) {
    throw new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });

  try {
    const info = await transporter.sendMail({
      from: user,
      to: options.email,
      subject: options.subject,
      text: options.message,
      ...(options.html ? { html: options.html } : {}),
    });

    console.log('Email accepted by SMTP server:', info.messageId);
  } catch (error) {
    throw new Error(`SMTP email delivery failed: ${error.message}`);
  } finally {
    transporter.close();
  }
};
