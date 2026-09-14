const backendUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_MEDIA_URL || '').replace(/\/$/, '');

export const getMediaUrl = (value) => {
  if (!value || /^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;

  const normalizedPath = `/${String(value).replace(/^\/+/, '').replaceAll('\\', '/')}`;
  return `${backendUrl}${normalizedPath}`;
};
