import { upload as imageKitUpload, buildSrc } from '@imagekit/javascript';
import imageKitConfig from '../config/imagekit';

/**
 * Upload a file to ImageKit
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload response
 */
export const uploadFile = async (file, options = {}) => {
  try {
    // Use backend proxy to upload so we don't need token/signature on client
    const formData = new FormData();
    formData.append('file', file);
    formData.append('publicKey', imageKitConfig.publicKey);
    // permit folder override
    if (options.folder) formData.append('folder', options.folder);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Upload failed: ${res.status} ${text}`);
    }

    const response = await res.json();

    const cachedUrl = addCachingParams(response.url);
    return { ...response, cachedUrl };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw error;
  }
};

/**
 * Get optimized image URL with transformation parameters
 * @param {string} url - Original ImageKit URL
 * @param {Object} params - Transformation parameters
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (url, params = {}) => {
  if (!url) return '';

  const defaultParams = { quality: 80, format: 'auto' };
  const transformationParams = { ...defaultParams, ...params };

  try {
    return buildSrc({
      src: url,
      urlEndpoint: imageKitConfig.urlEndpoint,
      transformation: [transformationParams],
    });
  } catch (_) {
    return url;
  }
};

/**
 * Get responsive image URLs for different screen sizes
 * @param {string} url - Original ImageKit URL
 * @returns {Object} - Object with different sized image URLs
 */
export const getResponsiveImageUrls = (url) => {
  if (!url) return {};
  
  return {
    small: getOptimizedImageUrl(url, { width: 400 }),
    medium: getOptimizedImageUrl(url, { width: 800 }),
    large: getOptimizedImageUrl(url, { width: 1200 }),
    original: url
  };
};

/**
 * Add caching parameters to URL
 * @param {string} url - Original URL
 * @returns {string} - URL with caching parameters
 */
const addCachingParams = (url) => {
  if (!url) return '';
  
  // Add cache control for 1 week (604800 seconds)
  const urlObj = new URL(url);
  urlObj.searchParams.set('ik-cache', 'max-age=604800');
  
  return urlObj.toString();
};

export default {
  uploadFile,
  getOptimizedImageUrl,
  getResponsiveImageUrls
};