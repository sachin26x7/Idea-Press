import nodemailer from 'nodemailer';

const SMTP_CONNECTION_TIMEOUT_MS = 8000;
const SMTP_SOCKET_TIMEOUT_MS = 15000;

let transporter;
let senderAddress;

const requiredEmailVariables = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM',
];

const maskEmail = (email) => {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 1)}***@${domain}`;
};

const describeSmtpError = (error) => {
  const code = error?.code || 'SMTP_ERROR';
  const responseCode = error?.responseCode ? ` (${error.responseCode})` : '';
  return `${code}${responseCode}`;
};

export const validateEmailConfig = () => {
  const missing = requiredEmailVariables.filter((name) => !process.env[name]?.trim());
  if (missing.length) {
    throw new Error(`Missing required email configuration: ${missing.map((name) => `${name} is missing`).join(', ')}`);
  }

  const port = Number(process.env.EMAIL_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('EMAIL_PORT must be a valid TCP port number.');
  }

  const emailUser = process.env.EMAIL_USER.trim();
  const from = process.env.EMAIL_FROM.trim();
  const fromMatch = from.match(/^(.*?)\s*<([^<>]+)>$/);
  const address = (fromMatch ? fromMatch[2] : from).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailUser)) {
    throw new Error('EMAIL_USER must be a valid Gmail address.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new Error('EMAIL_FROM must contain a valid sender email address.');
  }

  return { port, emailUser, from };
};

export const initializeEmailService = async () => {
  const { port, emailUser, from } = validateEmailConfig();
  const secure = port === 465;
  senderAddress = from;

  console.log('[EMAIL] Provider: smtp');
  console.log(`[EMAIL] Host: ${process.env.EMAIL_HOST.trim()}`);
  console.log(`[EMAIL] Port: ${port}`);
  console.log(`[EMAIL] User configured: ${Boolean(emailUser)}`);
  console.log(`[EMAIL] Password configured: ${Boolean(process.env.EMAIL_PASS)}`);
  console.log(`[EMAIL] From configured: ${Boolean(from)}`);

  transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 2,
    maxMessages: 100,
    host: process.env.EMAIL_HOST.trim(),
    port,
    secure,
    requireTLS: port === 587,
    auth: {
      user: emailUser,
      pass: process.env.EMAIL_PASS.replace(/\s/g, ''),
    },
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
  });

  try {
    await transporter.verify();
    console.log('[EMAIL] SMTP transporter verification: success');
  } catch (error) {
    console.error(`[EMAIL] SMTP transporter verification failed: ${describeSmtpError(error)}`);
  }
};

export const sendEmail = async ({ email, subject, message, html }) => {
  if (!transporter || !senderAddress) {
    throw new Error('Email service is not initialized.');
  }

  console.log(`[EMAIL] Sending email to: ${maskEmail(email)}`);
  try {
    const info = await transporter.sendMail({
      from: senderAddress,
      to: email,
      subject,
      text: message,
      ...(html ? { html } : {}),
    });
    console.log('[EMAIL] Email sent successfully');
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error(`[EMAIL] SMTP send failed: ${describeSmtpError(error)}`);
    throw new Error('Email delivery failed. Please try again later.');
  }
};
