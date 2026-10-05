const RESEND_API_URL = 'https://api.resend.com/emails';
const REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_FROM = 'IdeaPress <onboarding@resend.dev>';

const parseSender = (value) => {
  const match = value.trim().match(/^(.*?)\s*<([^<>]+)>$/);
  const address = (match ? match[2] : value).trim();
  const domain = address.split('@')[1]?.toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new Error('EMAIL_FROM must be a valid email address, optionally with a display name.');
  }
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    throw new Error('EMAIL_FROM must use onboarding@resend.dev or a domain verified with Resend.');
  }

  return match ? `${match[1].trim()} <${address}>` : address;
};

export const validateEmailConfig = () => {
  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error('Missing required environment variable: RESEND_API_KEY');
  }
  if (!process.env.JWT_SECRET && !process.env.OTP_HASH_SECRET) {
    throw new Error('Missing JWT_SECRET or OTP_HASH_SECRET required to protect OTPs.');
  }
  parseSender(process.env.EMAIL_FROM?.trim() || DEFAULT_FROM);
  console.log('[Email] Provider selected: resend');
  console.log('[Email] Configuration: valid');
};

export const sendEmail = async ({ email, subject, message, html }) => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = parseSender(process.env.EMAIL_FROM?.trim() || DEFAULT_FROM);
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) {
    throw new Error('Email recipient address is invalid.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        text: message,
        html,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = (await response.text())
        .slice(0, 500)
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]');
      console.error(`[Email] Resend rejected email with HTTP ${response.status}: ${details}`);
      throw new Error(`Resend request rejected (${response.status})`);
    }

    const result = await response.json();
    console.log('[Email] Message accepted by Resend.');
    return { success: true, id: result.id };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Email] Resend request timed out.');
      throw new Error('Email provider request timed out.');
    }
    if (error.message.startsWith('Resend request rejected')) throw error;
    console.error('[Email] Resend request failed:', error.message);
    throw new Error('Email provider request failed.');
  } finally {
    clearTimeout(timeout);
  }
};
