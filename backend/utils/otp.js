import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

export const generateOTP = () => randomInt(0, 1_000_000).toString().padStart(6, '0');

export const hashOTP = (value) => {
  const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET or OTP_HASH_SECRET must be configured to hash OTPs.');
  return createHmac('sha256', secret).update(value).digest('hex');
};

export const matchesOTP = (provided, storedHash, legacyValue) => {
  if (storedHash) {
    const providedHash = Buffer.from(hashOTP(provided), 'hex');
    const expectedHash = Buffer.from(storedHash, 'hex');
    return providedHash.length === expectedHash.length && timingSafeEqual(providedHash, expectedHash);
  }
  return Boolean(legacyValue) && provided === legacyValue;
};

export const createOtpEmail = ({ purpose, otp, minutesValid }) => {
  const text = `Your IdeaPress ${purpose} code is: ${otp}\nThis code is valid for ${minutesValid} minutes. If you did not request this, you can ignore this email.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;color:#17202a"><h1 style="font-size:22px">IdeaPress ${purpose}</h1><p>Your verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code is valid for ${minutesValid} minutes. If you did not request this, you can ignore this email.</p></div>`;
  return { text, html };
};
