const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_TIMEOUT_MS = 8000;
const FALLBACK_FROM = 'IdeaPress <onboarding@resend.dev>';

const resolveFromAddress = () => {
  const configured = process.env.EMAIL_FROM?.trim();
  if (!configured) return FALLBACK_FROM;
  if (/your-verified-domain\.com|example\.com/i.test(configured)) return FALLBACK_FROM;
  return configured;
};

export const sendEmail = async (options) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveFromAddress();

  if (!apiKey) {
    throw new Error('Email delivery is not configured. Set RESEND_API_KEY.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [options.email],
        subject: options.subject,
        text: options.message,
        html: options.html,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Email provider rejected the request (HTTP ${response.status}): ${details}`);
    }

    const result = await response.json();
    console.log('Email accepted by provider:', result.id);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Email provider timed out after ${EMAIL_TIMEOUT_MS / 1000} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
