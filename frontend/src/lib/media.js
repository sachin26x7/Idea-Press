const backendUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const getMediaUrl = (value) => {
  if (!value || /^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  return `${backendUrl}${value}`;
};
