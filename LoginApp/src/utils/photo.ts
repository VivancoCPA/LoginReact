/**
 * Resolves relative photo paths to absolute Backend server URLs.
 * Keeps external URLs (http, https) and Base64 Data URIs unchanged.
 */
export const getPhotoFullUrl = (url?: string | null): string => {
  if (!url) return '';
  
  // If url is already absolute or is a Base64 string, return it as is
  if (
    url.startsWith('http://') || 
    url.startsWith('https://') || 
    url.startsWith('data:')
  ) {
    return url;
  }
  
  // Otherwise, prepend the Backend server root URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5043/api';
  const serverUrl = baseUrl.replace(/\/api$/, '');
  
  return `${serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};
